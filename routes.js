const express = require('express');
const { getDb } = require('./db');

const router = express.Router();

// ─── Subscriptions CRUD ─────────────────────────────────────────────────────

// List all subscriptions (with optional filters)
router.get('/subscriptions', (req, res) => {
  const db = getDb();
  const { status, category, sort } = req.query;

  let query = 'SELECT * FROM subscriptions WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  const sortOptions = {
    cost_asc: 'cost ASC',
    cost_desc: 'cost DESC',
    renewal: 'renewal_date ASC',
    name: 'name ASC',
    usage: 'usage_rating ASC',
  };
  query += ` ORDER BY ${sortOptions[sort] || 'created_at DESC'}`;

  const subscriptions = db.prepare(query).all(...params);
  db.close();
  res.json(subscriptions);
});

// Get a single subscription
router.get('/subscriptions/:id', (req, res) => {
  const db = getDb();
  const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(req.params.id);
  if (!sub) {
    db.close();
    return res.status(404).json({ error: 'Subscription not found' });
  }

  // Get usage log count for last 30 days
  const usageCount = db.prepare(
    `SELECT COUNT(*) as count FROM usage_logs
     WHERE subscription_id = ? AND used_date >= date('now', '-30 days')`
  ).get(req.params.id);

  db.close();
  res.json({ ...sub, recent_usage_count: usageCount.count });
});

// Create a subscription
router.post('/subscriptions', (req, res) => {
  const { name, category, cost, billing_cycle, renewal_date, usage_rating, notes } = req.body;

  if (!name || cost === undefined || !renewal_date) {
    return res.status(400).json({ error: 'name, cost, and renewal_date are required' });
  }

  const db = getDb();
  const result = db.prepare(
    `INSERT INTO subscriptions (name, category, cost, billing_cycle, renewal_date, usage_rating, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    name,
    category || 'Other',
    cost,
    billing_cycle || 'monthly',
    renewal_date,
    usage_rating ?? 3,
    notes || ''
  );

  const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(result.lastInsertRowid);
  db.close();
  res.status(201).json(sub);
});

// Update a subscription
router.put('/subscriptions/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(req.params.id);
  if (!existing) {
    db.close();
    return res.status(404).json({ error: 'Subscription not found' });
  }

  const { name, category, cost, billing_cycle, renewal_date, usage_rating, notes, status } = req.body;

  db.prepare(
    `UPDATE subscriptions SET
       name = ?, category = ?, cost = ?, billing_cycle = ?,
       renewal_date = ?, usage_rating = ?, notes = ?, status = ?,
       updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    name ?? existing.name,
    category ?? existing.category,
    cost ?? existing.cost,
    billing_cycle ?? existing.billing_cycle,
    renewal_date ?? existing.renewal_date,
    usage_rating ?? existing.usage_rating,
    notes ?? existing.notes,
    status ?? existing.status,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(req.params.id);
  db.close();
  res.json(updated);
});

// Delete a subscription
router.delete('/subscriptions/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM subscriptions WHERE id = ?').run(req.params.id);
  db.close();
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Subscription not found' });
  }
  res.json({ message: 'Subscription deleted' });
});

// ─── Usage Logging ──────────────────────────────────────────────────────────

// Log usage for a subscription
router.post('/subscriptions/:id/usage', (req, res) => {
  const db = getDb();
  const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(req.params.id);
  if (!sub) {
    db.close();
    return res.status(404).json({ error: 'Subscription not found' });
  }

  const date = req.body.date || new Date().toISOString().split('T')[0];
  db.prepare('INSERT INTO usage_logs (subscription_id, used_date) VALUES (?, ?)').run(req.params.id, date);
  db.close();
  res.status(201).json({ message: 'Usage logged', date });
});

// Get usage history for a subscription
router.get('/subscriptions/:id/usage', (req, res) => {
  const db = getDb();
  const days = parseInt(req.query.days) || 30;
  const logs = db.prepare(
    `SELECT used_date, COUNT(*) as times FROM usage_logs
     WHERE subscription_id = ? AND used_date >= date('now', '-' || ? || ' days')
     GROUP BY used_date ORDER BY used_date DESC`
  ).all(req.params.id, days);
  db.close();
  res.json(logs);
});

// ─── Analytics & Dashboard ──────────────────────────────────────────────────

// Dashboard summary
router.get('/analytics/summary', (req, res) => {
  const db = getDb();

  const active = db.prepare("SELECT * FROM subscriptions WHERE status = 'active'").all();

  let totalMonthly = 0;
  for (const sub of active) {
    totalMonthly += toMonthly(sub.cost, sub.billing_cycle);
  }

  const totalAnnual = totalMonthly * 12;

  const byCategory = {};
  for (const sub of active) {
    const monthly = toMonthly(sub.cost, sub.billing_cycle);
    if (!byCategory[sub.category]) {
      byCategory[sub.category] = { count: 0, monthly: 0 };
    }
    byCategory[sub.category].count++;
    byCategory[sub.category].monthly += monthly;
  }

  // Convert to array sorted by spend
  const categoryBreakdown = Object.entries(byCategory)
    .map(([category, data]) => ({
      category,
      count: data.count,
      monthly_cost: round(data.monthly),
      annual_cost: round(data.monthly * 12),
    }))
    .sort((a, b) => b.monthly_cost - a.monthly_cost);

  db.close();
  res.json({
    active_count: active.length,
    total_monthly: round(totalMonthly),
    total_annual: round(totalAnnual),
    total_daily: round(totalMonthly / 30),
    category_breakdown: categoryBreakdown,
  });
});

// Underused subscriptions (usage_rating <= 2 or low usage logs)
router.get('/analytics/underused', (req, res) => {
  const db = getDb();

  const subs = db.prepare(`
    SELECT s.*,
      (SELECT COUNT(*) FROM usage_logs u
       WHERE u.subscription_id = s.id AND u.used_date >= date('now', '-30 days')
      ) as usage_last_30_days
    FROM subscriptions s
    WHERE s.status = 'active'
      AND (s.usage_rating <= 2
        OR (SELECT COUNT(*) FROM usage_logs u
            WHERE u.subscription_id = s.id AND u.used_date >= date('now', '-30 days')) <= 2)
    ORDER BY s.cost DESC
  `).all();

  const flagged = subs.map(sub => ({
    ...sub,
    monthly_cost: round(toMonthly(sub.cost, sub.billing_cycle)),
    reason: sub.usage_rating <= 2
      ? `Low usage rating (${sub.usage_rating}/5)`
      : `Only used ${sub.usage_last_30_days} time(s) in the last 30 days`,
    potential_annual_savings: round(toMonthly(sub.cost, sub.billing_cycle) * 12),
  }));

  const totalSavings = flagged.reduce((sum, s) => sum + s.potential_annual_savings, 0);

  db.close();
  res.json({
    flagged_count: flagged.length,
    potential_annual_savings: round(totalSavings),
    subscriptions: flagged,
  });
});

// Cheaper alternatives for current subscriptions
router.get('/analytics/alternatives', (req, res) => {
  const db = getDb();

  const subs = db.prepare("SELECT * FROM subscriptions WHERE status = 'active'").all();
  const allAlts = db.prepare('SELECT * FROM alternatives').all();

  const suggestions = [];
  for (const sub of subs) {
    const matches = allAlts.filter(
      a => a.current_service.toLowerCase() === sub.name.toLowerCase()
        || a.category.toLowerCase() === sub.category.toLowerCase()
    );

    if (matches.length > 0) {
      const monthlyCost = toMonthly(sub.cost, sub.billing_cycle);
      suggestions.push({
        subscription: sub.name,
        current_monthly_cost: round(monthlyCost),
        alternatives: matches.map(a => ({
          name: a.alternative_name,
          monthly_cost: round(toMonthly(a.alternative_cost, a.alternative_billing)),
          monthly_savings: round(monthlyCost - toMonthly(a.alternative_cost, a.alternative_billing)),
          description: a.description,
          url: a.url,
        })).sort((a, b) => b.monthly_savings - a.monthly_savings),
      });
    }
  }

  db.close();
  res.json(suggestions);
});

// Upcoming renewals
router.get('/analytics/renewals', (req, res) => {
  const db = getDb();
  const daysAhead = parseInt(req.query.days) || 30;

  const today = new Date().toISOString().split('T')[0];

  const subs = db.prepare(
    `SELECT * FROM subscriptions
     WHERE status = 'active'
     ORDER BY renewal_date ASC`
  ).all();

  // Calculate upcoming renewals considering billing cycles
  const upcoming = [];
  const now = new Date();

  for (const sub of subs) {
    const nextRenewal = getNextRenewal(sub.renewal_date, sub.billing_cycle);
    const daysUntil = Math.ceil((nextRenewal - now) / (1000 * 60 * 60 * 24));

    if (daysUntil <= daysAhead && daysUntil >= 0) {
      let urgency = 'normal';
      if (daysUntil <= 3) urgency = 'critical';
      else if (daysUntil <= 7) urgency = 'warning';

      upcoming.push({
        ...sub,
        next_renewal: nextRenewal.toISOString().split('T')[0],
        days_until_renewal: daysUntil,
        urgency,
        monthly_cost: round(toMonthly(sub.cost, sub.billing_cycle)),
      });
    }
  }

  db.close();
  res.json({
    upcoming_count: upcoming.length,
    days_checked: daysAhead,
    renewals: upcoming.sort((a, b) => a.days_until_renewal - b.days_until_renewal),
  });
});

// Get all categories
router.get('/categories', (req, res) => {
  const db = getDb();
  const categories = db.prepare(
    'SELECT DISTINCT category FROM subscriptions ORDER BY category'
  ).all();
  db.close();
  res.json(categories.map(c => c.category));
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function toMonthly(cost, cycle) {
  switch (cycle) {
    case 'weekly': return cost * 4.33;
    case 'monthly': return cost;
    case 'quarterly': return cost / 3;
    case 'semi-annual': return cost / 6;
    case 'annual': return cost / 12;
    default: return cost;
  }
}

function round(n) {
  return Math.round(n * 100) / 100;
}

function getNextRenewal(renewalDate, billingCycle) {
  const now = new Date();
  let next = new Date(renewalDate + 'T00:00:00');

  const increments = {
    weekly: () => next.setDate(next.getDate() + 7),
    monthly: () => next.setMonth(next.getMonth() + 1),
    quarterly: () => next.setMonth(next.getMonth() + 3),
    'semi-annual': () => next.setMonth(next.getMonth() + 6),
    annual: () => next.setFullYear(next.getFullYear() + 1),
  };

  const increment = increments[billingCycle] || increments.monthly;

  // Advance until the renewal date is in the future
  while (next <= now) {
    increment();
  }

  return next;
}

module.exports = router;
