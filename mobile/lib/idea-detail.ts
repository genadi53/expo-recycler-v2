import type { IdeaIngredient } from "@/lib/types";

/** An Idea's Key Ingredient, marked by whether it is in the Ingredient list. */
export type ChecklistEntry = IdeaIngredient & { inList: boolean };

/** The Ingredient checklist: each Key Ingredient (in the Idea's order) and how many are in the list. */
export function ingredientChecklist(ingredients: IdeaIngredient[], has: (id: string) => boolean) {
  const entries: ChecklistEntry[] = ingredients.map((ingredient) => ({ ...ingredient, inList: has(ingredient.id) }));
  return { entries, have: entries.filter((entry) => entry.inList).length, total: entries.length };
}

/** The Basics: the Idea's free-text `materials`, one per line or comma, without blanks. */
export function basicsList(materials: string): string[] {
  return materials
    .split(/[\n,]/)
    .map((part) => part.replace(/^[-•·*]\s*/, "").trim())
    .filter(Boolean);
}

/** The Key Ingredients a step's text mentions by name (case-insensitive), in the Idea's order. */
export function ingredientsInStep(step: string, ingredients: IdeaIngredient[]): IdeaIngredient[] {
  const text = step.toLocaleLowerCase();
  return ingredients.filter((ingredient) => {
    const name = ingredient.name.trim().toLocaleLowerCase();
    return name.length > 0 && text.includes(name);
  });
}
