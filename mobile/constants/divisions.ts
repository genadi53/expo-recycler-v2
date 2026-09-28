export const DIVISIONS = [
  { id: "neighborhood", label: "Neighborhood" },
  { id: "city", label: "City" },
  { id: "world", label: "World" },
] as const;

export type DivisionId = (typeof DIVISIONS)[number]["id"];

export const DEFAULT_DIVISION: DivisionId = "neighborhood";
