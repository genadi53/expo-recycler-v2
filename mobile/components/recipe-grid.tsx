import { IdeaImage } from "@/components/idea-image";
import { IdeaKindLabel } from "@/components/idea-kind-label";
import { colors, serif } from "@/components/theme";
import { kindLabel } from "@/lib/format";
import type { IdeaSummary } from "@/lib/types";
import { router, type Href } from "expo-router";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

const pointer = Platform.OS === "web" ? ({ cursor: "pointer" } as const) : null;

/** Every tile in the grid is this tall; titles clamp to two lines so none grows. */
const TILE_HEIGHT = 200;

/** Full-bleed photo tile (or kind accent + icon), kind badge on top, title on a dark strip. */
export function RecipeTile({ recipe }: { recipe: IdeaSummary }) {
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("home.ideaA11y", { title: recipe.title, kind: kindLabel(recipe.kind), item: recipe.itemName })}
      onPress={() => router.push(`/item/${recipe.itemId}` as Href)}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed, pointer]}
      testID={`recipe-${recipe.id}`}
    >
      <IdeaImage kind={recipe.kind} imageUrl={recipe.imageUrl} style={styles.image}>
        <View style={styles.pill}>
          <IdeaKindLabel kind={recipe.kind} style={styles.pillText} iconSize={12} />
        </View>
        <View style={styles.strip}>
          <Text style={styles.title} numberOfLines={2}>
            {recipe.title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {recipe.itemName}
          </Text>
        </View>
      </IdeaImage>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { height: TILE_HEIGHT, borderRadius: 18, overflow: "hidden" },
  image: { flex: 1 },
  pill: {
    position: "absolute",
    left: 8,
    top: 8,
    paddingVertical: 4,
    paddingLeft: 6,
    paddingRight: 8,
    borderRadius: 999,
    backgroundColor: colors.card,
  },
  pillText: { fontSize: 11, fontWeight: "700", color: colors.ink },
  strip: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 76,
    justifyContent: "flex-end",
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  title: { fontFamily: serif, fontSize: 17, lineHeight: 20, color: "#fff" },
  meta: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2 },
  pressed: { opacity: 0.82 },
});
