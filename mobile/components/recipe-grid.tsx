import { IdeaKindLabel } from "@/components/idea-kind-label";
import { colors } from "@/components/theme";
import { absoluteApiUrl } from "@/lib/api";
import type { IdeaSummary } from "@/lib/types";
import { router, type Href } from "expo-router";
import { useTranslation } from "react-i18next";
import { Image, Platform, Pressable, StyleSheet, Text } from "react-native";

const pointer = Platform.OS === "web" ? ({ cursor: "pointer" } as const) : null;

export function RecipeTile({ recipe }: { recipe: IdeaSummary }) {
  const { t } = useTranslation();
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
        <Image
          source={{ uri: imageUri }}
          style={styles.thumb}
          accessibilityLabel={t("recipes.picture", { title: recipe.title })}
        />
      ) : null}
      <IdeaKindLabel kind={recipe.kind} style={styles.kind} iconSize={12} />
      <Text style={styles.title} numberOfLines={2}>
        {recipe.title}
      </Text>
      <Text style={styles.meta} numberOfLines={1}>
        {recipe.itemName}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  pressed: { opacity: 0.82 },
});
