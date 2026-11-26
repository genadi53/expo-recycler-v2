import { CategorySheet } from "@/components/category-sheet";
import { IngredientChips, IngredientTypeahead, PopularIngredients } from "@/components/ingredient-picker";
import { categoryAccent, colors, serif } from "@/components/theme";
import { ErrorState, LoadingState, Screen } from "@/components/ui";
import { api } from "@/lib/api";
import { categoryLabel } from "@/lib/format";
import { useIngredientList } from "@/lib/ingredient-list";
import { submitRoute } from "@/lib/submit-route";
import type { Category } from "@/lib/types";
import { useQuery } from "@/lib/use-query";
import { router, type Href } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

const pointer = Platform.OS === "web" ? ({ cursor: "pointer" } as const) : null;

/** Ingredient list builder: pick what you have at home, then find what you can make. */
export default function BuilderScreen() {
  const { t } = useTranslation();
  const list = useIngredientList();
  const categories = useQuery("categories", () => api.categories());
  const [openCategory, setOpenCategory] = useState<Category | null>(null);
  const [typed, setTyped] = useState("");
  const closeSheet = useCallback(() => setOpenCategory(null), []);
  const empty = list.ingredients.length === 0;

  return (
    <View style={styles.root}>
      <Screen
        title={t("builder.title")}
        back
        footer={<FindButton disabled={empty} onPress={() => router.push("/matches" as Href)} />}
      >
        <View style={styles.hero}>
          <View style={styles.heroRing} pointerEvents="none" />
          <Text style={styles.headline} accessibilityRole="header">
            {t("builder.headline")}
            <Text style={styles.headlineEm}>{t("builder.headlineEm")}</Text>
          </Text>
          <Text style={styles.subline}>{t("builder.subline")}</Text>
          <IngredientTypeahead has={list.has} onAdd={list.add} onQueryChange={setTyped} />
        </View>

        <View style={styles.section}>
          <View style={styles.listHeader}>
            <Text style={styles.sectionLabel}>{t("builder.yourList", { count: list.ingredients.length })}</Text>
            {!empty ? (
              <Pressable
                accessibilityRole="button"
                onPress={list.clear}
                hitSlop={8}
                style={pointer}
                testID="builder-clear"
              >
                <Text style={styles.clear}>{t("builder.clear")}</Text>
              </Pressable>
            ) : null}
          </View>
          {empty ? (
            <Text style={styles.note}>{t("builder.emptyList")}</Text>
          ) : (
            <IngredientChips ingredients={list.ingredients} onRemove={list.remove} />
          )}
        </View>

        <PopularIngredients has={list.has} onAdd={list.add} title={t("builder.popular")} />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t("builder.byMaterial")}</Text>
          {categories.status === "loading" ? <LoadingState label={t("builder.loading")} /> : null}
          {categories.status === "error" ? (
            <ErrorState message={categories.error} onRetry={categories.retry} />
          ) : null}
          {categories.status === "ready" && categories.data?.categories.length === 0 ? (
            <Text style={styles.note}>{t("builder.noCategories")}</Text>
          ) : null}
          {categories.status === "ready" && categories.data ? (
            <View style={styles.grid}>
              {categories.data.categories.map((category) => (
                <MaterialTile key={category.id} category={category} onPress={() => setOpenCategory(category)} />
              ))}
            </View>
          ) : null}
        </View>

        <Pressable
          accessibilityRole="link"
          onPress={() => router.push(submitRoute({ mode: "item", item: typed || undefined }))}
          style={[styles.suggest, pointer]}
          testID="builder-suggest"
        >
          <Text style={styles.note}>
            {t("builder.cantFind")} <Text style={styles.suggestLink}>{t("builder.suggest")}</Text>
          </Text>
        </Pressable>
      </Screen>

      <CategorySheet category={openCategory} has={list.has} onToggle={list.toggle} onClose={closeSheet} />
    </View>
  );
}

function MaterialTile({ category, onPress }: { category: Category; onPress: () => void }) {
  const { t } = useTranslation();
  const accent = categoryAccent[category.id] ?? colors.green;
  const name = categoryLabel(category.id, category.name);
  return (
    <View style={styles.tileSlot}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${t("builder.itemCount", { count: category.itemCount })}`}
        onPress={onPress}
        style={({ pressed }) => [styles.tile, pressed && styles.pressed, pointer]}
        testID={`category-${category.id}`}
      >
        <View style={[styles.tileLetter, { backgroundColor: accent }]}>
          <Text style={styles.tileLetterText}>{name.slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={styles.tileText}>
          <Text style={styles.tileName} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.tileCount}>{t("builder.itemCount", { count: category.itemCount })}</Text>
        </View>
      </Pressable>
    </View>
  );
}

function FindButton({ disabled, onPress }: { disabled: boolean; onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.dock}>
      {disabled ? <Text style={styles.findHint}>{t("builder.findHint")}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        accessibilityHint={disabled ? t("builder.findHint") : undefined}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.find,
          disabled && styles.findDisabled,
          pressed && !disabled && styles.pressed,
          pointer,
        ]}
        testID="builder-find"
      >
        <Text style={styles.findText}>{t("builder.find")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: {
    backgroundColor: colors.greenDark,
    borderRadius: 28,
    padding: 20,
    gap: 12,
    overflow: "hidden",
  },
  heroRing: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 18,
    borderColor: colors.green,
  },
  headline: { fontFamily: serif, fontSize: 32, lineHeight: 38, color: colors.card },
  headlineEm: { fontStyle: "italic", color: colors.greenSoft },
  subline: { color: colors.greenSoft, fontSize: 15, lineHeight: 21, marginBottom: 4 },
  section: { gap: 10 },
  listHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionLabel: { fontSize: 13, fontWeight: "800", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.6 },
  clear: { color: colors.terra, fontWeight: "700", fontSize: 14 },
  note: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -5 },
  tileSlot: { width: "50%", padding: 5 },
  tile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    padding: 12,
  },
  tileLetter: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  tileLetterText: { color: colors.card, fontWeight: "800", fontSize: 18 },
  tileText: { flex: 1, gap: 2 },
  tileName: { fontSize: 16, fontWeight: "700", color: colors.ink },
  tileCount: { fontSize: 12, color: colors.muted, fontWeight: "600" },
  suggest: { alignSelf: "center", paddingVertical: 6 },
  suggestLink: { color: colors.green, fontWeight: "800" },
  dock: { paddingHorizontal: 16, paddingTop: 8, gap: 6 },
  findHint: { color: colors.muted, fontSize: 13, textAlign: "center" },
  find: {
    backgroundColor: colors.green,
    borderRadius: 18,
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  findDisabled: { opacity: 0.45 },
  findText: { color: colors.card, fontSize: 17, fontWeight: "800" },
  pressed: { opacity: 0.8 },
});
