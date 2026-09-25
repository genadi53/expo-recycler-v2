export const METHOD_LABEL: Record<string, string> = {
  recycle: "Rinse and recycle",
  compost: "Compost",
  "drop-off": "Drop-off",
  hazardous: "Household hazardous waste",
  trash: "Trash",
};

export const KIND_LABEL = {
  cook: "Cook",
  beauty: "Beauty",
  art: "Art",
  useful: "Useful",
} as const;

export function ordinal(rank: number): string {
  const mod100 = rank % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${rank}th`;
  switch (rank % 10) {
    case 1:
      return `${rank}st`;
    case 2:
      return `${rank}nd`;
    case 3:
      return `${rank}rd`;
    default:
      return `${rank}th`;
  }
}

export function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function createId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
