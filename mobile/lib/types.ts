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
};

export type Idea = {
  id: string;
  kind: "cook" | "beauty" | "art" | "useful";
  title: string;
  materials: string;
  steps: string[];
  authorName: string | null;
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
  item: { id: string; name: string; categoryId: string; categoryName: string; created: boolean };
  idea: { id: string; title: string };
  pointsAwarded: number;
  points: number;
  badgesUnlocked: UnlockedBadge[];
};
