import { OnboardingGate } from "@/components/onboarding-gate";
import { ProfileProvider } from "@/components/profile";
import { colors } from "@/components/theme";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ProfileProvider>
        <OnboardingGate>
          <StatusBar style="dark" />
          <View style={styles.stage}>
            <View style={styles.phone}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.bg },
                }}
              >
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="onboarding"
                  options={{ gestureEnabled: false, animation: "fade" }}
                />
                <Stack.Screen
                  name="display-name"
                  options={{ gestureEnabled: false, animation: "fade" }}
                />
                <Stack.Screen name="results" />
                <Stack.Screen name="category/[id]" />
                <Stack.Screen name="item/[id]" />
                <Stack.Screen name="badges" />
              </Stack>
            </View>
          </View>
        </OnboardingGate>
      </ProfileProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    backgroundColor: Platform.OS === "web" ? colors.stage : colors.bg,
    alignItems: "center",
  },
  phone: {
    flex: 1,
    width: "100%",
    maxWidth: 440,
    backgroundColor: colors.bg,
    borderLeftWidth: Platform.OS === "web" ? 1 : 0,
    borderRightWidth: Platform.OS === "web" ? 1 : 0,
    borderColor: "#ddd4c6",
    overflow: "hidden",
  },
});
