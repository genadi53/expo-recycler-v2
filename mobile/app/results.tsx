import { colors, serif } from "@/components/theme";
import { EmptyState, ErrorState, ItemRow, LoadingState, Screen } from "@/components/ui";
import { api } from "@/lib/api";
import { useQuery } from "@/lib/use-query";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { StyleSheet, Text } from "react-native";

export default function ResultsScreen() {
  const params = useLocalSearchParams<{ q?: string }>();
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const { status, data, error, retry } = useQuery(`results:${q}`, () => api.items({ q }));

  return (
    <Screen title="Results" back>
      <Text style={styles.query}>{q ? `Matches for “${q}”` : "Everything in the catalog"}</Text>
      {status === "loading" ? <LoadingState label="Searching the catalog…" /> : null}
      {status === "error" ? <ErrorState message={error} onRetry={retry} /> : null}
      {status === "ready" && data && data.items.length === 0 ? (
        <EmptyState
          title="Nothing matches"
          body={
            q
              ? `The catalog doesn’t have “${q}” yet. Add a reuse idea and it shows up in search right away.`
              : "The catalog is empty."
          }
          actionLabel={q ? `Add “${q.length > 28 ? `${q.slice(0, 28)}…` : q}”` : "Submit an item"}
          onAction={() => router.push((q ? `/submit?item=${encodeURIComponent(q)}` : "/submit") as Href)}
          icon="search-outline"
        />
      ) : null}
      {status === "ready" && data
        ? data.items.map((item) => (
            <ItemRow key={item.id} item={item} onPress={() => router.push(`/item/${item.id}` as Href)} />
          ))
        : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  query: { fontFamily: serif, fontSize: 26, color: colors.ink },
});
