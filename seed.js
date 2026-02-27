const { getDb, initialize } = require('./db');

initialize();

const db = getDb();

// Clear existing subscriptions and usage logs
db.exec('DELETE FROM usage_logs');
db.exec('DELETE FROM subscriptions');

const subscriptions = [
  { name: 'Netflix', category: 'Streaming', cost: 15.49, billing_cycle: 'monthly', renewal_date: '2026-03-05', usage_rating: 4, notes: 'Standard plan with ads-free' },
  { name: 'Spotify', category: 'Music', cost: 11.99, billing_cycle: 'monthly', renewal_date: '2026-03-12', usage_rating: 5, notes: 'Premium individual plan' },
  { name: 'Adobe Creative Cloud', category: 'Design', cost: 59.99, billing_cycle: 'monthly', renewal_date: '2026-03-01', usage_rating: 2, notes: 'Full suite — only using Photoshop occasionally' },
  { name: 'Gym Membership', category: 'Fitness', cost: 49.99, billing_cycle: 'monthly', renewal_date: '2026-03-15', usage_rating: 1, notes: 'Haven\'t been in weeks' },
  { name: 'ChatGPT Plus', category: 'Productivity', cost: 20.00, billing_cycle: 'monthly', renewal_date: '2026-03-08', usage_rating: 4, notes: 'GPT-4 access' },
  { name: 'iCloud+', category: 'Cloud Storage', cost: 2.99, billing_cycle: 'monthly', renewal_date: '2026-03-20', usage_rating: 5, notes: '200GB plan' },
  { name: 'Disney+', category: 'Streaming', cost: 13.99, billing_cycle: 'monthly', renewal_date: '2026-03-03', usage_rating: 1, notes: 'Signed up for a show, haven\'t used since' },
  { name: 'NordVPN', category: 'Security', cost: 71.88, billing_cycle: 'annual', renewal_date: '2026-08-15', usage_rating: 3, notes: '2-year plan' },
  { name: 'GitHub Pro', category: 'Developer Tools', cost: 4.00, billing_cycle: 'monthly', renewal_date: '2026-03-10', usage_rating: 5, notes: 'For private repos and CI' },
  { name: 'New York Times', category: 'News', cost: 17.00, billing_cycle: 'monthly', renewal_date: '2026-03-18', usage_rating: 2, notes: 'Digital all-access — rarely read' },
  { name: 'Notion', category: 'Productivity', cost: 10.00, billing_cycle: 'monthly', renewal_date: '2026-03-22', usage_rating: 4, notes: 'Personal Pro plan' },
  { name: 'Xbox Game Pass', category: 'Gaming', cost: 16.99, billing_cycle: 'monthly', renewal_date: '2026-03-07', usage_rating: 3, notes: 'Ultimate plan' },
  { name: 'Slack Pro', category: 'Communication', cost: 87.50, billing_cycle: 'annual', renewal_date: '2026-06-01', usage_rating: 5, notes: 'Workspace for side project' },
  { name: 'Figma', category: 'Design', cost: 15.00, billing_cycle: 'monthly', renewal_date: '2026-03-25', usage_rating: 2, notes: 'Professional plan — barely used' },
  { name: 'Amazon Prime', category: 'Shopping', cost: 139.00, billing_cycle: 'annual', renewal_date: '2026-07-10', usage_rating: 4, notes: 'Free shipping + Prime Video' },
];

const insertSub = db.prepare(
  `INSERT INTO subscriptions (name, category, cost, billing_cycle, renewal_date, usage_rating, notes)
   VALUES (@name, @category, @cost, @billing_cycle, @renewal_date, @usage_rating, @notes)`
);

const insertUsage = db.prepare(
  'INSERT INTO usage_logs (subscription_id, used_date) VALUES (?, ?)'
);

const insertAll = db.transaction(() => {
  for (const sub of subscriptions) {
    const result = insertSub.run(sub);
    const subId = result.lastInsertRowid;

    // Generate some usage logs for the past 30 days based on usage_rating
    const now = new Date();
    const usageFrequency = sub.usage_rating; // 1-5
    for (let day = 0; day < 30; day++) {
      // Higher usage_rating = more frequent usage logs
      if (Math.random() < usageFrequency / 7) {
        const date = new Date(now);
        date.setDate(date.getDate() - day);
        insertUsage.run(subId, date.toISOString().split('T')[0]);
      }
    }
  }
});

insertAll();

// Show summary
const total = db.prepare('SELECT COUNT(*) as count FROM subscriptions').get();
const usageLogs = db.prepare('SELECT COUNT(*) as count FROM usage_logs').get();

console.log(`Seeded ${total.count} subscriptions with ${usageLogs.count} usage log entries.`);
console.log('\nSubscriptions added:');

const all = db.prepare('SELECT name, category, cost, billing_cycle, usage_rating FROM subscriptions ORDER BY name').all();
for (const s of all) {
  console.log(`  ${s.name} (${s.category}) — $${s.cost}/${s.billing_cycle} — Usage: ${'★'.repeat(s.usage_rating)}${'☆'.repeat(5 - s.usage_rating)}`);
}

db.close();
console.log('\nDone! Run `npm start` to launch the app.');
