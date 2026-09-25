import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { OnboardingSlide } from "@/components/onboarding-slide";
import { ProgressDots } from "@/components/progress-dots";
import { useProfile } from "@/components/profile";
import { colors } from "@/components/theme";
import { Button } from "@/components/ui";
import { ONBOARDING_SEEN_KEY, ONBOARDING_SLIDES, type OnboardingSlide as Slide } from "@/constants/onboarding";

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const listRef = useRef<FlatList<Slide>>(null);
  const [pageWidth, setPageWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const last = index === ONBOARDING_SLIDES.length - 1;

  const afterOnboarding = useCallback(() => {
    router.replace(profile ? "/" : "/display-name");
  }, [profile]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const seen = await AsyncStorage.getItem(ONBOARDING_SEEN_KEY);
      if (!cancelled && seen === "1") afterOnboarding();
    })();
    return () => {
      cancelled = true;
    };
  }, [afterOnboarding]);

  const finish = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, "1");
    afterOnboarding();
  }, [afterOnboarding]);

  const goTo = useCallback(
    (next: number) => {
      if (!pageWidth) return;
      listRef.current?.scrollToOffset({ offset: next * pageWidth, animated: true });
      setIndex(next);
    },
    [pageWidth],
  );

  function onScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (!pageWidth) return;
    const next = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
    setIndex(Math.max(0, Math.min(next, ONBOARDING_SLIDES.length - 1)));
  }

  return (
    <View
      style={[styles.root, { paddingTop: Math.max(insets.top, 12), paddingBottom: Math.max(insets.bottom, 16) }]}
    >
      <View style={styles.top}>
        {last ? (
          <View />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
            onPress={finish}
            hitSlop={8}
            testID="onboarding-skip"
            style={styles.skipHit}
          >
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        )}
      </View>

      <View
        style={styles.pager}
        onLayout={(event) => {
          const width = event.nativeEvent.layout.width;
          if (width > 0 && width !== pageWidth) setPageWidth(width);
        }}
      >
        {pageWidth > 0 ? (
          <FlatList
            ref={listRef}
            data={ONBOARDING_SLIDES}
            keyExtractor={(slide) => slide.id}
            horizontal
            pagingEnabled
            bounces={false}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScrollEnd}
            getItemLayout={(_, itemIndex) => ({
              length: pageWidth,
              offset: pageWidth * itemIndex,
              index: itemIndex,
            })}
            renderItem={({ item }) => <OnboardingSlide slide={item} width={pageWidth} />}
          />
        ) : null}
      </View>

      <ProgressDots count={ONBOARDING_SLIDES.length} activeIndex={index} />

      <View style={styles.actions}>
        <Button
          label={last ? "Get started" : "Next"}
          onPress={() => (last ? void finish() : goTo(index + 1))}
          testID={last ? "onboarding-done" : "onboarding-next"}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    overflow: "hidden",
  },
  top: {
    minHeight: 44,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  skipHit: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  skip: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.green,
  },
  pager: {
    flex: 1,
  },
  actions: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
});
