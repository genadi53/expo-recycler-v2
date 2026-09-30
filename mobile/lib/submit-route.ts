import type { Href } from "expo-router";

/** Build a submit URL that always forces a fresh form (clears a stale success screen). */
export function submitRoute(options: {
  mode: "item" | "idea";
  item?: string;
  category?: string;
  kind?: string;
}): Href {
  const search = new URLSearchParams({
    mode: options.mode,
    fresh: String(Date.now()),
  });
  if (options.item) search.set("item", options.item);
  if (options.category) search.set("category", options.category);
  if (options.kind) search.set("kind", options.kind);
  return `/submit?${search.toString()}` as Href;
}
