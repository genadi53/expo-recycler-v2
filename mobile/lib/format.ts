import i18n from "@/i18n";

export function methodLabel(method: string): string {
  const key = `method.${method}`;
  const translated = i18n.t(key);
  return translated === key ? method : translated;
}

export function kindLabel(kind: string): string {
  const key = `kind.${kind}`;
  const translated = i18n.t(key);
  return translated === key ? kind : translated;
}

export function categoryLabel(id: string, fallback?: string): string {
  const key = `category.${id}`;
  const translated = i18n.t(key);
  if (translated !== key) return translated;
  return fallback ?? id;
}

/** @deprecated Prefer methodLabel() so the active locale is used. */
export const METHOD_LABEL: Record<string, string> = new Proxy(
  {},
  {
    get: (_target, prop: string) => methodLabel(prop),
  },
);

/** @deprecated Prefer kindLabel() so the active locale is used. */
export const KIND_LABEL = new Proxy(
  {} as Record<"cook" | "beauty" | "art" | "useful", string>,
  {
    get: (_target, prop: string) => kindLabel(prop),
  },
);

export function ordinal(rank: number): string {
  const locale = i18n.language || "en-US";
  if (locale.startsWith("bg")) return `${rank}.`;
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

function activeLocaleTag(): string {
  return i18n.language || "en-US";
}

export function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(activeLocaleTag(), {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatUnlocked(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return i18n.t("format.unlocked");
  return i18n.t("format.unlockedOn", {
    date: date.toLocaleString(activeLocaleTag(), {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  });
}

export function formatMemberSince(iso?: string): string {
  const date = iso ? new Date(iso) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleString(activeLocaleTag(), { month: "long", year: "numeric" });
  }
  return date.toLocaleString(activeLocaleTag(), { month: "long", year: "numeric" });
}

export function createId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
