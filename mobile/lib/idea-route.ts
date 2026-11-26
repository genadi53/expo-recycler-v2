import type { Href } from "expo-router";

/** Idea detail screen for an Idea id. */
export function ideaHref(id: string): Href {
  return `/idea/${encodeURIComponent(id)}` as Href;
}

/** "Make it" checklist screen for an Idea id. */
export function ideaMakeHref(id: string): Href {
  return `/idea/${encodeURIComponent(id)}/make` as Href;
}
