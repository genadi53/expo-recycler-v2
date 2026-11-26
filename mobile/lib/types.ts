export type Category = {
  id: string;
  name: string;
  description: string;
  itemCount: number;
};

export type ItemSummary = {
  id: string;
  name: string;
  summary: string;
  categoryId: string;
  categoryName: string;
  imageUrl: string | null;
};

/** An Item from `GET /items?popular=1`, with how many published Ideas list it as a Key Ingredient. */
export type PopularItem = ItemSummary & { ideaCount: number };

/** Idea kinds (the six Againful brand categories), in display order. Mirrors the server's IDEA_KINDS. */
export const IDEA_KINDS = ["kitchen", "beauty", "cleaning", "garden", "home", "crafts"] as const;
export type IdeaKind = (typeof IDEA_KINDS)[number];

export type Idea = {
  id: string;
  kind: IdeaKind;
  title: string;
  materials: string;
  steps: string[];
  imageUrl: string | null;
  authorName: string | null;
};

export type IdeaSummary = {
  id: string;
  kind: Idea["kind"];
  title: string;
  materials: string;
  itemId: string;
  itemName: string;
  categoryName: string;
  authorName: string | null;
  imageUrl: string | null;
};

export type IdeaImagePayload = {
  mime: "image/jpeg" | "image/png" | "image/webp";
  data: string;
};

export type Disposal = {
  method: "recycle" | "compost" | "drop-off" | "hazardous" | "trash";
  title: string;
  steps: string[];
  source: "item" | "category";
};

export type LogMethod = {
  method: Disposal["method"];
  label: string;
  points: number;
  recommended: boolean;
};

export type ItemDetail = {
  item: ItemSummary & { aliases: string[]; status: string };
  ideas: Idea[];
  disposal: Disposal | null;
  logMethods: LogMethod[];
};

export type Badge = {
  slug: string;
  title: string;
  rule: string;
  unlockedAt: string | null;
};

export type LogEntry = {
  id: string;
  action: "reuse" | "dispose";
  method: string | null;
  pointsAwarded: number;
  createdAt: string;
  itemId: string;
  itemName: string;
  categoryName: string;
  ideaTitle: string | null;
};

export type ActivityDay = {
  date: string;
  count: number;
};

export type CategoryCount = {
  id: string;
  name: string;
  count: number;
};

export type ProfileSnapshot = {
  id: string;
  displayName: string;
  points: number;
  counts: {
    reuses: number;
    disposals: number;
    ideasShared: number;
    logs: number;
  };
  activity: ActivityDay[];
  byCategory: CategoryCount[];
  badges: Badge[];
  recent: LogEntry[];
};

export type Leader = {
  rank: number;
  displayName: string;
  points: number;
  isYou: boolean;
};

export type Leaderboard = {
  leaders: Leader[];
  you: { rank: number; displayName: string; points: number } | null;
};

export type SavedProfile = {
  id: string;
  displayName: string;
  points: number;
  created: boolean;
};

export type UnlockedBadge = { slug: string; title: string };

export type LogResult = {
  id: string;
  pointsAwarded: number;
  points: number;
  badgesUnlocked: UnlockedBadge[];
};

export type SubmissionResult = {
  item: { id: string; name: string; categoryId: string; categoryName: string; created: boolean; imageUrl: string | null };
  idea: { id: string; title: string; imageUrl: string | null } | null;
  pointsAwarded: number;
  points: number;
  badgesUnlocked: UnlockedBadge[];
};

/** One Key Ingredient of an Idea: a linked Item. */
export type IdeaIngredient = { id: string; name: string };

/** An Idea from `GET /ideas/:id`, with its Item and its Key Ingredients (its own Item first). */
export type IdeaDetail = Idea & {
  itemId: string;
  itemName: string;
  categoryName: string;
  createdAt: string;
  ingredients: IdeaIngredient[];
};
