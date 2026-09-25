export const IDEA_KINDS = ["cook", "beauty", "art", "useful"] as const;
export type IdeaKind = (typeof IDEA_KINDS)[number];

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
