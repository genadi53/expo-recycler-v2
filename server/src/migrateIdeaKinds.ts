import path from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { IDEA_KINDS } from "./rules.js";

/**
 * The `ideas` table. Shared by the fresh-database schema and the idea-kinds rebuild so both
 * produce the same table (columns, order and CHECK constraints).
 */
export function ideasTableSql(name: string, ifNotExists = false): string {
  const kinds = IDEA_KINDS.map((kind) => `'${kind}'`).join(", ");
  return `CREATE TABLE ${ifNotExists ? "IF NOT EXISTS " : ""}${name} (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES items(id),
  kind TEXT NOT NULL CHECK (kind IN (${kinds})),
  title TEXT NOT NULL,
  materials TEXT NOT NULL,
  steps TEXT NOT NULL,
  image_filename TEXT,
  author_profile_id TEXT REFERENCES profiles(id),
  status TEXT NOT NULL CHECK (status IN ('published', 'pending')),
  created_at TEXT NOT NULL
)`;
}

const IDEA_COLUMNS = [
  "id",
  "item_id",
  "kind",
  "title",
  "materials",
  "steps",
  "image_filename",
  "author_profile_id",
  "status",
  "created_at",
] as const;

/**
 * Hand-reviewed new kinds for the seeded `useful` ideas (seeded ids are deterministic:
 * `<itemId>-idea-<n>`). Applied only while the row is still `useful`, so a hand-edited row
 * is never clobbered. Every other `useful` idea falls back to `home`.
 */
export const SEEDED_USEFUL_OVERRIDES: Record<string, (typeof IDEA_KINDS)[number]> = {
  "pet-bottles-idea-1": "home",
  "plastic-bags-idea-1": "home",
  "yogurt-cups-idea-1": "garden",
  "aluminum-cans-idea-2": "home",
  "tin-cans-idea-1": "home",
  "glass-jars-idea-1": "home",
  "cardboard-idea-2": "garden",
};

/** Mechanical remap from the pre-brand kinds. */
const LEGACY_KIND_MAP: Record<string, (typeof IDEA_KINDS)[number]> = {
  cook: "kitchen",
  beauty: "beauty",
  art: "crafts",
  useful: "home",
};

export type IdeaKindsMigrationResult =
  | { migrated: false }
  | { migrated: true; backupPath: string | null; remapped: { from: string; to: string; count: number }[] };

function quote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function backupTimestamp(date = new Date()): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
}

type FkViolation = { table: string; rowid: number | bigint | null; parent: string; fkid: number | bigint };

function fkViolationKeys(db: DatabaseSync): Set<string> {
  const rows = db.prepare("PRAGMA foreign_key_check").all() as FkViolation[];
  return new Set(rows.map((row) => `${row.table}|${row.rowid}|${row.parent}|${row.fkid}`));
}

/**
 * Rebuilds `ideas` with the six brand kinds in its CHECK constraint, remapping every existing row.
 *
 * Idempotent: skipped when the stored table SQL already lists 'kitchen' (fresh databases and
 * databases that were already migrated). Writes a `VACUUM INTO` backup beside a file database
 * first, then runs SQLite's documented table-rebuild procedure in one transaction. Ids, rowids,
 * image filenames and every log entry reference are preserved. On any failure the transaction is
 * rolled back, foreign keys are re-enabled and the error is rethrown, so the server refuses to boot.
 */
export function migrateIdeaKinds(db: DatabaseSync, databasePath: string): IdeaKindsMigrationResult {
  const table = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'ideas'").get() as
    | { sql: string }
    | undefined;
  if (!table || table.sql.includes("'kitchen'")) return { migrated: false };

  let backupPath: string | null = null;
  if (databasePath !== ":memory:") {
    backupPath = path.join(
      path.dirname(path.resolve(databasePath)),
      `recycler.pre-idea-kinds-${backupTimestamp()}.db`,
    );
    db.exec(`VACUUM INTO ${quote(backupPath)}`);
  }

  const overrideCases = Object.entries(SEEDED_USEFUL_OVERRIDES)
    .map(([id, kind]) => `WHEN id = ${quote(id)} AND kind = 'useful' THEN ${quote(kind)}`)
    .join("\n        ");
  const legacyCases = Object.entries(LEGACY_KIND_MAP)
    .map(([from, to]) => `WHEN kind = ${quote(from)} THEN ${quote(to)}`)
    .join("\n        ");
  const columns = IDEA_COLUMNS.join(", ");
  const selectColumns = IDEA_COLUMNS.map((column) =>
    column === "kind"
      ? `CASE
        ${overrideCases}
        ${legacyCases}
        ELSE kind
      END`
      : column,
  ).join(", ");

  // Foreign keys must be switched off outside a transaction: log_entries references ideas(id).
  db.exec("PRAGMA foreign_keys = OFF");
  let remapped: { from: string; to: string; count: number }[] = [];
  try {
    db.exec("BEGIN IMMEDIATE");
    try {
      const violationsBefore = fkViolationKeys(db);
      db.exec("DROP TABLE IF EXISTS ideas_new");
      db.exec(ideasTableSql("ideas_new"));
      db.exec(`INSERT INTO ideas_new (rowid, ${columns}) SELECT rowid, ${selectColumns} FROM ideas ORDER BY rowid`);

      const oldCount = Number((db.prepare("SELECT COUNT(*) AS n FROM ideas").get() as { n: number }).n);
      const newCount = Number((db.prepare("SELECT COUNT(*) AS n FROM ideas_new").get() as { n: number }).n);
      if (oldCount !== newCount) {
        throw new Error(`idea-kinds migration: row count mismatch (ideas ${oldCount}, ideas_new ${newCount})`);
      }
      remapped = (
        db
          .prepare(
            `SELECT o.kind AS "from", n.kind AS "to", COUNT(*) AS count
             FROM ideas o JOIN ideas_new n ON n.rowid = o.rowid AND n.id = o.id
             GROUP BY o.kind, n.kind ORDER BY o.kind, n.kind`,
          )
          .all() as { from: string; to: string; count: number }[]
      ).map((row) => ({ from: row.from, to: row.to, count: Number(row.count) }));
      const matched = remapped.reduce((sum, row) => sum + row.count, 0);
      if (matched !== oldCount) {
        throw new Error(`idea-kinds migration: ${oldCount - matched} rows lost their id or rowid`);
      }

      db.exec("DROP TABLE ideas");
      db.exec("ALTER TABLE ideas_new RENAME TO ideas");

      const integrity = db.prepare("PRAGMA integrity_check(ideas)").all() as { integrity_check: string }[];
      if (integrity.length !== 1 || integrity[0].integrity_check !== "ok") {
        throw new Error(
          `idea-kinds migration: integrity check failed: ${integrity.map((row) => row.integrity_check).join("; ")}`,
        );
      }
      const introduced = [...fkViolationKeys(db)].filter((key) => !violationsBefore.has(key));
      if (introduced.length > 0) {
        throw new Error(`idea-kinds migration: foreign key check failed: ${introduced.join(", ")}`);
      }
      if (violationsBefore.size > 0) {
        console.warn(
          `idea-kinds migration: ${violationsBefore.size} foreign key violations existed before the rebuild and remain`,
        );
      }
      db.exec("COMMIT");
    } catch (error) {
      try {
        db.exec("ROLLBACK");
      } catch {
        // The transaction may already be closed.
      }
      throw error;
    }
  } finally {
    db.exec("PRAGMA foreign_keys = ON");
  }

  const summary = remapped.map((row) => `${row.from}→${row.to} ${row.count}`).join(", ");
  console.log(`idea-kinds migration: ${summary || "no ideas"}; backup at ${backupPath ?? "(none, in-memory database)"}`);
  return { migrated: true, backupPath, remapped };
}
