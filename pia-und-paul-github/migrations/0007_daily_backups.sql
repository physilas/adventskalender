CREATE TABLE backups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  backup_date TEXT NOT NULL UNIQUE,
  content_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE backup_media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  backup_id INTEGER NOT NULL,
  key TEXT NOT NULL,
  owner TEXT NOT NULL CHECK (owner IN ('pia', 'paul')),
  mime_type TEXT NOT NULL,
  body BLOB NOT NULL,
  UNIQUE (backup_id, key)
);

CREATE INDEX backup_media_backup_id ON backup_media (backup_id);
