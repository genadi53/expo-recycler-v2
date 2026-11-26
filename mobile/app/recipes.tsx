import { RecipeTile } from "@/components/recipe-grid";
import { colors } from "@/components/theme";
import { Chip, EmptyState, ErrorState, LoadingState, Screen } from "@/components/ui";
import { IDEA_KINDS, IDEA_KIND_META, parseIdeaKind, type IdeaKind } from "@/constants/idea-kinds";
import { api } from "@/lib/api";
import { kindLabel } from "@/lib/format";
import { submitRoute } from "@/lib/submit-route";
import { useQuery } from "@/lib/use-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

/** Explore ideas: every published Idea, newest first, filtered by kind (or All). */
export default function ExploreIdeasScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ kind?: string }>();
  const [kind, setKind] = useState<IdeaKind | null>(() => parseIdeaKind(params.kind));
  const { status, data, error, retry } = useQuery(`ideas-${kind ?? "all"}`, () =>
    api.ideas(kind ? { kind } : {}),
  );

  return (
    <Screen title={t("recipes.title")} back>
      <Text style={styles.lead}>{t("recipes.lead")}</Text>

      <View style={styles.chips} accessibilityLabel={t("recipes.filterA11y")} testID="ideas-kind-filter">
        <Chip label={t("recipes.allKinds")} selected={kind === null} onPress={() => setKind(null)} testID="kind-all" />
        {IDEA_KINDS.map((id) => (
          <Chip
            key={id}
            label={kindLabel(id)}
            icon={IDEA_KIND_META[id].icon}
            iconColor={IDEA_KIND_META[id].accent}
            selected={kind === id}
            onPress={() => setKind(id)}
            testID={`kind-${id}`}
          />
        ))}
      </View>

      {status === "loading" ? <LoadingState label={t("recipes.loading")} /> : null}
      {status === "error" ? <ErrorState message={error} onRetry={retry} /> : null}
      {status === "ready" && data && data.ideas.length === 0 ? (
        <EmptyState
          title={kind ? t("recipes.emptyKindTitle", { kind: kindLabel(kind) }) : t("recipes.emptyTitle")}
          body={t("recipes.emptyBody")}
          icon={kind ? IDEA_KIND_META[kind].icon : "bulb-outline"}
          actionLabel={t("recipes.shareFirst")}
          onAction={() => router.push(submitRoute({ mode: "idea", kind: kind ?? undefined }))}
        />
      ) : null}
      {status === "ready" && data && data.ideas.length > 0 ? (
        <View style={styles.grid} testID="recipes-grid">
          {data.ideas.map((idea) => (
            <View key={idea.id} style={styles.slot}>
              <RecipeTile recipe={idea} />
            </View>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -5 },
  slot: { width: "50%", padding: 5 },
});
