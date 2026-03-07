-- Initial schema for mir snippets registry
CREATE TABLE IF NOT EXISTS snippets (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL UNIQUE,
  version      TEXT,
  description  TEXT,
  tags         TEXT,         -- JSON array: ["tag1", "tag2"]
  variables    TEXT,         -- JSON object: {"var1": {...}, "var2": {...}}
  dependencies TEXT,         -- JSON array: ["dep1", "dep2"]
  hooks        TEXT,         -- JSON object: {"pre": "...", "post": "..."}
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS snippet_files (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  snippet_id  INTEGER NOT NULL REFERENCES snippets(id) ON DELETE CASCADE,
  file_path   TEXT NOT NULL,
  content     TEXT NOT NULL,
  UNIQUE(snippet_id, file_path)
);

CREATE TABLE IF NOT EXISTS snippet_versions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  snippet_id   INTEGER NOT NULL REFERENCES snippets(id) ON DELETE CASCADE,
  version      TEXT NOT NULL,
  description  TEXT,
  published_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_snippets_name ON snippets(name);
CREATE INDEX idx_snippet_files_snippet_id ON snippet_files(snippet_id);
CREATE INDEX idx_snippet_versions_snippet_id ON snippet_versions(snippet_id);
