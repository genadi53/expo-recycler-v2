import { IdeaImage } from "@/components/idea-image";
import { IdeaKindLabel } from "@/components/idea-kind-label";
import { colors, serif } from "@/components/theme";
import { ErrorState, LoadingState, Screen } from "@/components/ui";
import { api } from "@/lib/api";
import { basicsList, ingredientChecklist, type ChecklistEntry } from "@/lib/idea-detail";
import { ideaMakeHref } from "@/lib/idea-route";
import { useIngredientList } from "@/lib/ingredient-list";
import type { IdeaDetail } from "@/lib/types";
import { useQuery } from "@/lib/use-query";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const pointer = Platform.OS === "web" ? ({ cursor: "pointer" } as const) : null;
const HERO_HEIGHT = 300;

/** Idea detail: the Ingredient checklist against the Ingredient list, the Basics, the steps and Start making. */
export default function IdeaDetailScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const { status, data, error, retry } = useQuery(`idea:${id}`, () => api.idea(id));

  if (status === "loading") {
    return (
      <Screen title={t("idea.title")} back>
        <LoadingState label={t("idea.loading")} />
      </Screen>
    );
  }
  if (status === "error" || !data) {
    return (
      <Screen title={t("idea.title")} back>
        <ErrorState message={error || t("idea.openFailed")} onRetry={retry} />
      </Screen>
    );
  }
  return <IdeaDetailView idea={data.idea} />;
}

function IdeaDetailView({ idea }: { idea: IdeaDetail }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { has } = useIngredientList();
  const checklist = ingredientChecklist(idea.ingredients, has);
  const basics = basicsList(idea.materials);
  const canMake = idea.steps.length > 0;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} testID="idea-detail">
        <IdeaImage
          kind={idea.kind}
          imageUrl={idea.imageUrl}
          style={[styles.hero, { height: HERO_HEIGHT + insets.top }]}
          iconSize={72}
          accessibilityLabel={t("item.picture", { name: idea.title })}
        />
        <View style={styles.sheet}>
          <View style={styles.pill}>
            <IdeaKindLabel kind={idea.kind} style={styles.pillText} iconSize={14} />
          </View>
          <Text style={styles.title} accessibilityRole="header">
            {idea.title}
          </Text>
          <Text style={styles.from}>{t("idea.fromItem", { item: idea.itemName })}</Text>
          {idea.authorName ? <Text style={styles.muted}>{t("item.sharedBy", { name: idea.authorName })}</Text> : null}

          {checklist.total > 0 ? (
            <View style={styles.card} testID="idea-checklist">
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle}>{t("idea.ingredients")}</Text>
                <Text style={styles.count}>
                  {t("idea.inYourList", { have: checklist.have, total: checklist.total })}
                </Text>
              </View>
              {checklist.entries.map((entry) => (
                <ChecklistRow key={entry.id} entry={entry} />
              ))}
            </View>
          ) : null}
          {basics.length > 0 ? (
            <Text style={styles.muted} testID="idea-basics">
              {t("idea.alsoNeed", { materials: basics.join(", ") })}
            </Text>
          ) : null}

          {canMake ? (
            <>
              <Text style={styles.section} accessibilityRole="header">
                {t("idea.steps")}
              </Text>
              {idea.steps.map((step, index) => (
                <View
                  key={`${index}-${step}`}
                  style={styles.step}
                  accessible
                  accessibilityLabel={t("idea.stepA11y", { number: index + 1, text: step })}
                >
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </>
          ) : null}
        </View>
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("common.goBack")}
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
        style={({ pressed }) => [styles.back, { top: insets.top + 10 }, pressed && styles.pressed, pointer]}
        hitSlop={8}
        testID="idea-back"
      >
        <Ionicons name="chevron-back" size={22} color={colors.ink} />
      </Pressable>

      {canMake ? (
        <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("idea.startMaking")}
            onPress={() => router.push(ideaMakeHref(idea.id))}
            style={({ pressed }) => [styles.start, pressed && styles.pressed, pointer]}
            testID="start-making"
          >
            <Ionicons name="play" size={18} color={colors.card} />
            <Text style={styles.startText}>{t("idea.startMaking")}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function ChecklistRow({ entry }: { entry: ChecklistEntry }) {
  const { t } = useTranslation();
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={t(entry.inList ? "idea.inListA11y" : "idea.missingA11y", { name: entry.name })}
    >
      {entry.inList ? (
        <View style={[styles.mark, styles.markHave]}>
          <Ionicons name="checkmark" size={16} color={colors.card} />
        </View>
      ) : (
        <View style={[styles.mark, styles.markMissing]}>
          <Text style={styles.markMissingText}>!</Text>
        </View>
      )}
      <Text style={styles.rowName} numberOfLines={2}>
        {entry.name}
      </Text>
      {entry.inList ? null : <Text style={styles.missing}>{t("idea.missing")}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: 32 },
  hero: { width: "100%" },
  sheet: {
    marginTop: -32,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
    paddingTop: 22,
    gap: 12,
  },
  pill: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingLeft: 8,
    paddingRight: 10,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  pillText: { fontSize: 12, fontWeight: "700", color: colors.ink },
  title: { fontFamily: serif, fontSize: 32, lineHeight: 37, color: colors.ink },
  from: { marginTop: -6, fontSize: 15, fontWeight: "600", color: colors.green },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 10,
  },
  cardHead: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 10 },
  cardTitle: { fontFamily: serif, fontSize: 20, color: colors.ink },
  count: { flexShrink: 1, fontSize: 13, fontWeight: "700", color: colors.green, textAlign: "right" },
  row: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 32 },
  mark: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  markHave: { backgroundColor: colors.green },
  markMissing: { backgroundColor: colors.terraSoft },
  markMissingText: { color: colors.terra, fontSize: 15, fontWeight: "800" },
  rowName: { flex: 1, fontSize: 16, color: colors.ink },
  missing: { fontSize: 13, fontWeight: "700", color: colors.terra },
  section: { fontFamily: serif, fontSize: 24, color: colors.ink, marginTop: 8 },
  step: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
  },
  stepNumber: { minWidth: 18, fontSize: 18, fontWeight: "800", color: colors.green },
  stepText: { flex: 1, fontSize: 16, lineHeight: 22, color: colors.ink },
  back: {
    position: "absolute",
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.82 },
  dock: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.bg,
  },
  start: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: colors.green,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  startText: { color: colors.card, fontSize: 17, fontWeight: "700" },
});
