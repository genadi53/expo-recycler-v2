import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { createApp } from "./app.js";
import { ensureImagesDir, openDatabase } from "./db.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function json<T>(res: Response): Promise<T> {
  const body = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(`${res.status} ${body.error ?? res.statusText}`);
  }
  return body;
}

const ideaImagesDir = ensureImagesDir(fs.mkdtempSync(path.join(os.tmpdir(), "recycler-idea-images-")));
const itemImagesDir = ensureImagesDir(fs.mkdtempSync(path.join(os.tmpdir(), "recycler-item-images-")));
const db = openDatabase(":memory:");
const app = createApp(db, ideaImagesDir, itemImagesDir);

// 1x1 PNG
const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const categories = await json<{ categories: { id: string; itemCount: number }[] }>(await app.request("/categories"));
assert(categories.categories.length === 6, "expected 6 categories");
assert(categories.categories.every((category) => category.itemCount >= 0), "item counts missing");

const emptyBoard = await json<{ leaders: unknown[]; you: unknown }>(await app.request("/leaderboard"));
assert(emptyBoard.leaders.length === 0 && emptyBoard.you === null, "leaderboard should start empty");

const banana = await json<{ items: { id: string; name: string }[] }>(await app.request("/items?q=banana"));
assert(banana.items.some((item) => item.id === "banana-peels"), "search should find banana peels");

const jars = await json<{ items: { id: string }[] }>(await app.request("/items?q=jar"));
assert(jars.items.some((item) => item.id === "glass-jars"), "alias search should find glass jars");

const plastic = await json<{ items: { id: string }[] }>(await app.request("/items?category=plastic"));
assert(plastic.items.length === 3, `expected 3 plastic items, got ${plastic.items.length}`);

const missingSearch = await json<{ items: unknown[] }>(await app.request("/items?q=zzzz-not-a-thing"));
assert(missingSearch.items.length === 0, "unknown search should be an empty list");

const detail = await json<{
  ideas: { id: string; steps: string[] }[];
  disposal: { method: string; source: string; steps: string[] };
  logMethods: { method: string; points: number }[];
}>(await app.request("/items/banana-peels"));
assert(detail.ideas.length >= 1 && detail.ideas[0].steps.length >= 1, "item should include ideas");
assert(detail.disposal.method === "compost" && detail.disposal.source === "item", "item disposal missing");
assert(detail.logMethods.some((method) => method.method === "trash" && method.points === 2), "trash option missing");

const missingItem = await app.request("/items/nope");
assert(missingItem.status === 404, "missing item should 404");

const noProfile = await app.request("/logs", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ profileId: "ghost", itemId: "banana-peels", action: "reuse", ideaId: detail.ideas[0].id }),
});
assert(noProfile.status === 404, "log should not invent a profile");

const blankName = await app.request("/profiles/person-1", {
  method: "PUT",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ displayName: "   " }),
});
assert(blankName.status === 400, "blank display name should fail");

const created = await json<{ displayName: string; points: number; created: boolean }>(
  await app.request("/profiles/person-1", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify("Mina"),
  }),
);
assert(created.created && created.displayName === "Mina" && created.points === 0, "profile create failed");

const renamed = await json<{ displayName: string; created: boolean }>(
  await app.request("/profiles/person-1", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ displayName: "Mina Cole" }),
  }),
);
assert(!renamed.created && renamed.displayName === "Mina Cole", "rename failed");

const blankSteps = await app.request("/submissions", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    profileId: "person-1",
    category: "food",
    itemName: "Orange pith",
    ideaKind: "kitchen",
    title: "Pith tea",
    materials: "Pith",
    steps: "   ",
  }),
});
assert(blankSteps.status === 400, "blank steps should fail");

const reuse = await json<{ pointsAwarded: number; badgesUnlocked: { slug: string }[] }>(
  await app.request("/logs", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      profileId: "person-1",
      itemId: "banana-peels",
      action: "reuse",
      ideaId: detail.ideas[0].id,
    }),
  }),
);
assert(reuse.pointsAwarded === 10, "reuse should be 10 points");
assert(reuse.badgesUnlocked.some((badge) => badge.slug === "first-step"), "first step badge missing");

const trash = await json<{ pointsAwarded: number }>(
  await app.request("/logs", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ profileId: "person-1", itemId: "banana-peels", action: "dispose", method: "trash" }),
  }),
);
assert(trash.pointsAwarded === 2, "trash should be 2 points");

const compost = await json<{ pointsAwarded: number }>(
  await app.request("/logs", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ profileId: "person-1", itemId: "coffee-grounds", action: "dispose", method: "compost" }),
  }),
);
assert(compost.pointsAwarded === 5, "compost should be 5 points");

for (const itemId of ["citrus-peels", "eggshells", "pet-bottles", "aluminum-cans"]) {
  const item = await json<{ ideas: { id: string }[] }>(await app.request(`/items/${itemId}`));
  await json(
    await app.request("/logs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ profileId: "person-1", itemId, action: "reuse", ideaId: item.ideas[0].id }),
    }),
  );
}

type IdeaListing = { ideas: { id: string; kind: string; title: string; itemId: string; itemName: string }[] };
const NEW_KINDS = ["kitchen", "beauty", "cleaning", "garden", "home", "crafts"];

const recipes = await json<IdeaListing>(await app.request("/ideas?kind=kitchen&limit=4"));
assert(recipes.ideas.length === 4, `expected 4 kitchen recipes, got ${recipes.ideas.length}`);
assert(recipes.ideas.every((idea) => idea.kind === "kitchen" && idea.itemId && idea.title), "recipe fields missing");

const allIdeas = await json<IdeaListing>(await app.request("/ideas"));
assert(allIdeas.ideas.length > 0, "unfiltered ideas should not be empty");
assert(allIdeas.ideas.every((idea) => NEW_KINDS.includes(idea.kind)), "every idea should carry a new kind");

const gardenIdeas = await json<IdeaListing>(await app.request("/ideas?kind=garden"));
for (const title of ["Seed-starting pots", "Sheet mulch"]) {
  assert(gardenIdeas.ideas.some((idea) => idea.title === title), `garden should include ${title}`);
}
assert(gardenIdeas.ideas.every((idea) => idea.kind === "garden"), "garden filter should only return garden");

const cleaningRes = await app.request("/ideas?kind=cleaning");
assert(cleaningRes.status === 200, "cleaning should be a valid kind");
const cleaningIdeas = await json<IdeaListing>(cleaningRes);
assert(cleaningIdeas.ideas.length === 0, "cleaning launches empty");

const idsOf = async (query: string) =>
  (await json<IdeaListing>(await app.request(`/ideas?${query}`))).ideas.map((idea) => idea.id).sort();
const sameIds = (a: string[], b: string[]) => a.length === b.length && a.every((id, index) => id === b[index]);

const kitchenIds = await idsOf("kind=kitchen");
assert(kitchenIds.length >= 4, "expected at least 4 kitchen ideas");
assert(sameIds(await idsOf("kind=cook"), kitchenIds), "kind=cook should alias kind=kitchen");
assert(sameIds(await idsOf("kind=art"), await idsOf("kind=crafts")), "kind=art should alias kind=crafts");
const usefulUnion = [
  ...(await idsOf("kind=cleaning")),
  ...(await idsOf("kind=garden")),
  ...(await idsOf("kind=home")),
].sort();
assert(usefulUnion.length > 0, "cleaning + garden + home should not be empty");
assert(sameIds(await idsOf("kind=useful"), usefulUnion), "kind=useful should be cleaning + garden + home");
const aliasKinds = await json<IdeaListing>(await app.request("/ideas?kind=cook"));
assert(aliasKinds.ideas.every((idea) => idea.kind === "kitchen"), "alias responses should carry new ids");

const badKind = await app.request("/ideas?kind=snack");
assert(badKind.status === 400, "bad idea kind should 400");
const badKindBody = (await badKind.json()) as { error?: string };
assert(
  badKindBody.error === "Pick a kind: kitchen, beauty, cleaning, garden, home, or crafts.",
  `bad kind message should list the new kinds, got ${badKindBody.error}`,
);

const afterLogs = await json<{
  points: number;
  counts: { reuses: number; disposals: number; logs: number };
  activity: { date: string; count: number }[];
  byCategory: { id: string; name: string; count: number }[];
  badges: { slug: string; unlockedAt: string | null }[];
}>(await app.request("/profiles/person-1"));
assert(afterLogs.counts.reuses === 5, `expected 5 reuses, got ${afterLogs.counts.reuses}`);
assert(afterLogs.counts.disposals === 2, "expected 2 disposals");
assert(afterLogs.activity.length >= 1, "activity should include logged days");
assert(
  afterLogs.activity.every((day) => /^\d{4}-\d{2}-\d{2}$/.test(day.date) && day.count > 0),
  "activity days should be YYYY-MM-DD with counts",
);
assert(afterLogs.byCategory.length >= 1, "byCategory should include logged categories");
assert(
  afterLogs.byCategory.reduce((sum, row) => sum + row.count, 0) === afterLogs.counts.logs,
  "byCategory totals should match log count",
);
assert(afterLogs.badges.find((badge) => badge.slug === "maker")?.unlockedAt, "maker badge missing");
assert(afterLogs.badges.find((badge) => badge.slug === "curious")?.unlockedAt, "curious badge missing");

const attached = await json<{
  item: { id: string; created: boolean };
  idea: { id: string; imageUrl: string | null };
  pointsAwarded: number;
  badgesUnlocked: { slug: string }[];
}>(
  await app.request("/submissions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      profileId: "person-1",
      category: "plastic",
      itemName: "BANANA PEELS",
      ideaKind: "cook",
      title: "Peel vinegar",
      materials: "Banana peels\nVinegar",
      steps: "Cover peels with vinegar.\nWait two weeks.\nStrain.",
      image: { mime: "image/png", data: TINY_PNG_BASE64 },
    }),
  }),
);
assert(!attached.item.created && attached.item.id === "banana-peels", "existing item should be matched case-insensitively");
assert(attached.pointsAwarded === 15, "existing idea should be 15 points");
assert(attached.badgesUnlocked.some((badge) => badge.slug === "contributor"), "contributor badge missing");
assert(attached.idea.imageUrl?.startsWith("/idea-images/") && attached.idea.imageUrl.endsWith(".png"), "idea imageUrl missing");

const withPicture = await json<{ ideas: { title: string; kind: string; imageUrl: string | null }[] }>(
  await app.request("/items/banana-peels"),
);
const pictured = withPicture.ideas.find((idea) => idea.title === "Peel vinegar");
assert(pictured?.imageUrl === attached.idea.imageUrl, "item detail should include idea imageUrl");
assert(pictured?.kind === "kitchen", `ideaKind cook should be stored as kitchen, got ${pictured?.kind}`);

const imageRes = await app.request(attached.idea.imageUrl!);
assert(imageRes.status === 200, "idea image should be served");
assert(imageRes.headers.get("content-type") === "image/png", "idea image content-type should be png");
const imageBytes = Buffer.from(await imageRes.arrayBuffer());
assert(imageBytes.length > 0, "idea image body should not be empty");

const traversal = await app.request("/idea-images/../package.json");
assert(traversal.status === 404, "image route should reject path traversal");

const itemOnlyDup = await app.request("/submissions", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    profileId: "person-1",
    category: "food",
    itemName: "Banana peels",
  }),
});
assert(itemOnlyDup.status === 400, "item-only submit should reject an existing name");

const blankIdeaFields = await app.request("/submissions", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    profileId: "person-1",
    category: "other",
    itemName: "Blank Idea Fields Cork",
    title: "",
    materials: "",
    steps: "",
  }),
});
assert(blankIdeaFields.status === 201, "blank idea fields should count as item-only, not require a kind");
const blankIdeaBody = await json<{ idea: unknown }>(blankIdeaFields);
assert(blankIdeaBody.idea == null, "blank idea fields should not create an idea");

const fresh = await json<{
  item: { id: string; created: boolean; name: string; imageUrl: string | null };
  idea: { id: string; title: string } | null;
  pointsAwarded: number;
}>(
  await app.request("/submissions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      profileId: "person-1",
      category: "other",
      itemName: "Wine corks",
      disposalNote: "Natural cork can be composted. Plastic corks are trash.",
      itemImage: { mime: "image/png", data: TINY_PNG_BASE64 },
    }),
  }),
);
assert(fresh.item.created && fresh.pointsAwarded === 25, "new item should be 25 points");
assert(fresh.idea == null, "item-only submit should not create an idea");
assert(fresh.item.imageUrl?.startsWith("/item-images/") && fresh.item.imageUrl.endsWith(".png"), "item imageUrl missing");
const cork = await json<{
  item: { imageUrl: string | null; summary: string };
  disposal: { source: string; steps: string[] };
  ideas: { title: string }[];
}>(await app.request(`/items/${fresh.item.id}`));
assert(cork.item.imageUrl === fresh.item.imageUrl, "item detail should include item imageUrl");
assert(cork.item.summary === "Wine corks", "item-only summary should use the item name");
assert(cork.disposal.source === "item", "disposal note should become item guidance");
assert(cork.ideas.length === 0, "item-only submit should leave the item without ideas");
const itemImageRes = await app.request(fresh.item.imageUrl!);
assert(itemImageRes.status === 200, "item image should be served");
assert(itemImageRes.headers.get("content-type") === "image/png", "item image content-type should be png");
const itemImageBytes = Buffer.from(await itemImageRes.arrayBuffer());
assert(itemImageBytes.length > 0, "item image body should not be empty");
const itemTraversal = await app.request("/item-images/../package.json");
assert(itemTraversal.status === 404, "item image route should reject path traversal");
const foundCork = await json<{ items: { name: string; imageUrl: string | null }[] }>(await app.request("/items?q=cork"));
assert(
  foundCork.items.some((item) => item.name === "Wine corks" && item.imageUrl === fresh.item.imageUrl),
  "new item should show up in search with imageUrl",
);
await json(
  await app.request("/submissions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      profileId: "person-1",
      category: "other",
      itemName: "Wine corks",
      ideaKind: "art",
      title: "Cork trivet",
      materials: "Wine corks\nGlue",
      steps: ["Slice corks into coins.", "Glue them into a square.", "Let the glue dry before you set a pot on it."],
    }),
  }),
);
await json(
  await app.request("/submissions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      profileId: "person-1",
      category: "glass",
      itemName: "Wine corks",
      ideaKind: "useful",
      title: "Kindling",
      materials: "A natural cork",
      steps: "Use a dry natural cork as kindling for a fire you are already tending.",
    }),
  }),
);
await json(
  await app.request("/submissions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      profileId: "person-1",
      category: "other",
      itemName: "Wine corks",
      ideaKind: "garden",
      title: "Cork mulch",
      materials: "Natural corks",
      steps: "Chop natural corks and spread them around potted plants.",
    }),
  }),
);
const snackKind = await app.request("/submissions", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    profileId: "person-1",
    category: "other",
    itemName: "Wine corks",
    ideaKind: "snack",
    title: "Cork snack",
    materials: "Corks",
    steps: "Do not eat corks.",
  }),
});
assert(snackKind.status === 400, "unknown ideaKind should 400");
const snackBody = (await snackKind.json()) as { error?: string };
assert(
  snackBody.error === "Pick a kind: kitchen, beauty, cleaning, garden, home, or crafts.",
  `unknown ideaKind message should list the new kinds, got ${snackBody.error}`,
);
const corkKinds = await json<{ ideas: { title: string; kind: string }[] }>(await app.request(`/items/${fresh.item.id}`));
const corkKind = (title: string) => corkKinds.ideas.find((idea) => idea.title === title)?.kind;
assert(corkKind("Cork trivet") === "crafts", `ideaKind art should be stored as crafts, got ${corkKind("Cork trivet")}`);
assert(corkKind("Kindling") === "home", `ideaKind useful should be stored as home, got ${corkKind("Kindling")}`);
assert(corkKind("Cork mulch") === "garden", `ideaKind garden should be stored as garden, got ${corkKind("Cork mulch")}`);

const gardened = await json<{ badges: { slug: string; unlockedAt: string | null }[] }>(
  await app.request("/profiles/person-1"),
);
assert(gardened.badges.find((badge) => badge.slug === "catalog-gardener")?.unlockedAt, "catalog gardener missing");

const board = await json<{ leaders: { displayName: string; isYou: boolean; points: number }[]; you: { rank: number } | null }>(
  await app.request("/leaderboard?profileId=person-1"),
);
assert(board.leaders[0]?.displayName === "Mina Cole" && board.leaders[0].isYou, "leaderboard should rank Mina first");
assert(board.you?.rank === 1, "caller rank missing");

db.prepare(
  "INSERT INTO items (id, name, aliases, category_id, summary, status, created_at) VALUES (?, ?, '[]', 'food', 'No disposal of its own.', 'published', ?)",
).run("bare-peel", "Bare peel", new Date().toISOString());
const fallback = await json<{ disposal: { source: string; method: string } | null }>(await app.request("/items/bare-peel"));
assert(fallback.disposal?.source === "category" && fallback.disposal.method === "compost", "category fallback missing");

// --- Idea-kinds migration from an old-schema database ---------------------------------------

const OLD_IDEAS_SQL = (withImageColumn: boolean) => `
CREATE TABLE ideas (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES items(id),
  kind TEXT NOT NULL CHECK (kind IN ('cook', 'beauty', 'art', 'useful')),
  title TEXT NOT NULL,
  materials TEXT NOT NULL,
  steps TEXT NOT NULL,
  author_profile_id TEXT REFERENCES profiles(id),
  status TEXT NOT NULL CHECK (status IN ('published', 'pending')),
  created_at TEXT NOT NULL
)${withImageColumn ? ";\nALTER TABLE ideas ADD COLUMN image_filename TEXT" : ""};`;

const OLD_BASE_SQL = `
CREATE TABLE categories (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, description TEXT NOT NULL);
CREATE TABLE profiles (id TEXT PRIMARY KEY, display_name TEXT NOT NULL, points INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);
CREATE TABLE items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  aliases TEXT NOT NULL DEFAULT '[]',
  category_id TEXT NOT NULL REFERENCES categories(id),
  summary TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('published', 'pending')),
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX items_name_lower ON items(lower(name));
`;

const OLD_LOG_SQL = `
CREATE TABLE log_entries (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id),
  item_id TEXT NOT NULL REFERENCES items(id),
  action TEXT NOT NULL CHECK (action IN ('reuse', 'dispose')),
  idea_id TEXT REFERENCES ideas(id),
  disposal_method TEXT,
  points_awarded INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
`;

// [idea id, item id, old kind, expected new kind]. Covers every seeded `useful` override.
const OLD_SEEDED: [string, string, string, string][] = [
  ["banana-peels-idea-1", "banana-peels", "cook", "kitchen"],
  ["banana-peels-idea-2", "banana-peels", "beauty", "beauty"],
  ["pet-bottles-idea-1", "pet-bottles", "useful", "home"],
  ["pet-bottles-idea-2", "pet-bottles", "art", "crafts"],
  ["plastic-bags-idea-1", "plastic-bags", "useful", "home"],
  ["plastic-bags-idea-2", "plastic-bags", "art", "crafts"],
  ["yogurt-cups-idea-1", "yogurt-cups", "useful", "garden"],
  ["yogurt-cups-idea-2", "yogurt-cups", "art", "crafts"],
  ["aluminum-cans-idea-1", "aluminum-cans", "art", "crafts"],
  ["aluminum-cans-idea-2", "aluminum-cans", "useful", "home"],
  ["tin-cans-idea-1", "tin-cans", "useful", "home"],
  ["tin-cans-idea-2", "tin-cans", "art", "crafts"],
  ["glass-jars-idea-1", "glass-jars", "useful", "home"],
  ["glass-jars-idea-2", "glass-jars", "art", "crafts"],
  ["cardboard-idea-1", "cardboard", "art", "crafts"],
  ["cardboard-idea-2", "cardboard", "useful", "garden"],
];
// User submissions with random ids: one per old kind. The `useful` one falls back to home.
const OLD_SUBMITTED: [string, string, string, string][] = [
  ["5f0c9a1e-0000-4000-8000-000000000001", "banana-peels", "cook", "kitchen"],
  ["5f0c9a1e-0000-4000-8000-000000000002", "glass-jars", "beauty", "beauty"],
  ["5f0c9a1e-0000-4000-8000-000000000003", "cardboard", "art", "crafts"],
  ["5f0c9a1e-0000-4000-8000-000000000004", "tin-cans", "useful", "home"],
];
const OLD_ALL = [...OLD_SEEDED, ...OLD_SUBMITTED];
const PICTURED_IDEA_ID = OLD_SUBMITTED[3][0];

type OldDbOptions = { withImageColumn: boolean; badKind?: string };

function buildOldDatabase(dir: string, options: OldDbOptions): string {
  const file = path.join(dir, "recycler.db");
  const old = new DatabaseSync(file);
  old.exec("PRAGMA foreign_keys = ON");
  old.exec(OLD_BASE_SQL + OLD_IDEAS_SQL(options.withImageColumn) + OLD_LOG_SQL);
  old.exec("INSERT INTO categories VALUES ('food', 'Food', 'Food'), ('plastic', 'Plastic', 'Plastic')");
  for (const itemId of new Set(OLD_ALL.map(([, itemId]) => itemId))) {
    old
      .prepare("INSERT INTO items (id, name, category_id, summary, status, created_at) VALUES (?, ?, ?, ?, 'published', ?)")
      .run(itemId, itemId, itemId === "banana-peels" ? "food" : "plastic", `${itemId} summary`, "2026-01-01T00:00:00.000Z");
  }
  old.exec("INSERT INTO profiles VALUES ('maker-1', 'Old Maker', 40, '2026-02-01T00:00:00.000Z')");
  // Insert in reverse so rowid order differs from id order.
  [...OLD_ALL].reverse().forEach(([id, itemId, kind], index) => {
    const submitted = OLD_SUBMITTED.some(([submittedId]) => submittedId === id);
    old
      .prepare(
        `INSERT INTO ideas (id, item_id, kind, title, materials, steps, author_profile_id, status, created_at)
         VALUES (?, ?, ?, ?, 'Stuff', '["Do it."]', ?, 'published', ?)`,
      )
      .run(
        id,
        itemId,
        kind,
        `Idea ${index}`,
        submitted ? "maker-1" : null,
        submitted ? "2026-03-01T00:00:00.000Z" : "2026-01-01T00:00:00.000Z",
      );
  });
  if (options.withImageColumn) {
    old.prepare("UPDATE ideas SET image_filename = ? WHERE id = ?").run(`${PICTURED_IDEA_ID}.png`, PICTURED_IDEA_ID);
  }
  if (options.badKind) {
    // A value the new CHECK rejects and no remap covers; slipped past the old CHECK on purpose.
    old.exec("PRAGMA ignore_check_constraints = ON");
    old
      .prepare(
        `INSERT INTO ideas (id, item_id, kind, title, materials, steps, status, created_at)
         VALUES ('bad-idea', 'cardboard', ?, 'Bad', 'x', '[]', 'published', '2026-01-01T00:00:00.000Z')`,
      )
      .run(options.badKind);
    old.exec("PRAGMA ignore_check_constraints = OFF");
  }
  const logIdeas = [OLD_SEEDED[0], OLD_SEEDED[6], OLD_SEEDED[15], OLD_SUBMITTED[0], OLD_SUBMITTED[3]];
  logIdeas.forEach(([ideaId, itemId], index) => {
    old
      .prepare(
        `INSERT INTO log_entries (id, profile_id, item_id, action, idea_id, points_awarded, created_at)
         VALUES (?, 'maker-1', ?, 'reuse', ?, 10, ?)`,
      )
      .run(`log-${index}`, itemId, ideaId, `2026-04-0${index + 1}T00:00:00.000Z`);
  });
  old.close();
  return file;
}

const backupsIn = (dir: string) => fs.readdirSync(dir).filter((name) => /^recycler\.pre-idea-kinds-.*\.db$/.test(name));
const ideasSql = (target: DatabaseSync) =>
  (target.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'ideas'").get() as { sql: string }).sql;
const ideaRows = (target: DatabaseSync) => JSON.stringify(target.prepare("SELECT rowid, * FROM ideas ORDER BY rowid").all());
const ideaCount = (target: DatabaseSync) =>
  Number((target.prepare("SELECT COUNT(*) AS n FROM ideas").get() as { n: number }).n);

{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recycler-migrate-"));
  const file = buildOldDatabase(dir, { withImageColumn: true });
  const before = new DatabaseSync(file);
  const rowidsBefore = JSON.stringify(before.prepare("SELECT rowid, id FROM ideas ORDER BY rowid").all());
  const countBefore = ideaCount(before);
  before.close();

  const migrated = openDatabase(file);
  const sql = ideasSql(migrated);
  for (const kind of NEW_KINDS) assert(sql.includes(`'${kind}'`), `migrated ideas CHECK should list ${kind}`);
  assert(!sql.includes("'cook'") && !sql.includes("'useful'"), "migrated ideas CHECK should drop the old kinds");
  assert(ideaCount(migrated) === countBefore, `row count changed: ${countBefore} -> ${ideaCount(migrated)}`);
  assert(
    JSON.stringify(migrated.prepare("SELECT rowid, id FROM ideas ORDER BY rowid").all()) === rowidsBefore,
    "ids and rowid order should be preserved",
  );
  for (const [id, , oldKind, expected] of OLD_ALL) {
    const row = migrated.prepare("SELECT kind FROM ideas WHERE id = ?").get(id) as { kind: string } | undefined;
    assert(row?.kind === expected, `${id} (${oldKind}) should become ${expected}, got ${row?.kind}`);
  }
  const pictured = migrated.prepare("SELECT image_filename FROM ideas WHERE id = ?").get(PICTURED_IDEA_ID) as {
    image_filename: string | null;
  };
  assert(pictured.image_filename === `${PICTURED_IDEA_ID}.png`, "image_filename should be preserved");
  const joined = migrated
    .prepare("SELECT COUNT(*) AS n FROM log_entries JOIN ideas ON ideas.id = log_entries.idea_id")
    .get() as { n: number };
  assert(Number(joined.n) === 5, `log entries should still join to their ideas, got ${joined.n}`);
  assert(migrated.prepare("PRAGMA foreign_key_check").all().length === 0, "foreign_key_check should be empty");
  const fkOn = migrated.prepare("PRAGMA foreign_keys").get() as { foreign_keys: number };
  assert(Number(fkOn.foreign_keys) === 1, "foreign keys should be re-enabled after the migration");
  assert(backupsIn(dir).length === 1, `expected one backup beside the database, got ${backupsIn(dir).length}`);
  const backup = new DatabaseSync(path.join(dir, backupsIn(dir)[0]), { readOnly: true });
  assert(ideasSql(backup).includes("'cook'"), "backup should hold the pre-migration schema");
  assert(ideaCount(backup) === countBefore, "backup should hold every pre-migration idea");
  backup.close();

  const migratedImages = ensureImagesDir(path.join(dir, "idea-images"));
  fs.writeFileSync(path.join(migratedImages, `${PICTURED_IDEA_ID}.png`), Buffer.from(TINY_PNG_BASE64, "base64"));
  const migratedApp = createApp(migrated, migratedImages, ensureImagesDir(path.join(dir, "item-images")));
  const tinCans = await json<{ ideas: { id: string; kind: string; imageUrl: string | null }[] }>(
    await migratedApp.request("/items/tin-cans"),
  );
  const picturedIdea = tinCans.ideas.find((idea) => idea.id === PICTURED_IDEA_ID);
  assert(picturedIdea?.kind === "home" && picturedIdea.imageUrl, "migrated idea should keep its imageUrl");
  const migratedImage = await migratedApp.request(picturedIdea.imageUrl);
  assert(migratedImage.status === 200, "migrated idea image should still resolve");
  const migratedCook = await json<IdeaListing>(await migratedApp.request("/ideas?kind=cook"));
  assert(
    migratedCook.ideas.length === 2 && migratedCook.ideas.every((idea) => idea.kind === "kitchen"),
    `kind=cook should list the migrated kitchen ideas, got ${migratedCook.ideas.length}`,
  );
  const rowsAfterFirst = ideaRows(migrated);
  migrated.close();

  const reopened = openDatabase(file);
  assert(backupsIn(dir).length === 1, "second open should not write another backup");
  assert(ideaRows(reopened) === rowsAfterFirst, "second open should leave ideas unchanged");
  reopened.close();
}

{
  // An old database from before the image column also migrates (the column migration runs first).
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recycler-migrate-noimage-"));
  const migrated = openDatabase(buildOldDatabase(dir, { withImageColumn: false }));
  const columns = (migrated.prepare("PRAGMA table_info(ideas)").all() as { name: string }[]).map((column) => column.name);
  assert(columns.includes("image_filename"), "migrated ideas should have image_filename");
  assert(ideasSql(migrated).includes("'kitchen'"), "imageless old database should migrate");
  for (const [id, , , expected] of OLD_ALL) {
    const row = migrated.prepare("SELECT kind FROM ideas WHERE id = ?").get(id) as { kind: string } | undefined;
    assert(row?.kind === expected, `imageless: ${id} should become ${expected}, got ${row?.kind}`);
  }
  migrated.close();
}

{
  // A row the new CHECK rejects aborts the rebuild and leaves the old table and rows intact.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recycler-migrate-fail-"));
  const file = buildOldDatabase(dir, { withImageColumn: true, badKind: "snack" });
  const before = new DatabaseSync(file);
  const rowsBefore = ideaRows(before);
  before.close();
  let failure = "";
  try {
    openDatabase(file);
  } catch (error) {
    failure = String(error);
  }
  assert(/CHECK constraint/i.test(failure), `migration with an unmappable kind should throw a CHECK error, got ${failure}`);
  const after = new DatabaseSync(file);
  assert(ideasSql(after).includes("'cook'"), "failed migration should keep the old ideas table");
  assert(ideaRows(after) === rowsBefore, "failed migration should leave idea rows untouched");
  assert(
    after.prepare("SELECT name FROM sqlite_master WHERE name = 'ideas_new'").all().length === 0,
    "failed migration should not leave ideas_new behind",
  );
  after.close();
}

console.log("API smoke test passed");
