import { colors, serif } from "@/components/theme";
import { absoluteApiUrl } from "@/lib/api";
import { KIND_LABEL } from "@/lib/format";
import type { IdeaSummary } from "@/lib/types";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";

const pointer = Platform.OS === "web" ? ({ cursor: "pointer" } as const) : null;

export function RecipeTile({ recipe }: { recipe: IdeaSummary }) {
  const imageUri = absoluteApiUrl(recipe.imageUrl);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${recipe.title}, ${recipe.itemName}`}
      onPress={() => router.push(`/item/${recipe.itemId}` as Href)}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed, pointer]}
      testID={`recipe-${recipe.id}`}
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.thumb} accessibilityLabel={`${recipe.title} picture`} />
      ) : null}
      <Text style={styles.kind}>{KIND_LABEL[recipe.kind]}</Text>
      <Text style={styles.title} numberOfLines={2}>
        {recipe.title}
      </Text>
      <Text style={styles.meta} numberOfLines={1}>
        {recipe.itemName}
      </Text>
    </Pressable>
  );
}

export function RecipePreview({ recipes }: { recipes: IdeaSummary[] }) {
  const preview = recipes.slice(0, 4);
  if (preview.length === 0) return null;

  return (
    <View style={styles.section} testID="recipe-preview">
      <Text style={styles.heading}>Recipes</Text>
      <Text style={styles.note}>Cook ideas from the catalog. Tap one to open the item.</Text>
      <View style={styles.grid}>
        {preview.map((recipe) => (
          <View key={recipe.id} style={styles.slot}>
            <RecipeTile recipe={recipe} />
          </View>
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Browse recipes"
        onPress={() => router.push("/recipes" as Href)}
        style={({ pressed }) => [styles.linkRow, pressed && styles.pressed, pointer]}
        testID="browse-recipes-link"
      >
        <Text style={styles.linkText}>Browse recipes</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.green} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  heading: { fontFamily: serif, fontSize: 24, color: colors.ink },
  note: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -5 },
  slot: { width: "50%", padding: 5 },
  tile: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 12,
    minHeight: 112,
    gap: 4,
    overflow: "hidden",
  },
  thumb: {
    width: "100%",
    height: 72,
    borderRadius: 10,
    backgroundColor: colors.line,
    marginBottom: 2,
  },
  kind: {
    color: colors.green,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  title: { fontSize: 16, fontWeight: "700", color: colors.ink, lineHeight: 20 },
  meta: { color: colors.muted, fontSize: 12, marginTop: 4 },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 2,
    paddingVertical: 4,
  },
  linkText: { color: colors.green, fontSize: 15, fontWeight: "700" },
  pressed: { opacity: 0.82 },
});
