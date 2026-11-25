/** Canonical idea kinds (the six Againful brand categories), in display order. */
export const IDEA_KINDS = ["kitchen", "beauty", "cleaning", "garden", "home", "crafts"] as const;
export type IdeaKind = (typeof IDEA_KINDS)[number];

/**
 * Idea kind ids from before the brand categories. Older app builds still send them, so the API
 * accepts them as aliases for a transition period. Responses only ever carry `IDEA_KINDS`.
 * "beauty" is unchanged and needs no alias.
 */
export const LEGACY_IDEA_KINDS = ["cook", "art", "useful"] as const;
export type LegacyIdeaKind = (typeof LEGACY_IDEA_KINDS)[number];

/** Alias used when an old client submits an idea. */
export const SUBMIT_ALIAS: Record<LegacyIdeaKind, IdeaKind> = { cook: "kitchen", art: "crafts", useful: "home" };

/** Alias used when an old client filters `/ideas?kind=`. */
export const FILTER_ALIAS: Record<LegacyIdeaKind, IdeaKind[]> = {
  cook: ["kitchen"],
  art: ["crafts"],
  useful: ["cleaning", "garden", "home"],
};

export const IDEA_KIND_MESSAGE = "Pick a kind: kitchen, beauty, cleaning, garden, home, or crafts.";

export function isLegacyIdeaKind(value: string): value is LegacyIdeaKind {
  return (LEGACY_IDEA_KINDS as readonly string[]).includes(value);
}

/** A new id, an alias mapped to one new id, or null when the value is not a kind. */
export function normalizeSubmittedKind(value: string): IdeaKind | null {
  if (isIdeaKind(value)) return value;
  if (isLegacyIdeaKind(value)) return SUBMIT_ALIAS[value];
  return null;
}

/** A new id expands to itself, an alias to its list of new ids; null when the value is not a kind. */
export function expandFilterKind(value: string): IdeaKind[] | null {
  if (isIdeaKind(value)) return [value];
  if (isLegacyIdeaKind(value)) return FILTER_ALIAS[value];
  return null;
}

const aliasHits = new Map<string, number>();

/** Counts and logs requests that still use a legacy kind id, so the aliases can be retired once traffic stops. */
export function recordIdeaKindAlias(route: "filter" | "submit", legacy: LegacyIdeaKind): number {
  const key = `${route}:${legacy}`;
  const count = (aliasHits.get(key) ?? 0) + 1;
  aliasHits.set(key, count);
  console.log(`idea-kind alias hit: ${route} ${legacy} (${count} since boot)`);
  return count;
}

export const DISPOSAL_METHODS = ["recycle", "compost", "drop-off", "hazardous", "trash"] as const;
export type DisposalMethod = (typeof DISPOSAL_METHODS)[number];

export const REUSE_POINTS = 10;
export const EXISTING_ITEM_POINTS = 15;
export const NEW_ITEM_POINTS = 25;

export const METHOD_LABEL: Record<DisposalMethod, string> = {
  recycle: "Rinse and recycle",
  compost: "Compost",
  "drop-off": "Drop-off",
  hazardous: "Household hazardous waste",
  trash: "Trash",
};

export function disposalPoints(method: DisposalMethod): number {
  return method === "trash" ? 2 : 5;
}

export function isDisposalMethod(value: string): value is DisposalMethod {
  return (DISPOSAL_METHODS as readonly string[]).includes(value);
}

export function isIdeaKind(value: string): value is IdeaKind {
  return (IDEA_KINDS as readonly string[]).includes(value);
}

export const BADGES: { slug: string; title: string; rule: string; sortOrder: number }[] = [
  { slug: "first-step", title: "First step", rule: "Log your first reuse or disposal.", sortOrder: 1 },
  { slug: "maker", title: "Maker", rule: "Log 5 reuses.", sortOrder: 2 },
  { slug: "steady", title: "Steady", rule: "Log 10 actions.", sortOrder: 3 },
  { slug: "contributor", title: "Contributor", rule: "Share your first catalog idea.", sortOrder: 4 },
  { slug: "catalog-gardener", title: "Catalog gardener", rule: "Share 3 catalog ideas.", sortOrder: 5 },
  { slug: "curious", title: "Curious", rule: "Log items from 3 different categories.", sortOrder: 6 },
];
