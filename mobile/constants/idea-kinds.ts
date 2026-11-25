import type { Ionicons } from "@expo/vector-icons";
import { categoryAccent, colors } from "@/components/theme";
import { IDEA_KINDS, type IdeaKind } from "@/lib/types";

export { IDEA_KINDS, type IdeaKind };

type IdeaKindMeta = {
  icon: keyof typeof Ionicons.glyphMap;
  /** Reuses existing theme tokens only; no kind-specific colours. */
  accent: string;
};

/** Icon and accent per idea kind. Labels come from i18n (`kind.<id>`) via kindLabel(). */
export const IDEA_KIND_META: Record<IdeaKind, IdeaKindMeta> = {
  kitchen: { icon: "restaurant-outline", accent: colors.terra },
  beauty: { icon: "sparkles-outline", accent: categoryAccent.other },
  cleaning: { icon: "water-outline", accent: categoryAccent.plastic },
  garden: { icon: "leaf-outline", accent: colors.green },
  home: { icon: "home-outline", accent: categoryAccent.paper },
  crafts: { icon: "color-palette-outline", accent: categoryAccent.glass },
};

/** Kind ids from before the brand categories, still found in old links and shortcuts. */
const LEGACY_KIND_ALIAS: Record<string, IdeaKind> = { cook: "kitchen", art: "crafts", useful: "home" };

export function isIdeaKind(value: string): value is IdeaKind {
  return (IDEA_KINDS as readonly string[]).includes(value);
}

/** A kind id, or a legacy id mapped to its new kind; null for anything else. */
export function parseIdeaKind(value: string | undefined | null): IdeaKind | null {
  if (!value) return null;
  if (isIdeaKind(value)) return value;
  return Object.prototype.hasOwnProperty.call(LEGACY_KIND_ALIAS, value) ? LEGACY_KIND_ALIAS[value] : null;
}

/** Icon and accent for a kind from the API; null for an unknown id so callers can render the label alone. */
export function ideaKindMeta(kind: string): IdeaKindMeta | null {
  return isIdeaKind(kind) ? IDEA_KIND_META[kind] : null;
}
