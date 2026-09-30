import { colors, serif } from "@/components/theme";
import { EmptyState, ErrorState, ItemRow, LoadingState, Screen } from "@/components/ui";
import { api } from "@/lib/api";
import { submitRoute } from "@/lib/submit-route";
import { useQuery } from "@/lib/use-query";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text } from "react-native";

export default function ResultsScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ q?: string }>();
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const { status, data, error, retry } = useQuery(`results:${q}`, () => api.items({ q }));
  const shortQ = q.length > 28 ? `${q.slice(0, 28)}…` : q;

  return (
    <Screen title={t("results.title")} back>
      <Text style={styles.query}>{q ? t("results.matchesFor", { q }) : t("results.everything")}</Text>
      {status === "loading" ? <LoadingState label={t("results.loading")} /> : null}
      {status === "error" ? <ErrorState message={error} onRetry={retry} /> : null}
      {status === "ready" && data && data.items.length === 0 ? (
        <EmptyState
          title={t("results.nothingTitle")}
          body={q ? t("results.nothingBody", { q }) : t("results.emptyCatalog")}
          actionLabel={q ? t("results.addQuery", { q: shortQ }) : t("results.submitItem")}
          onAction={() =>
            router.push(q ? submitRoute({ mode: "item", item: q }) : submitRoute({ mode: "item" }))
          }
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
