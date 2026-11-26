import fs from "node:fs";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";

/** Marker row in `app_migrations`; its presence means the fresh start already ran. */
export const FRESH_START_MARKER = "ideas-fresh-start";

/**
 * One-time fresh start for Ideas (ADR 0001): deletes every Idea and Ingredient link, clears the
 * Idea on log entries, and deletes the files in the idea-images directory. Log entries and points
 * are kept. No backup.
 *
 * Runs once, behind a marker row. `ideaImagesDir` null leaves image files alone (used when the
 * caller has no images directory, such as a throwaway in-memory database).
 */
export function migrateFreshStart(db: DatabaseSync, ideaImagesDir: string | null): boolean {
  db.exec("CREATE TABLE IF NOT EXISTS app_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)");
  if (db.prepare("SELECT 1 FROM app_migrations WHERE name = ?").get(FRESH_START_MARKER)) return false;

  db.exec("BEGIN IMMEDIATE");
  try {
    db.exec("UPDATE log_entries SET idea_id = NULL WHERE idea_id IS NOT NULL");
    db.exec("DELETE FROM idea_ingredients");
    db.exec("DELETE FROM ideas");
    db.prepare("INSERT INTO app_migrations (name, applied_at) VALUES (?, ?)").run(
      FRESH_START_MARKER,
      new Date().toISOString(),
    );
    db.exec("COMMIT");
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {
      // The transaction may already be closed.
    }
    throw error;
  }

  let removed = 0;
  if (ideaImagesDir && fs.existsSync(ideaImagesDir)) {
    for (const entry of fs.readdirSync(ideaImagesDir, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      fs.rmSync(path.join(ideaImagesDir, entry.name), { force: true });
      removed += 1;
    }
  }
  console.log(`ideas fresh start: deleted every idea and ${removed} idea image files; logs and points kept`);
  return true;
}
