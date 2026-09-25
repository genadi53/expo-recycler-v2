import { createApp } from "./app.js";
import { openDatabase } from "./db.js";

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

const db = openDatabase(":memory:");
const app = createApp(db);

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
    ideaKind: "cook",
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

const afterLogs = await json<{
  points: number;
  counts: { reuses: number; disposals: number; logs: number };
  badges: { slug: string; unlockedAt: string | null }[];
}>(await app.request("/profiles/person-1"));
assert(afterLogs.counts.reuses === 5, `expected 5 reuses, got ${afterLogs.counts.reuses}`);
assert(afterLogs.counts.disposals === 2, "expected 2 disposals");
assert(afterLogs.badges.find((badge) => badge.slug === "maker")?.unlockedAt, "maker badge missing");
assert(afterLogs.badges.find((badge) => badge.slug === "curious")?.unlockedAt, "curious badge missing");

const attached = await json<{ item: { id: string; created: boolean }; pointsAwarded: number; badgesUnlocked: { slug: string }[] }>(
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
    }),
  }),
);
assert(!attached.item.created && attached.item.id === "banana-peels", "existing item should be matched case-insensitively");
assert(attached.pointsAwarded === 15, "existing idea should be 15 points");
assert(attached.badgesUnlocked.some((badge) => badge.slug === "contributor"), "contributor badge missing");

const fresh = await json<{ item: { id: string; created: boolean; name: string }; pointsAwarded: number }>(
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
      disposalNote: "Natural cork can be composted. Plastic corks are trash.",
    }),
  }),
);
assert(fresh.item.created && fresh.pointsAwarded === 25, "new item should be 25 points");
const cork = await json<{ disposal: { source: string; steps: string[] }; ideas: { title: string }[] }>(
  await app.request(`/items/${fresh.item.id}`),
);
assert(cork.disposal.source === "item", "disposal note should become item guidance");
assert(cork.ideas.some((idea) => idea.title === "Cork trivet"), "new idea should be searchable on the item");
const foundCork = await json<{ items: { name: string }[] }>(await app.request("/items?q=cork"));
assert(foundCork.items.some((item) => item.name === "Wine corks"), "new item should show up in search");

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

console.log("API smoke test passed");
