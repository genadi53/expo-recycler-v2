import type { DB } from "./db.js";
import { nowIso } from "./db.js";

export type UnlockedBadge = { slug: string; title: string };

type Stats = {
  logs: number;
  reuses: number;
  disposals: number;
  ideas: number;
  categories: number;
};

function count(db: DB, sql: string, profileId: string): number {
  const row = db.prepare(sql).get(profileId) as Record<string, number | bigint | null> | undefined;
  if (!row) return 0;
  const value = Object.values(row)[0];
  return value == null ? 0 : Number(value);
}

export function profileStats(db: DB, profileId: string): Stats {
  const logs = db.prepare(
    `SELECT
       COUNT(*) AS logs,
       COALESCE(SUM(CASE WHEN action = 'reuse' THEN 1 ELSE 0 END), 0) AS reuses,
       COALESCE(SUM(CASE WHEN action = 'dispose' THEN 1 ELSE 0 END), 0) AS disposals
     FROM log_entries
     WHERE profile_id = ?`,
  ).get(profileId) as { logs: number; reuses: number; disposals: number } | undefined;

  return {
    logs: Number(logs?.logs ?? 0),
    reuses: Number(logs?.reuses ?? 0),
    disposals: Number(logs?.disposals ?? 0),
    ideas: count(db, "SELECT COUNT(*) AS n FROM ideas WHERE author_profile_id = ?", profileId),
    categories: count(
      db,
      `SELECT COUNT(DISTINCT i.category_id) AS n
       FROM log_entries l
       JOIN items i ON i.id = l.item_id
       WHERE l.profile_id = ?`,
      profileId,
    ),
  };
}

export function awardBadges(db: DB, profileId: string): UnlockedBadge[] {
  const stats = profileStats(db, profileId);
  const ownedRows = db.prepare("SELECT badge_slug FROM profile_badges WHERE profile_id = ?").all(profileId) as {
    badge_slug: string;
  }[];
  const owned = new Set(ownedRows.map((row) => row.badge_slug));
  const checks: { slug: string; ok: boolean }[] = [
    { slug: "first-step", ok: stats.logs >= 1 },
    { slug: "maker", ok: stats.reuses >= 5 },
    { slug: "steady", ok: stats.logs >= 10 },
    { slug: "contributor", ok: stats.ideas >= 1 },
    { slug: "catalog-gardener", ok: stats.ideas >= 3 },
    { slug: "curious", ok: stats.categories >= 3 },
  ];

  const unlocked: UnlockedBadge[] = [];
  const insert = db.prepare(
    "INSERT INTO profile_badges (profile_id, badge_slug, unlocked_at) VALUES (?, ?, ?)",
  );
  const when = nowIso();
  for (const check of checks) {
    if (!check.ok || owned.has(check.slug)) continue;
    const badge = db.prepare("SELECT title FROM badges WHERE slug = ?").get(check.slug) as
      | { title: string }
      | undefined;
    if (!badge) continue;
    insert.run(profileId, check.slug, when);
    unlocked.push({ slug: check.slug, title: badge.title });
  }
  return unlocked;
}

export function addPoints(db: DB, profileId: string, points: number): number {
  db.prepare("UPDATE profiles SET points = points + ? WHERE id = ?").run(points, profileId);
  const row = db.prepare("SELECT points FROM profiles WHERE id = ?").get(profileId) as
    | { points: number }
    | undefined;
  return Number(row?.points ?? 0);
}
