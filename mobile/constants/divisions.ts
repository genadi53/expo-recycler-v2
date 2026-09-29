export type DivisionId = "neighborhood" | "city" | "world";

export type Division = {
  id: DivisionId;
  labelKey: string;
};

export const DIVISIONS: Division[] = [
  { id: "neighborhood", labelKey: "leaderboard.neighborhood" },
  { id: "city", labelKey: "leaderboard.city" },
  { id: "world", labelKey: "leaderboard.world" },
];

export const DEFAULT_DIVISION: DivisionId = "neighborhood";
