import { homeCardShadow } from "@/components/home-action-card";
import { IdeaImage } from "@/components/idea-image";
import { IdeaKindLabel } from "@/components/idea-kind-label";
import { colors, serif } from "@/components/theme";
import { EmptyState, ErrorState, LoadingState, Screen } from "@/components/ui";
import { api } from "@/lib/api";
import { kindLabel } from "@/lib/format";
import { useIngredientList } from "@/lib/ingredient-list";
import { submitRoute } from "@/lib/submit-route";
import type { Match, MatchTier } from "@/lib/types";
import { useQuery } from "@/lib/use-query";
import { router, type Href } from "expo-router";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

const pointer = Platform.OS === "web" ? ({ cursor: "pointer" } as const) : null;

/** Tiers in display order, each with its heading key and dot colour (see GLOSSARY.md, "Match"). */
const TIERS: { tier: MatchTier; labelKey: string; dot: string }[] = [
  { tier: "now", labelKey: "matches.tierNow", dot: colors.green },
  { tier: "almost", labelKey: "matches.tierAlmost", dot: colors.terra },
  { tier: "later", labelKey: "matches.tierLater", dot: colors.muted },
];

const BUILDER_ROUTE = "/browse" as Href;

/** Back to the Ingredient list builder as the person left it. */
function editList() {
  if (router.canGoBack()) router.back();
  else router.replace(BUILDER_ROUTE);
}

/** Matches: every Idea that uses an Ingredient from the list, grouped into Make it now / Almost there / Save for later. */
export default function MatchesScreen() {
  const { t } = useTranslation();
  const { ingredients } = useIngredientList();
  const ids = ingredients.map((ingredient) => ingredient.id);
  const { status, data, error, retry } = useQuery(`matches-${ids.join(",")}`, () =>
    ids.length ? api.matches(ids) : Promise.resolve(null),
  );

  if (ids.length === 0) {
    return (
      <Screen title={t("matches.title")} back>
        <EmptyState
          title={t("matches.noListTitle")}
          body={t("matches.noListBody")}
          icon="basket-outline"
          actionLabel={t("matches.addIngredients")}
          onAction={editList}
        />
      </Screen>
    );
  }

  const matches = data?.matches ?? [];

  return (
    <Screen title={t("matches.title")} back>
      <Summary ideaCount={status === "ready" ? matches.length : null} ingredientCount={ids.length} />

      {status === "loading" ? <LoadingState label={t("matches.loading")} /> : null}
      {status === "error" ? <ErrorState message={error} onRetry={retry} /> : null}
      {status === "ready" && matches.length === 0 ? (
        <EmptyState
          title={t("matches.emptyTitle")}
          body={t("matches.emptyBody")}
          icon="bulb-outline"
          actionLabel={t("matches.shareFirst")}
          onAction={() => router.push(submitRoute({ mode: "idea" }))}
        />
      ) : null}
      {status === "ready"
        ? TIERS.map(({ tier, labelKey, dot }) => {
            const inTier = matches.filter((match) => match.tier === tier);
            if (inTier.length === 0) return null;
            const label = t(labelKey);
            return (
              <View key={tier} style={styles.tier} testID={`matches-tier-${tier}`}>
                <View
                  style={styles.tierHeading}
                  accessible
                  accessibilityRole="header"
                  accessibilityLabel={t("matches.tierA11y", { tier: label, count: inTier.length })}
                >
                  <View style={[styles.dot, { backgroundColor: dot }]} />
                  <Text style={styles.tierLabel}>{label}</Text>
                  <Text style={styles.tierCount}>{inTier.length}</Text>
                </View>
                {inTier.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </View>
            );
          })
        : null}
    </Screen>
  );
}

/** The `greenDark` summary card: "N ideas / from M ingredients" and the "Edit list" pill. */
function Summary({ ideaCount, ingredientCount }: { ideaCount: number | null; ingredientCount: number }) {
  const { t } = useTranslation();
  return (
    <View style={styles.summary} testID="matches-summary">
      <View style={styles.summaryRing} pointerEvents="none" />
      <View style={styles.summaryText}>
        {ideaCount !== null ? (
          <Text style={styles.summaryIdeas} accessibilityRole="header">
            {t("matches.summaryIdeas", { count: ideaCount })}
          </Text>
        ) : null}
        <Text style={styles.summaryFrom}>{t("matches.summaryFrom", { count: ingredientCount })}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={editList}
        hitSlop={8}
        style={({ pressed }) => [styles.editPill, pressed && styles.pressed, pointer]}
        testID="matches-edit-list"
      >
        <Text style={styles.editPillText}>{t("matches.editList")}</Text>
      </Pressable>
    </View>
  );
}

/** One Match: image (or kind accent), kind pill, serif title, "✓ have/need" and what's missing. Opens Idea detail. */
function MatchCard({ match }: { match: Match }) {
  const { t } = useTranslation();
  const names = match.missing.join(", ");
  const a11y = {
    title: match.title,
    kind: kindLabel(match.kind),
    have: match.have,
    need: match.need,
    names,
  };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t(match.missing.length ? "matches.cardMissingA11y" : "matches.cardA11y", a11y)}
      onPress={() => router.push(`/idea/${match.id}` as Href)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed, pointer]}
      testID={`match-${match.id}`}
    >
      <IdeaImage kind={match.kind} imageUrl={match.imageUrl} style={styles.image} iconSize={30} />
      <View style={styles.body}>
        <View style={styles.kindPill}>
          <IdeaKindLabel kind={match.kind} style={styles.kindPillText} iconSize={12} />
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {match.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          <Text style={styles.have}>{t("matches.have", { have: match.have, need: match.need })}</Text>
          {match.missing.length ? (
            <Text style={styles.need}>
              {"  "}
              {t("matches.need", { names })}
            </Text>
          ) : null}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.greenDark,
    borderRadius: 28,
    padding: 20,
    overflow: "hidden",
  },
  summaryRing: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 18,
    borderColor: colors.green,
  },
  summaryText: { flex: 1, gap: 2 },
  summaryIdeas: { fontFamily: serif, fontSize: 30, lineHeight: 36, color: colors.card },
  summaryFrom: { color: colors.greenSoft, fontSize: 15, lineHeight: 21 },
  editPill: {
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  editPillText: { color: colors.greenDark, fontWeight: "800", fontSize: 14 },
  tier: { gap: 10 },
  tierHeading: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  tierLabel: { fontSize: 13, fontWeight: "800", color: colors.ink, textTransform: "uppercase", letterSpacing: 0.6 },
  tierCount: { fontSize: 13, fontWeight: "700", color: colors.muted },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 10,
    ...homeCardShadow,
  },
  image: { width: 88, height: 88, borderRadius: 14 },
  body: { flex: 1, gap: 4 },
  kindPill: {
    alignSelf: "flex-start",
    paddingVertical: 3,
    paddingLeft: 6,
    paddingRight: 8,
    borderRadius: 999,
    backgroundColor: colors.bg,
  },
  kindPillText: { fontSize: 11, fontWeight: "700", color: colors.ink },
  title: { fontFamily: serif, fontSize: 18, lineHeight: 22, color: colors.ink },
  meta: { fontSize: 13 },
  have: { color: colors.green, fontWeight: "800" },
  need: { color: colors.terra, fontWeight: "700" },
  pressed: { opacity: 0.82 },
});
