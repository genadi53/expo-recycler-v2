import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { type ReactNode, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { useProfile } from "@/components/profile";
import { colors } from "@/components/theme";
import { ONBOARDING_SEEN_KEY } from "@/constants/onboarding";

type OnboardingGateProps = {
  children: ReactNode;
};

/**
 * Holds the splash until we know whether to show onboarding or the name screen,
 * then redirects once. Always renders children so the Stack is mounted before
 * `router.replace`.
 */
export function OnboardingGate({ children }: OnboardingGateProps) {
  const pathname = usePathname();
  const { ready, profile } = useProfile();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const seen = await AsyncStorage.getItem(ONBOARDING_SEEN_KEY);
      if (cancelled) return;

      if (seen !== "1") {
        if (pathname !== "/onboarding") router.replace("/onboarding");
        setChecking(false);
        await SplashScreen.hideAsync();
        return;
      }

      if (!ready) return;

      if (!profile) {
        if (pathname !== "/display-name") router.replace("/display-name");
      } else if (pathname === "/onboarding") {
        router.replace("/");
      }

      if (!cancelled) {
        setChecking(false);
        await SplashScreen.hideAsync();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, ready, profile]);

  return (
    <View style={styles.fill}>
      {children}
      {checking ? <View style={styles.cover} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  cover: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.bg,
    pointerEvents: "auto",
  },
});
