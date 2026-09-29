import { colors } from "@/components/theme";
import { EmptyState, ErrorState, ItemRow, LoadingState, Screen } from "@/components/ui";
import { api } from "@/lib/api";
import { categoryLabel } from "@/lib/format";
import { useQuery } from "@/lib/use-query";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text } from "react-native";

export default function CategoryScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const { status, data, error, retry } = useQuery(`category:${id}`, async () => {
    const [categories, items] = await Promise.all([api.categories(), api.items({ category: id })]);
    const category = categories.categories.find((entry) => entry.id === id);
    if (!category) throw new Error(t("category.missing"));
    return { category, items: items.items };
  });

  const title = data ? categoryLabel(data.category.id, data.category.name) : t("category.title");

  return (
    <Screen title={title} back>
      {status === "loading" ? <LoadingState label={t("category.loading")} /> : null}
      {status === "error" ? <ErrorState message={error} onRetry={retry} /> : null}
      {status === "ready" && data ? <Text style={styles.description}>{data.category.description}</Text> : null}
      {status === "ready" && data && data.items.length === 0 ? (
        <EmptyState
          title={t("category.emptyTitle")}
          body={t("category.emptyBody")}
          actionLabel={t("category.addItem")}
          onAction={() => router.push(`/submit?mode=item&category=${id}` as Href)}
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
  description: { color: colors.muted, fontSize: 16, lineHeight: 22 },
});
