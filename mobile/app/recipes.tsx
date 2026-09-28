import { RecipeTile } from "@/components/recipe-grid";
import { colors } from "@/components/theme";
import { EmptyState, ErrorState, LoadingState, Screen } from "@/components/ui";
import { api } from "@/lib/api";
import { useQuery } from "@/lib/use-query";
import { StyleSheet, Text, View } from "react-native";

export default function RecipesScreen() {
  const { status, data, error, retry } = useQuery("recipes", () => api.ideas({ kind: "cook" }));

  return (
    <Screen title="Recipes" back>
      <Text style={styles.lead}>Cook ideas from the shared catalog. Open one to see steps on the item.</Text>

      {status === "loading" ? <LoadingState label="Loading recipes…" /> : null}
      {status === "error" ? <ErrorState message={error} onRetry={retry} /> : null}
      {status === "ready" && data && data.ideas.length === 0 ? (
        <EmptyState
          title="No recipes yet"
          body="Share a cook idea from Submit and it shows up here right away."
          icon="restaurant-outline"
        />
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
