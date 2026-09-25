import { colors } from "@/components/theme";
import { EmptyState, ErrorState, ItemRow, LoadingState, Screen } from "@/components/ui";
import { api } from "@/lib/api";
import { useQuery } from "@/lib/use-query";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { StyleSheet, Text } from "react-native";

export default function CategoryScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const { status, data, error, retry } = useQuery(`category:${id}`, async () => {
    const [categories, items] = await Promise.all([api.categories(), api.items({ category: id })]);
    const category = categories.categories.find((entry) => entry.id === id);
    if (!category) throw new Error("No category with that id.");
    return { category, items: items.items };
  });

  return (
    <Screen title={data?.category.name ?? "Category"} back>
      {status === "loading" ? <LoadingState label="Opening this category…" /> : null}
      {status === "error" ? <ErrorState message={error} onRetry={retry} /> : null}
      {status === "ready" && data ? <Text style={styles.description}>{data.category.description}</Text> : null}
      {status === "ready" && data && data.items.length === 0 ? (
        <EmptyState
          title="Nothing in this category yet"
          body="Submit an item and it will land here as soon as it is published."
          actionLabel="Add an item"
          onAction={() => router.push(`/submit?category=${id}` as Href)}
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
