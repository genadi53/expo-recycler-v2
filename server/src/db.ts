import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { seedIfEmpty } from "./seed.js";

export type DB = DatabaseSync;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  aliases TEXT NOT NULL DEFAULT '[]',
  category_id TEXT NOT NULL REFERENCES categories(id),
  summary TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('published', 'pending')),
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS items_name_lower ON items(lower(name));

CREATE TABLE IF NOT EXISTS ideas (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES items(id),
  kind TEXT NOT NULL CHECK (kind IN ('cook', 'beauty', 'art', 'useful')),
  title TEXT NOT NULL,
  materials TEXT NOT NULL,
  steps TEXT NOT NULL,
  author_profile_id TEXT REFERENCES profiles(id),
  status TEXT NOT NULL CHECK (status IN ('published', 'pending')),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS disposals (
  id TEXT PRIMARY KEY,
  item_id TEXT REFERENCES items(id),
  category_id TEXT REFERENCES categories(id),
  method TEXT NOT NULL CHECK (method IN ('recycle', 'compost', 'drop-off', 'hazardous', 'trash')),
  title TEXT NOT NULL,
  steps TEXT NOT NULL,
  CHECK (item_id IS NOT NULL OR category_id IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS disposals_item ON disposals(item_id) WHERE item_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS disposals_category_fallback ON disposals(category_id) WHERE item_id IS NULL;

CREATE TABLE IF NOT EXISTS log_entries (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id),
  item_id TEXT NOT NULL REFERENCES items(id),
  action TEXT NOT NULL CHECK (action IN ('reuse', 'dispose')),
  idea_id TEXT REFERENCES ideas(id),
  disposal_method TEXT,
  points_awarded INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS log_entries_profile ON log_entries(profile_id, created_at);

CREATE TABLE IF NOT EXISTS badges (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  rule TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS profile_badges (
  profile_id TEXT NOT NULL REFERENCES profiles(id),
  badge_slug TEXT NOT NULL REFERENCES badges(slug),
  unlocked_at TEXT NOT NULL,
  PRIMARY KEY (profile_id, badge_slug)
);
`;

export function openDatabase(file = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "recycler.db")): DB {
  if (file !== ":memory:") {
    fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  }
  const db = new DatabaseSync(file);
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("PRAGMA busy_timeout = 3000");
  if (file !== ":memory:") {
    db.exec("PRAGMA journal_mode = WAL");
  }
  db.exec(SCHEMA);
  seedIfEmpty(db);
  return db;
}

export function withTransaction<T>(db: DB, fn: () => T): T {
  db.exec("BEGIN IMMEDIATE");
  try {
    const value = fn();
    db.exec("COMMIT");
    return value;
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {
      // The transaction may already be closed.
    }
    throw error;
  }
}

export function slugify(name: string): string {
  const base = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "item";
}

export function uniqueItemId(db: DB, name: string): string {
  const base = slugify(name);
  let id = base;
  let n = 2;
  while (db.prepare("SELECT 1 FROM items WHERE id = ?").get(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  return id;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }
  if (typeof value !== "string" || value.trim() === "") return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((entry): entry is string => typeof entry === "string");
    }
  } catch {
    return [value];
  }
  return [value];
}
