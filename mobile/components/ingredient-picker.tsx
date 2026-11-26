import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/components/theme";
import { api } from "@/lib/api";
import type { Ingredient, ItemSummary } from "@/lib/types";
import { useQuery } from "@/lib/use-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

// Reusable Ingredient picking pieces. They take the list and its callbacks as props, so the
// builder can wire them to the Ingredient list store and the share form to its own local state.

const pointer = Platform.OS === "web" ? ({ cursor: "pointer" } as const) : null;
const SEARCH_DEBOUNCE_MS = 250;

type SearchState =
  | { status: "idle" }
  | { status: "loading"; q: string }
  | { status: "ready"; q: string; items: ItemSummary[] }
  | { status: "error"; q: string; message: string };
type SettledSearch = Extract<SearchState, { status: "ready" | "error" }>;

/**
 * Search field with debounced catalog type-ahead. Results drop down under the field; tapping a
 * result calls `onAdd` and clears the field. Results already picked show ✓ and can't be re-added.
 */
export function IngredientTypeahead({
  has,
  onAdd,
  onQueryChange,
  placeholder,
  pickedLabelKey = "ingredients.inList",
  maxResults = 6,
  testID = "ingredient-search",
}: {
  has: (id: string) => boolean;
  onAdd: (ingredient: Ingredient) => void;
  /** Called with the trimmed text whenever it changes (e.g. to prefill "Suggest it"). */
  onQueryChange?: (q: string) => void;
  placeholder?: string;
  /** i18n key (with `{{name}}`) announced for results that are already picked. */
  pickedLabelKey?: "ingredients.inList" | "ingredients.alreadyAdded";
  maxResults?: number;
  testID?: string;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  // The last settled search. While it belongs to an older query, the current one is still loading.
  const [settled, setSettled] = useState<SettledSearch | null>(null);
  const q = query.trim();
  const search: SearchState = !q
    ? { status: "idle" }
    : settled && settled.q === q
      ? settled
      : { status: "loading", q };

  useEffect(() => {
    onQueryChange?.(q);
  }, [q, onQueryChange]);

  useEffect(() => {
    if (!q) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      api
        .items({ q })
        .then((data) => {
          if (!cancelled) setSettled({ status: "ready", q, items: data.items.slice(0, maxResults) });
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setSettled({
              status: "error",
              q,
              message: err instanceof Error ? err.message : t("errors.somethingWrong"),
            });
          }
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q, maxResults, t]);

  function pick(item: ItemSummary) {
    onAdd({ id: item.id, name: item.name });
    setQuery("");
  }

  return (
    <View style={styles.typeahead}>
      <View style={styles.searchField}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder ?? t("ingredients.searchPlaceholder")}
          placeholderTextColor={colors.muted}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          style={styles.searchInput}
          accessibilityLabel={placeholder ?? t("ingredients.searchPlaceholder")}
          testID={testID}
        />
        {query ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("ingredients.clearSearch")}
            onPress={() => setQuery("")}
            hitSlop={8}
            style={pointer}
          >
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      {search.status === "loading" ? (
        <View style={[styles.resultRow, styles.resultNote]}>
          <ActivityIndicator size="small" color={colors.green} />
          <Text style={styles.noteText}>{t("ingredients.searching")}</Text>
        </View>
      ) : null}
      {search.status === "error" ? (
        <View style={[styles.resultRow, styles.resultNote]}>
          <Text style={styles.noteText}>{search.message}</Text>
        </View>
      ) : null}
      {search.status === "ready" && search.items.length === 0 ? (
        <View style={[styles.resultRow, styles.resultNote]}>
          <Text style={styles.noteText}>{t("ingredients.noResults", { q: search.q })}</Text>
        </View>
      ) : null}
      {search.status === "ready"
        ? search.items.map((item) => {
            const picked = has(item.id);
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityState={{ disabled: picked }}
                accessibilityLabel={
                  picked ? t(pickedLabelKey, { name: item.name }) : t("ingredients.add", { name: item.name })
                }
                disabled={picked}
                onPress={() => pick(item)}
                style={({ pressed }) => [styles.resultRow, pressed && styles.pressed, pointer]}
                testID={`${testID}-result-${item.id}`}
              >
                <Text style={styles.resultName} numberOfLines={1}>
                  <HighlightedName name={item.name} query={search.q} />
                </Text>
                <Text style={[styles.resultMark, picked && styles.resultMarkPicked]}>{picked ? "✓" : "＋"}</Text>
              </Pressable>
            );
          })
        : null}
    </View>
  );
}

function HighlightedName({ name, query }: { name: string; query: string }) {
  const at = name.toLowerCase().indexOf(query.toLowerCase());
  if (at < 0 || !query) return <Text>{name}</Text>;
  return (
    <Text>
      {name.slice(0, at)}
      <Text style={styles.match}>{name.slice(at, at + query.length)}</Text>
      {name.slice(at + query.length)}
    </Text>
  );
}

/**
 * Picked Ingredients as `greenSoft` chips; each ✕ calls `onRemove` with the Ingredient id.
 * Ids in `lockedIds` (e.g. an Idea's own Item) show a lock instead of ✕ and can't be removed.
 */
export function IngredientChips({
  ingredients,
  onRemove,
  lockedIds,
  testID = "ingredient-chips",
}: {
  ingredients: Ingredient[];
  onRemove: (id: string) => void;
  lockedIds?: readonly string[];
  testID?: string;
}) {
  const { t } = useTranslation();
  if (ingredients.length === 0) return null;
  return (
    <View style={styles.chips} testID={testID}>
      {ingredients.map((ingredient) =>
        lockedIds?.includes(ingredient.id) ? (
          <View
            key={ingredient.id}
            accessible
            accessibilityLabel={t("ingredients.ownItem", { name: ingredient.name })}
            style={styles.pickedChip}
            testID={`${testID}-${ingredient.id}-locked`}
          >
            <Text style={styles.pickedChipText}>{ingredient.name}</Text>
            <Ionicons name="lock-closed" size={13} color={colors.greenDark} />
          </View>
        ) : (
          <Pressable
            key={ingredient.id}
            accessibilityRole="button"
            accessibilityLabel={t("ingredients.remove", { name: ingredient.name })}
            onPress={() => onRemove(ingredient.id)}
            style={({ pressed }) => [styles.pickedChip, pressed && styles.pressed, pointer]}
            testID={`${testID}-${ingredient.id}`}
          >
            <Text style={styles.pickedChipText}>{ingredient.name}</Text>
            <Text style={styles.pickedChipX}>✕</Text>
          </Pressable>
        ),
      )}
    </View>
  );
}

/**
 * Popular Ingredients (most-used by Ideas) as outlined `card` chips with ＋. Ones already picked are
 * left out. Renders nothing while loading, on error, or when nothing is left to offer.
 */
export function PopularIngredients({
  has,
  onAdd,
  limit = 12,
  title,
  testID = "popular-ingredients",
}: {
  has: (id: string) => boolean;
  onAdd: (ingredient: Ingredient) => void;
  limit?: number;
  /** Optional heading shown above the chips (only when there are chips). */
  title?: string;
  testID?: string;
}) {
  const { t } = useTranslation();
  const { status, data } = useQuery(`popular-items:${limit}`, () => api.popularItems(limit));
  if (status !== "ready" || !data) return null;
  const offered = data.items.filter((item) => !has(item.id));
  if (offered.length === 0) return null;
  return (
    <View style={styles.popular}>
      {title ? <Text style={styles.sectionLabel}>{title}</Text> : null}
      <View style={styles.chips} testID={testID}>
        {offered.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={t("ingredients.add", { name: item.name })}
            onPress={() => onAdd({ id: item.id, name: item.name })}
            style={({ pressed }) => [styles.addChip, pressed && styles.pressed, pointer]}
            testID={`${testID}-${item.id}`}
          >
            <Text style={styles.addChipPlus}>＋</Text>
            <Text style={styles.addChipText}>{item.name}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  typeahead: { gap: 6 },
  searchField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  searchInput: { flex: 1, fontSize: 16, color: colors.ink, paddingVertical: 12 },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  resultNote: { gap: 8 },
  noteText: { color: colors.muted, fontSize: 14, flex: 1 },
  resultName: { flex: 1, fontSize: 16, color: colors.ink },
  match: { fontWeight: "800" },
  resultMark: { color: colors.green, fontSize: 20, fontWeight: "700" },
  resultMarkPicked: { color: colors.muted, fontSize: 16 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pickedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.greenSoft,
    borderRadius: 999,
    paddingLeft: 14,
    paddingRight: 12,
    paddingVertical: 8,
  },
  pickedChipText: { color: colors.greenDark, fontWeight: "700", fontSize: 15 },
  pickedChipX: { color: colors.greenDark, fontSize: 13, fontWeight: "700" },
  popular: { gap: 10 },
  sectionLabel: { fontSize: 13, fontWeight: "800", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.6 },
  addChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addChipPlus: { color: colors.green, fontWeight: "800", fontSize: 15 },
  addChipText: { color: colors.ink, fontWeight: "600", fontSize: 15 },
  pressed: { opacity: 0.75 },
});
