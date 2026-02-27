# SubTracker — Subscription Tracker & Optimizer

A beautiful, full-featured web application to log, analyze, and optimize all your subscriptions. Track costs, flag underused services, discover cheaper alternatives, and never miss a renewal.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## Features

- **Dashboard Analytics** — Total monthly/annual spend, daily cost breakdown, interactive donut chart, and spending by category with visual progress bars
- **Subscription Management** — Full CRUD with categories, billing cycles, renewal dates, usage ratings, status tracking, and notes
- **Underused Detection** — Automatically flags subscriptions with low usage ratings or infrequent usage logs, showing potential annual savings
- **Cheaper Alternatives** — Built-in database of 30+ free and lower-cost alternatives with direct links and savings calculations
- **Renewal Alerts** — Upcoming renewal timeline with urgency levels (critical/warning/normal) and configurable lookahead (7–90 days)
- **Usage Tracking** — Log daily usage per subscription to build usage profiles over time
- **Modern UI** — Dark theme with glassmorphism, SVG icons, smooth animations, responsive design for mobile/tablet/desktop

---

## Screenshots

| Dashboard | Subscriptions | Alternatives |
|-----------|--------------|--------------|
| Stats, donut chart, category bars | Full table with filtering | Free/cheaper options |

---

## Installation on macOS

### Prerequisites

You need **Node.js** (version 18 or higher) and **npm** installed on your Mac. Follow one of the methods below.

### Step 1: Install Node.js

#### Option A: Using Homebrew (Recommended)

[Homebrew](https://brew.sh) is the most popular package manager for macOS. If you don't have it installed yet:

```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node
```

#### Option B: Using the Official Installer

1. Go to [https://nodejs.org](https://nodejs.org)
2. Download the **macOS Installer** (.pkg) — choose the LTS version
3. Double-click the downloaded `.pkg` file
4. Follow the installation wizard (click Continue/Install)
5. Enter your password when prompted

#### Option C: Using nvm (Node Version Manager)

This is best if you need to manage multiple Node.js versions:

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# Restart your terminal, then install Node.js
nvm install --lts
nvm use --lts
```

#### Verify Installation

After installing Node.js using any method above, verify it works:

```bash
node --version    # Should show v18.x.x or higher
npm --version     # Should show 9.x.x or higher
```

### Step 2: Clone the Repository

```bash
# Clone the project
git clone https://github.com/powoso/Claude-subtracker.git

# Navigate into the project directory
cd Claude-subtracker
```

### Step 3: Install Dependencies

```bash
npm install
```

This will install Express (web server) and better-sqlite3 (database).

> **Note for Apple Silicon Macs (M1/M2/M3/M4):** The `better-sqlite3` package includes native binaries. If you encounter build errors, make sure you have Xcode Command Line Tools installed:
> ```bash
> xcode-select --install
> ```

### Step 4: Seed Sample Data (Optional)

Load 15 realistic sample subscriptions to explore the app immediately:

```bash
npm run seed
```

### Step 5: Start the Application

```bash
npm start
```

The app will start and display:

```
SubTracker running at http://localhost:3000
```

### Step 6: Open in Your Browser

Open [http://localhost:3000](http://localhost:3000) in Safari, Chrome, Firefox, or any modern browser.

---

## Quick Start (TL;DR)

```bash
# One-liner setup (after cloning)
npm install && npm run seed && npm start
```

Then open [http://localhost:3000](http://localhost:3000).

---

## Usage Guide

### Adding a Subscription

1. Click the **"+ Add Subscription"** button in the top-right corner
2. Fill in the name, category, cost, billing cycle, renewal date, and usage rating
3. Click **"Add Subscription"**

### Tracking Usage

- In the **Subscriptions** tab, click the **+** button next to any subscription to log that you used it today
- Higher usage counts prevent subscriptions from being flagged as underused

### Viewing Analytics

- **Dashboard** — See your total monthly/annual spend, spending by category (bar chart + donut chart), and upcoming renewals
- **Underused** — View flagged subscriptions with low usage and see how much you could save by cancelling them
- **Alternatives** — Browse free and cheaper alternatives to your current subscriptions
- **Renewals** — See all upcoming renewals with urgency indicators, configurable from 7 to 90 days ahead

### Managing Subscriptions

- **Edit** — Click the pencil icon to modify any subscription details
- **Delete** — Click the trash icon to permanently remove a subscription (with confirmation)
- **Cancel** — Mark underused subscriptions as cancelled directly from the Underused tab
- **Filter** — Use the category and status dropdowns in the Subscriptions tab to filter the list

---

## API Reference

All API endpoints return JSON and are prefixed with `/api`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/subscriptions` | List all subscriptions (filter: `?status=`, `?category=`, `?sort=`) |
| `GET` | `/api/subscriptions/:id` | Get a subscription with recent usage count |
| `POST` | `/api/subscriptions` | Create a new subscription |
| `PUT` | `/api/subscriptions/:id` | Update a subscription |
| `DELETE` | `/api/subscriptions/:id` | Delete a subscription |
| `POST` | `/api/subscriptions/:id/usage` | Log a usage event for today |
| `GET` | `/api/subscriptions/:id/usage` | Get usage history (`?days=30`) |
| `GET` | `/api/analytics/summary` | Dashboard stats (totals, category breakdown) |
| `GET` | `/api/analytics/underused` | Flagged underused subscriptions with savings |
| `GET` | `/api/analytics/alternatives` | Cheaper alternatives for active subscriptions |
| `GET` | `/api/analytics/renewals` | Upcoming renewals (`?days=30`) |
| `GET` | `/api/categories` | List all distinct categories |

---

## Project Structure

```
Claude-subtracker/
  server.js          # Express server entry point
  db.js              # SQLite database setup, schema, and alternatives seed data
  routes.js          # All API route handlers and analytics logic
  seed.js            # Sample data seeder (15 subscriptions + usage logs)
  package.json       # Project metadata and dependencies
  public/
    index.html       # Single-page frontend application
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js 18+ |
| **Server** | Express 4.x |
| **Database** | SQLite via better-sqlite3 |
| **Frontend** | Vanilla HTML, CSS, JavaScript (no build step) |
| **Styling** | Custom CSS with glassmorphism, CSS variables, responsive grid |
| **Icons** | Inline SVG icon system (Feather-style) |

---

## Troubleshooting

### `command not found: node`
Node.js is not installed or not in your PATH. Follow the installation steps above.

### `command not found: git`
Install Git via Homebrew: `brew install git` or install Xcode Command Line Tools: `xcode-select --install`

### Build errors with `better-sqlite3`
This is a native module that needs to compile. Ensure you have:
```bash
xcode-select --install    # Install Xcode Command Line Tools
npm rebuild better-sqlite3 # Rebuild the native module
```

### Port 3000 already in use
Another process is using port 3000. Either stop it or use a different port:
```bash
PORT=8080 npm start
```

### Database reset
To start fresh, delete the database file and re-seed:
```bash
rm subscriptions.db
npm run seed
npm start
```

---

## License

MIT
