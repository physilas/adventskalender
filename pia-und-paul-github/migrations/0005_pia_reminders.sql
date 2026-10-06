CREATE TABLE reminders (
  partner TEXT PRIMARY KEY CHECK (partner IN ('pia', 'paul')),
  enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0, 1)),
  reminder_time TEXT NOT NULL DEFAULT '09:00',
  endpoint TEXT,
  last_sent_year INTEGER,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
