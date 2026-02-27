# SubTracker — Subscription Tracker & Optimizer

A full-featured tool to log, analyze, and optimize all your subscriptions. Track costs, flag underused services, discover cheaper alternatives, and never miss a renewal.

## Features

- **Subscription Management** — Add, edit, and delete subscriptions with cost, billing cycle, renewal date, category, and usage rating
- **Dashboard Analytics** — Total monthly/annual spend, daily cost, and spending breakdown by category with visual bars
- **Underused Detection** — Automatically flags subscriptions with low usage ratings or infrequent usage logs, showing potential annual savings
- **Cheaper Alternatives** — Suggests free and lower-cost alternatives for each subscription based on category and service name
- **Renewal Alerts** — Upcoming renewal timeline with urgency levels (critical/warning/normal) and configurable lookahead period
- **Usage Tracking** — Log daily usage per subscription to build a usage profile over time

## Quick Start

```bash
npm install
npm run seed    # Load sample data (15 subscriptions)
npm start       # Launch at http://localhost:3000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscriptions` | List all subscriptions (filter by `?status=`, `?category=`, `?sort=`) |
| GET | `/api/subscriptions/:id` | Get subscription details with recent usage count |
| POST | `/api/subscriptions` | Create a new subscription |
| PUT | `/api/subscriptions/:id` | Update a subscription |
| DELETE | `/api/subscriptions/:id` | Delete a subscription |
| POST | `/api/subscriptions/:id/usage` | Log a usage event |
| GET | `/api/subscriptions/:id/usage` | Get usage history (`?days=30`) |
| GET | `/api/analytics/summary` | Dashboard summary (totals, category breakdown) |
| GET | `/api/analytics/underused` | Flagged underused subscriptions |
| GET | `/api/analytics/alternatives` | Cheaper alternatives for active subscriptions |
| GET | `/api/analytics/renewals` | Upcoming renewals (`?days=30`) |
| GET | `/api/categories` | List all categories |

## Tech Stack

- **Backend:** Node.js + Express
- **Database:** SQLite (via better-sqlite3)
- **Frontend:** Vanilla HTML/CSS/JS (single-page app, no build step)
