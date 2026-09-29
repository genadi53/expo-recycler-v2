import { RecipeTile } from "@/components/recipe-grid";
import { colors } from "@/components/theme";
import { EmptyState, ErrorState, LoadingState, Screen } from "@/components/ui";
import { api } from "@/lib/api";
import { useQuery } from "@/lib/use-query";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

export default function RecipesScreen() {
  const { t } = useTranslation();
  const { status, data, error, retry } = useQuery("recipes", () => api.ideas({ kind: "cook" }));

  return (
    <Screen title={t("recipes.title")} back>
      <Text style={styles.lead}>{t("recipes.lead")}</Text>

      {status === "loading" ? <LoadingState label={t("recipes.loading")} /> : null}
      {status === "error" ? <ErrorState message={error} onRetry={retry} /> : null}
      {status === "ready" && data && data.ideas.length === 0 ? (
        <EmptyState title={t("recipes.emptyTitle")} body={t("recipes.emptyBody")} icon="restaurant-outline" />
      ) : null}
      {status === "ready" && data && data.ideas.length > 0 ? (
        <View style={styles.grid} testID="recipes-grid">
          {data.ideas.map((recipe) => (
            <View key={recipe.id} style={styles.slot}>
              <RecipeTile recipe={recipe} />
            </View>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -5 },
  slot: { width: "50%", padding: 5 },
});
