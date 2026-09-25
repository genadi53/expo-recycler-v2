import { BADGE_ART } from "@/constants/badges";
import { colors } from "@/components/theme";
import { Image, Platform, StyleSheet, View, type ImageStyle } from "react-native";

const lockedWeb: ImageStyle | null =
  Platform.OS === "web" ? ({ filter: "grayscale(1)" } as ImageStyle) : null;

export function BadgeArt({
  slug,
  unlocked,
  size,
}: {
  slug: string;
  unlocked: boolean;
  size: number;
}) {
  const source = BADGE_ART[slug];
  if (!source) {
    return <View style={[styles.fallback, { width: size, height: size, borderRadius: size * 0.22 }]} />;
  }

  return (
    <Image
      source={source}
      accessibilityIgnoresInvertColors
      resizeMode="cover"
      style={[
        {
          width: size,
          height: size,
          borderRadius: size * 0.22,
          backgroundColor: colors.card,
        },
        !unlocked && styles.locked,
        !unlocked ? lockedWeb : null,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  fallback: { backgroundColor: colors.greenSoft },
  locked: { opacity: 0.42 },
});
