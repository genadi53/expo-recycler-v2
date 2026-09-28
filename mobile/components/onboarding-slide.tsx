import { Image, Platform, StyleSheet, Text, View, useWindowDimensions, type ViewStyle } from "react-native";

import { colors, serif } from "@/components/theme";
import type { OnboardingSlide as Slide } from "@/constants/onboarding";

type OnboardingSlideProps = {
  slide: Slide;
  width: number;
};

/**
 * Soft rectangular mask so illustration edges dissolve into the page
 * instead of ending in a hard square. The center stays opaque.
 */
const illustrationEdgeMask =
  "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.35) 4%, #000 12%, #000 88%, rgba(0,0,0,0.35) 96%, transparent 100%), linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.35) 4%, #000 12%, #000 88%, rgba(0,0,0,0.35) 96%, transparent 100%)";

const illustrationEdgeFade: ViewStyle | null =
  Platform.OS === "web"
    ? ({
        maskImage: illustrationEdgeMask,
        WebkitMaskImage: illustrationEdgeMask,
        maskComposite: "intersect",
        WebkitMaskComposite: "source-in",
        maskRepeat: "no-repeat",
        maskSize: "100% 100%",
      } as ViewStyle)
    : null;

export function OnboardingSlide({ slide, width }: OnboardingSlideProps) {
  const { height } = useWindowDimensions();
  const imageSize = Math.min(width - 40, height * 0.42, 360);

  return (
    <View style={[styles.page, { width }]}>
      <View style={styles.inner}>
        <View style={[styles.art, { width: imageSize, height: imageSize }, illustrationEdgeFade]}>
          <Image
            source={slide.image}
            style={styles.artImage}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
            accessibilityLabel={slide.title}
          />
        </View>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  inner: {
    width: "100%",
    maxWidth: 440,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 16,
  },
  art: {
    alignItems: "center",
    justifyContent: "center",
  },
  artImage: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontFamily: serif,
    fontSize: 26,
    lineHeight: 32,
    color: colors.ink,
    textAlign: "center",
    marginTop: 8,
  },
  body: {
    textAlign: "center",
    fontSize: 17,
    lineHeight: 26,
    maxWidth: 360,
    color: colors.muted,
  },
});
