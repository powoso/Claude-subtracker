const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'subscriptions.db');

function getDb() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

function initialize() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Other',
      cost REAL NOT NULL,
      billing_cycle TEXT NOT NULL DEFAULT 'monthly',
      renewal_date TEXT NOT NULL,
      usage_rating INTEGER NOT NULL DEFAULT 3,
      notes TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS usage_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER NOT NULL,
      used_date TEXT NOT NULL DEFAULT (date('now')),
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS alternatives (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      current_service TEXT NOT NULL,
      alternative_name TEXT NOT NULL,
      alternative_cost REAL NOT NULL,
      alternative_billing TEXT NOT NULL DEFAULT 'monthly',
      description TEXT DEFAULT '',
      url TEXT DEFAULT ''
    );
  `);

  // Seed alternatives table if empty
  const count = db.prepare('SELECT COUNT(*) as cnt FROM alternatives').get();
  if (count.cnt === 0) {
    seedAlternatives(db);
  }

  db.close();
}

function seedAlternatives(db) {
  const alternatives = [
    // Streaming
    ['Streaming', 'Netflix', 'Tubi', 0, 'monthly', 'Free ad-supported streaming with a large library', 'https://tubitv.com'],
    ['Streaming', 'Netflix', 'Pluto TV', 0, 'monthly', 'Free ad-supported live TV and on-demand', 'https://pluto.tv'],
    ['Streaming', 'Hulu', 'Tubi', 0, 'monthly', 'Free ad-supported streaming alternative', 'https://tubitv.com'],
    ['Streaming', 'HBO Max', 'Kanopy', 0, 'monthly', 'Free with library card — great for films and documentaries', 'https://kanopy.com'],
    ['Streaming', 'Disney+', 'Crackle', 0, 'monthly', 'Free ad-supported streaming', 'https://crackle.com'],
    ['Streaming', 'Apple TV+', 'Pluto TV', 0, 'monthly', 'Free live TV and on-demand content', 'https://pluto.tv'],
    // Music
    ['Music', 'Spotify', 'YouTube Music (Free)', 0, 'monthly', 'Free tier with ads', 'https://music.youtube.com'],
    ['Music', 'Spotify', 'Spotify Free', 0, 'monthly', 'Downgrade to free tier with ads', 'https://spotify.com'],
    ['Music', 'Apple Music', 'YouTube Music (Free)', 0, 'monthly', 'Free tier available with ads', 'https://music.youtube.com'],
    // Cloud Storage
    ['Cloud Storage', 'Dropbox', 'Google Drive (Free 15GB)', 0, 'monthly', 'Free 15GB cloud storage', 'https://drive.google.com'],
    ['Cloud Storage', 'iCloud+', 'Google Drive (Free 15GB)', 0, 'monthly', 'Free 15GB storage across services', 'https://drive.google.com'],
    // Productivity
    ['Productivity', 'Microsoft 365', 'LibreOffice', 0, 'monthly', 'Free and open-source office suite', 'https://libreoffice.org'],
    ['Productivity', 'Microsoft 365', 'Google Workspace (Free)', 0, 'monthly', 'Free Docs, Sheets, Slides', 'https://workspace.google.com'],
    ['Productivity', 'Notion', 'Obsidian', 0, 'monthly', 'Free local-first note-taking with markdown', 'https://obsidian.md'],
    ['Productivity', 'Evernote', 'Notion Free', 0, 'monthly', 'Free tier for personal use', 'https://notion.so'],
    // Fitness
    ['Fitness', 'Peloton', 'Nike Training Club', 0, 'monthly', 'Free workout plans and video workouts', 'https://nike.com/ntc-app'],
    ['Fitness', 'ClassPass', 'YouTube Fitness', 0, 'monthly', 'Free workout videos from top trainers', 'https://youtube.com'],
    ['Fitness', 'Gym Membership', 'Home Workouts (Bodyweight)', 0, 'monthly', 'No equipment needed — follow free YouTube routines', ''],
    // VPN
    ['Security', 'NordVPN', 'ProtonVPN (Free)', 0, 'monthly', 'Free tier with no data limit', 'https://protonvpn.com'],
    ['Security', 'ExpressVPN', 'Windscribe (Free)', 0, 'monthly', 'Free 10GB/month VPN', 'https://windscribe.com'],
    // Design
    ['Design', 'Adobe Creative Cloud', 'GIMP + Inkscape', 0, 'monthly', 'Free open-source alternatives to Photoshop + Illustrator', 'https://gimp.org'],
    ['Design', 'Canva Pro', 'Canva Free', 0, 'monthly', 'Free tier with many templates', 'https://canva.com'],
    ['Design', 'Figma', 'Penpot', 0, 'monthly', 'Free open-source design & prototyping tool', 'https://penpot.app'],
    // Developer Tools
    ['Developer Tools', 'GitHub Pro', 'GitHub Free', 0, 'monthly', 'Free tier includes unlimited repos', 'https://github.com'],
    ['Developer Tools', 'JetBrains', 'VS Code', 0, 'monthly', 'Free and extensible code editor', 'https://code.visualstudio.com'],
    // Communication
    ['Communication', 'Slack Pro', 'Slack Free', 0, 'monthly', 'Free tier with message history limits', 'https://slack.com'],
    ['Communication', 'Zoom Pro', 'Google Meet (Free)', 0, 'monthly', 'Free video calls up to 60 minutes', 'https://meet.google.com'],
    // News & Reading
    ['News', 'New York Times', 'AP News', 0, 'monthly', 'Free unbiased news coverage', 'https://apnews.com'],
    ['News', 'Wall Street Journal', 'Reuters', 0, 'monthly', 'Free global news source', 'https://reuters.com'],
    // Gaming
    ['Gaming', 'Xbox Game Pass', 'Epic Games Free', 0, 'monthly', 'Free weekly games on Epic Store', 'https://store.epicgames.com'],
    ['Gaming', 'PlayStation Plus', 'Steam Free-to-Play', 0, 'monthly', 'Large library of free-to-play games', 'https://store.steampowered.com'],
  ];

  const stmt = db.prepare(
    'INSERT INTO alternatives (category, current_service, alternative_name, alternative_cost, alternative_billing, description, url) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      stmt.run(...row);
    }
  });

  insertMany(alternatives);
}

module.exports = { getDb, initialize };
