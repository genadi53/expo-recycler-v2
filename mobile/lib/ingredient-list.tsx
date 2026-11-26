import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

/** One Ingredient in the Ingredient list: an Item, by id, with its display name. */
export type Ingredient = { id: string; name: string };

export type IngredientList = {
  /** The picked Ingredients, in the order they were added. */
  ingredients: Ingredient[];
  add: (ingredient: Ingredient) => void;
  remove: (id: string) => void;
  /** Adds the Ingredient if it isn't in the list, removes it if it is. */
  toggle: (ingredient: Ingredient) => void;
  clear: () => void;
  has: (id: string) => boolean;
};

// Pure list operations. They return the same array when nothing changes, so React skips re-renders.
export function addIngredient(list: Ingredient[], ingredient: Ingredient): Ingredient[] {
  if (list.some((entry) => entry.id === ingredient.id)) return list;
  return [...list, { id: ingredient.id, name: ingredient.name }];
}

export function removeIngredient(list: Ingredient[], id: string): Ingredient[] {
  return list.some((entry) => entry.id === id) ? list.filter((entry) => entry.id !== id) : list;
}

export function toggleIngredient(list: Ingredient[], ingredient: Ingredient): Ingredient[] {
  return list.some((entry) => entry.id === ingredient.id)
    ? removeIngredient(list, ingredient.id)
    : addIngredient(list, ingredient);
}

const IngredientListContext = createContext<IngredientList | null>(null);

/**
 * The Ingredient list for this app session. Held in memory only: it survives tab switches and
 * navigation, and starts empty on every launch (see GLOSSARY.md, "Ingredient list").
 */
export function IngredientListProvider({ children }: { children: ReactNode }) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  const add = useCallback((ingredient: Ingredient) => setIngredients((list) => addIngredient(list, ingredient)), []);
  const remove = useCallback((id: string) => setIngredients((list) => removeIngredient(list, id)), []);
  const toggle = useCallback(
    (ingredient: Ingredient) => setIngredients((list) => toggleIngredient(list, ingredient)),
    [],
  );
  const clear = useCallback(() => setIngredients((list) => (list.length ? [] : list)), []);

  const value = useMemo<IngredientList>(() => {
    const ids = new Set(ingredients.map((entry) => entry.id));
    return { ingredients, add, remove, toggle, clear, has: (id: string) => ids.has(id) };
  }, [ingredients, add, remove, toggle, clear]);

  return <IngredientListContext.Provider value={value}>{children}</IngredientListContext.Provider>;
}

export function useIngredientList(): IngredientList {
  const value = useContext(IngredientListContext);
  if (!value) throw new Error("useIngredientList must be used inside <IngredientListProvider>");
  return value;
}
