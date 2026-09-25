import { Image, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { colors, serif } from "@/components/theme";
import type { OnboardingSlide as Slide } from "@/constants/onboarding";

type OnboardingSlideProps = {
  slide: Slide;
  width: number;
};

export function OnboardingSlide({ slide, width }: OnboardingSlideProps) {
  const { height } = useWindowDimensions();
  const imageSize = Math.min(width - 40, height * 0.42, 360);

  return (
    <View style={[styles.page, { width }]}>
      <View style={styles.inner}>
        <Image
          source={slide.image}
          style={{ width: imageSize, height: imageSize }}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          accessibilityLabel={slide.title}
        />
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
