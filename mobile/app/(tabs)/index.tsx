import { categoryAccent, colors, serif } from "@/components/theme";
import { Button, ErrorState, Input, LoadingState, Screen } from "@/components/ui";
import { api } from "@/lib/api";
import type { Category } from "@/lib/types";
import { useQuery } from "@/lib/use-query";
import { router, type Href } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  const { status, data, error, retry } = useQuery("categories", () => api.categories());
  const [query, setQuery] = useState("");
  const [hint, setHint] = useState("");

  function search() {
    const q = query.trim();
    if (!q) {
      setHint("Type what you have.");
      return;
    }
    setHint("");
    router.push(`/results?q=${encodeURIComponent(q)}` as Href);
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.mark}>Recycler</Text>
        <Text style={styles.tagline}>What do you have, and can it be reused?</Text>
        <Text style={styles.note}>A shared catalog for households. No account.</Text>
      </View>

      <View style={styles.searchBlock}>
        <Input
          value={query}
          onChangeText={(value) => {
            setQuery(value);
            if (hint) setHint("");
          }}
          placeholder="Banana peels, jars, cans…"
          returnKeyType="search"
          onSubmitEditing={search}
          testID="search-input"
          autoCorrect={false}
        />
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
        <Button label="Search the catalog" onPress={search} testID="search-submit" />
      </View>

      <Text style={styles.section}>Or start with a material</Text>
      {status === "loading" ? <LoadingState label="Looking through the catalog…" /> : null}
      {status === "error" ? <ErrorState message={error} onRetry={retry} /> : null}
      {status === "ready" && data?.categories.length === 0 ? (
        <Text style={styles.note}>No categories yet.</Text>
      ) : null}
      {status === "ready" && data ? (
        <View style={styles.grid}>
          {data.categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

function CategoryCard({ category }: { category: Category }) {
  const accent = categoryAccent[category.id] ?? colors.green;
  return (
    <View style={styles.cardSlot}>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push(`/category/${category.id}` as Href)}
        style={styles.card}
        testID={`category-${category.id}`}
      >
        <View style={[styles.cardBar, { backgroundColor: accent }]} />
        <Text style={styles.cardName}>{category.name}</Text>
        <Text style={styles.cardBody} numberOfLines={3}>
          {category.description}
        </Text>
        <Text style={styles.cardCount}>
          {category.itemCount} {category.itemCount === 1 ? "item" : "items"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 6 },
  mark: { fontFamily: serif, fontSize: 40, color: colors.ink },
  tagline: { fontSize: 18, lineHeight: 24, color: colors.ink },
  note: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  searchBlock: { gap: 10 },
  hint: { color: colors.terra, fontSize: 13 },
  section: { fontFamily: serif, fontSize: 24, color: colors.ink, marginTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 },
  cardSlot: { width: "50%", padding: 6 },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 12,
    minHeight: 148,
  },
  cardBar: { height: 6, borderRadius: 6, marginBottom: 8 },
  cardName: { fontSize: 18, fontWeight: "700", color: colors.ink },
  cardBody: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 4, minHeight: 54 },
  cardCount: { marginTop: 8, color: colors.green, fontSize: 12, fontWeight: "700" },
});
