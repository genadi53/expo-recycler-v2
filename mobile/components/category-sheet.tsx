import { Ionicons } from "@expo/vector-icons";
import { categoryAccent, colors, serif } from "@/components/theme";
import { ErrorState, LoadingState } from "@/components/ui";
import { api } from "@/lib/api";
import { categoryLabel } from "@/lib/format";
import type { Category, Ingredient } from "@/lib/types";
import { useQuery } from "@/lib/use-query";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const pointer = Platform.OS === "web" ? ({ cursor: "pointer" } as const) : null;

/**
 * Bottom sheet listing one Category's Items. Tapping an Item toggles it (✓ when picked); the
 * screen underneath never changes route. Render it as a sibling over the screen; `null` hides it.
 */
export function CategorySheet({
  category,
  has,
  onToggle,
  onClose,
}: {
  category: Category | null;
  has: (id: string) => boolean;
  onToggle: (ingredient: Ingredient) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!category) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [category, onClose]);

  if (!category) return null;
  return <SheetBody key={category.id} category={category} has={has} onToggle={onToggle} onClose={onClose} />;
}

function SheetBody({
  category,
  has,
  onToggle,
  onClose,
}: {
  category: Category;
  has: (id: string) => boolean;
  onToggle: (ingredient: Ingredient) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { status, data, error, retry } = useQuery(`category-items:${category.id}`, () =>
    api.items({ category: category.id }),
  );
  const accent = categoryAccent[category.id] ?? colors.green;
  const name = categoryLabel(category.id, category.name);

  return (
    <View style={styles.overlay} pointerEvents="box-none" testID="category-sheet">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("common.close")}
        onPress={onClose}
        style={styles.dim}
        testID="category-sheet-dim"
      />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.grabber} />
        <View style={styles.header}>
          <View style={[styles.letter, { backgroundColor: accent }]}>
            <Text style={styles.letterText}>{name.slice(0, 1).toUpperCase()}</Text>
          </View>
          <Text style={styles.title} accessibilityRole="header">
            {name}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("categorySheet.done")}
            onPress={onClose}
            style={[styles.done, pointer]}
            testID="category-sheet-done"
          >
            <Text style={styles.doneText}>{t("categorySheet.done")}</Text>
          </Pressable>
        </View>
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {status === "loading" ? <LoadingState label={t("categorySheet.loading")} /> : null}
          {status === "error" ? <ErrorState message={error} onRetry={retry} /> : null}
          {status === "ready" && data?.items.length === 0 ? (
            <Text style={styles.empty}>{t("categorySheet.empty")}</Text>
          ) : null}
          {status === "ready" && data
            ? data.items.map((item) => {
                const picked = has(item.id);
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: picked }}
                    accessibilityLabel={item.name}
                    onPress={() => onToggle({ id: item.id, name: item.name })}
                    style={({ pressed }) => [
                      styles.row,
                      picked && styles.rowPicked,
                      pressed && styles.pressed,
                      pointer,
                    ]}
                    testID={`category-sheet-item-${item.id}`}
                  >
                    <Text style={styles.rowName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {picked ? (
                      <Ionicons name="checkmark-circle" size={24} color={colors.green} />
                    ) : (
                      <Text style={styles.plus}>＋</Text>
                    )}
                  </Pressable>
                );
              })
            : null}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, zIndex: 20, justifyContent: "flex-end" },
  dim: { ...StyleSheet.absoluteFill, backgroundColor: colors.scrim },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "75%",
    paddingTop: 8,
  },
  grabber: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingVertical: 12 },
  letter: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  letterText: { color: colors.card, fontWeight: "800", fontSize: 18 },
  title: { flex: 1, fontFamily: serif, fontSize: 24, color: colors.ink },
  done: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.green },
  doneText: { color: colors.card, fontWeight: "700" },
  list: { flexGrow: 0 },
  listContent: { paddingHorizontal: 18, paddingBottom: 8, gap: 8 },
  empty: { color: colors.muted, fontSize: 15, paddingVertical: 16, textAlign: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowPicked: { borderColor: colors.green },
  rowName: { flex: 1, fontSize: 16, color: colors.ink, fontWeight: "600" },
  plus: { color: colors.green, fontSize: 20, fontWeight: "800" },
  pressed: { opacity: 0.75 },
});
