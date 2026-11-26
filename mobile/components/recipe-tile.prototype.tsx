/**
 * PROTOTYPE — throwaway. Lives on branch prototype/recipe-tile only; never merge to main.
 *
 * Question: what should the recipe tile's image area look like on /recipes (2-column grid)?
 * Three variants on the existing /recipes route, switchable via ?variant=A|B|C.
 * ?photos=mixed (default) gives every other tile a sample photo; ?photos=real uses API data only; ?photos=none forces the fallback.
 */
import { IdeaKindLabel } from "@/components/idea-kind-label";
import { colors, serif } from "@/components/theme";
import { ideaKindMeta } from "@/constants/idea-kinds";
import { absoluteApiUrl } from "@/lib/api";
import type { IdeaSummary } from "@/lib/types";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from "react-native";

const SAMPLE = require("../assets/images/onboarding/reuse-first.png");
const pointer = Platform.OS === "web" ? ({ cursor: "pointer" } as const) : null;

export const VARIANTS = [
  { key: "A", name: "Compact tile, 96px image" },
  { key: "B", name: "Fresh-ideas card" },
  { key: "C", name: "Full-bleed photo tile" },
  { key: "D", name: "Full-bleed + kind pill, fixed height" },
  { key: "E", name: "Card B, fixed height" },
] as const;

type PhotosMode = "mixed" | "real" | "none";

function useProtoParams() {
  const params = useLocalSearchParams<{ variant?: string; photos?: string }>();
  const variant = VARIANTS.some((v) => v.key === params.variant) ? (params.variant as string) : "A";
  const photos: PhotosMode = params.photos === "real" || params.photos === "none" ? params.photos : "mixed";
  return { variant, photos };
}

function sourceFor(recipe: IdeaSummary, index: number, photos: PhotosMode): ImageSourcePropType | null {
  if (photos === "none") return null;
  const uri = absoluteApiUrl(recipe.imageUrl);
  if (uri) return { uri };
  if (photos === "mixed" && index % 2 === 0) return SAMPLE;
  return null;
}

/** Photo, or the kind accent + kind icon (as in Fresh ideas). */
function ImageArea({ recipe, source, height, iconSize, children }: { recipe: IdeaSummary; source: ImageSourcePropType | null; height: number | "100%"; iconSize: number; children?: React.ReactNode }) {
  const meta = ideaKindMeta(recipe.kind);
  return (
    <View style={[styles.imageArea, { height, backgroundColor: meta?.accent ?? colors.green }]}>
      {source ? (
        <Image source={source} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <Ionicons name={meta?.icon ?? "bulb-outline"} size={iconSize} color={colors.card} />
      )}
      {children}
    </View>
  );
}

function open(recipe: IdeaSummary) {
  router.push(`/item/${recipe.itemId}` as Href);
}

function VariantA({ recipe, source }: TileProps) {
  return (
    <Pressable onPress={() => open(recipe)} style={({ pressed }) => [styles.tileA, pressed && styles.pressed, pointer]}>
      <View style={styles.roundedA}>
        <ImageArea recipe={recipe} source={source} height={96} iconSize={32} />
      </View>
      <IdeaKindLabel kind={recipe.kind} style={styles.kind} iconSize={12} />
      <Text style={styles.titleA} numberOfLines={2}>{recipe.title}</Text>
      <Text style={styles.meta} numberOfLines={1}>{recipe.itemName}</Text>
    </Pressable>
  );
}

function VariantB({ recipe, source }: TileProps) {
  return (
    <Pressable onPress={() => open(recipe)} style={({ pressed }) => [styles.tileB, pressed && styles.pressed, pointer]}>
      <View style={styles.roundedB}>
        <ImageArea recipe={recipe} source={source} height={150} iconSize={44}>
          <View style={styles.pill}>
            <IdeaKindLabel kind={recipe.kind} style={styles.pillText} iconSize={12} />
          </View>
        </ImageArea>
      </View>
      <View style={styles.bodyB}>
        <Text style={styles.titleB} numberOfLines={2}>{recipe.title}</Text>
        <Text style={styles.meta} numberOfLines={1}>{recipe.itemName}</Text>
      </View>
    </Pressable>
  );
}

function VariantC({ recipe, source }: TileProps) {
  return (
    <Pressable onPress={() => open(recipe)} style={({ pressed }) => [styles.tileC, pressed && styles.pressed, pointer]}>
      <ImageArea recipe={recipe} source={source} height="100%" iconSize={48}>
        <View style={styles.scrim}>
          <Text style={styles.titleC} numberOfLines={2}>{recipe.title}</Text>
          <Text style={styles.metaC} numberOfLines={1}>{recipe.itemName}</Text>
        </View>
      </ImageArea>
    </Pressable>
  );
}

function VariantD({ recipe, source }: TileProps) {
  return (
    <Pressable onPress={() => open(recipe)} style={({ pressed }) => [styles.tileC, pressed && styles.pressed, pointer]}>
      <ImageArea recipe={recipe} source={source} height="100%" iconSize={48}>
        <View style={styles.pill}>
          <IdeaKindLabel kind={recipe.kind} style={styles.pillText} iconSize={12} />
        </View>
        <View style={[styles.scrim, styles.scrimD]}>
          <Text style={styles.titleC} numberOfLines={2}>{recipe.title}</Text>
          <Text style={styles.metaC} numberOfLines={1}>{recipe.itemName}</Text>
        </View>
      </ImageArea>
    </Pressable>
  );
}

function VariantE({ recipe, source }: TileProps) {
  return (
    <Pressable onPress={() => open(recipe)} style={({ pressed }) => [styles.tileB, styles.tileE, pressed && styles.pressed, pointer]}>
      <ImageArea recipe={recipe} source={source} height={150} iconSize={44}>
        <View style={styles.pill}>
          <IdeaKindLabel kind={recipe.kind} style={styles.pillText} iconSize={12} />
        </View>
      </ImageArea>
      <View style={styles.bodyB}>
        <Text style={styles.titleB} numberOfLines={2}>{recipe.title}</Text>
        <Text style={styles.meta} numberOfLines={1}>{recipe.itemName}</Text>
      </View>
    </Pressable>
  );
}

type TileProps = { recipe: IdeaSummary; source: ImageSourcePropType | null };

export function PrototypeRecipeTile({ recipe, index }: { recipe: IdeaSummary; index: number }) {
  const { variant, photos } = useProtoParams();
  const source = sourceFor(recipe, index, photos);
  if (variant === "B") return <VariantB recipe={recipe} source={source} />;
  if (variant === "D") return <VariantD recipe={recipe} source={source} />;
  if (variant === "E") return <VariantE recipe={recipe} source={source} />;
  if (variant === "C") return <VariantC recipe={recipe} source={source} />;
  return <VariantA recipe={recipe} source={source} />;
}

/** Floating bottom bar: ← / → (also arrow keys) cycle variants; photos chip cycles mixed → real → none. */
export function PrototypeSwitcher() {
  const { variant, photos } = useProtoParams();
  const [, force] = useState(0);
  const i = VARIANTS.findIndex((v) => v.key === variant);
  const go = (delta: number) => {
    const next = VARIANTS[(i + delta + VARIANTS.length) % VARIANTS.length].key;
    router.setParams({ variant: next });
    force((n) => n + 1);
  };
  const cyclePhotos = () => {
    const order: PhotosMode[] = ["mixed", "real", "none"];
    router.setParams({ photos: order[(order.indexOf(photos) + 1) % order.length] });
  };

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!__DEV__) return null;
  const current = VARIANTS[i];
  return (
    <View style={styles.bar} pointerEvents="box-none">
      <View style={styles.barInner}>
        <Pressable onPress={() => go(-1)} style={[styles.barBtn, pointer]}><Ionicons name="chevron-back" size={20} color="#fff" /></Pressable>
        <Text style={styles.barLabel}>{current.key} ({current.name})</Text>
        <Pressable onPress={() => go(1)} style={[styles.barBtn, pointer]}><Ionicons name="chevron-forward" size={20} color="#fff" /></Pressable>
        <Pressable onPress={cyclePhotos} style={[styles.barChip, pointer]}><Text style={styles.barChipText}>photos: {photos}</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.82 },
  imageArea: { width: "100%", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  kind: { color: colors.green, fontSize: 11, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase" },
  meta: { color: colors.muted, fontSize: 12, marginTop: 4 },

  tileA: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 12, gap: 4, overflow: "hidden" },
  roundedA: { borderRadius: 10, overflow: "hidden", marginBottom: 4 },
  titleA: { fontSize: 16, fontWeight: "700", color: colors.ink, lineHeight: 20 },

  tileB: { backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.line, overflow: "hidden" },
  roundedB: { overflow: "hidden" },
  pill: { position: "absolute", left: 8, top: 8, paddingVertical: 4, paddingLeft: 6, paddingRight: 8, borderRadius: 999, backgroundColor: colors.card },
  pillText: { fontSize: 11, fontWeight: "700", color: colors.ink },
  bodyB: { paddingTop: 10, paddingHorizontal: 12, paddingBottom: 14 },
  titleB: { fontFamily: serif, fontSize: 17, lineHeight: 20, color: colors.ink },

  tileC: { height: 200, borderRadius: 18, overflow: "hidden" },
  scrim: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 12, backgroundColor: "rgba(0,0,0,0.45)" },
  titleC: { fontFamily: serif, fontSize: 17, lineHeight: 20, color: "#fff" },
  scrimD: { minHeight: 76, justifyContent: "flex-end" },
  tileE: { height: 240 },
  metaC: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2 },

  bar: { position: "absolute", left: 0, right: 0, bottom: 24, alignItems: "center" },
  barInner: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 999, backgroundColor: "#111", shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  barBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "#333" },
  barLabel: { color: "#fff", fontWeight: "700", fontSize: 14, paddingHorizontal: 4 },
  barChip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: "#ffd54a" },
  barChipText: { color: "#111", fontWeight: "700", fontSize: 12 },
});
