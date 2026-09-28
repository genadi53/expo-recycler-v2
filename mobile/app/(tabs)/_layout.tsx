import { colors } from "@/components/theme";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

const TABS = {
  index: { label: "Dashboard", icon: "grid-outline" as const, iconOn: "grid" as const },
  log: { label: "Log", icon: "book-outline" as const, iconOn: "book" as const },
  leaderboard: { label: "Leaderboard", icon: "trophy-outline" as const, iconOn: "trophy" as const },
  settings: { label: "Settings", icon: "settings-outline" as const, iconOn: "settings" as const },
};

function RecyclerTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (event.defaultPrevented) return;
          if (focused && route.name === "settings") {
            navigation.navigate("settings", { screen: "index" });
            return;
          }
          if (!focused) {
            navigation.navigate(route.name);
          }
        };

        if (route.name === "submit") {
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityLabel="Submit"
              accessibilityState={{ selected: focused }}
              onPress={onPress}
              style={styles.slot}
              testID="tab-submit"
            >
              <View style={styles.circle}>
                <View style={styles.plusBar} />
                <View style={[styles.plusBar, styles.plusBarVertical]} />
              </View>
            </Pressable>
          );
        }

        const item = TABS[route.name as keyof typeof TABS];
        if (!item) return null;
        const color = focused ? colors.green : "#8d8d8d";

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: focused }}
            onPress={onPress}
            style={styles.slot}
            testID={`tab-${route.name === "index" ? "dashboard" : route.name}`}
          >
            <Ionicons name={focused ? item.iconOn : item.icon} size={26} color={color} />
            <Text style={[styles.label, { color }, focused && styles.labelOn]} numberOfLines={1}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <RecyclerTabBar {...props} />}
      screenOptions={{ headerShown: false, tabBarShowLabel: false }}
    >
      <Tabs.Screen name="index" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="log" options={{ title: "Log" }} />
      <Tabs.Screen name="submit" options={{ title: "Submit" }} />
      <Tabs.Screen name="leaderboard" options={{ title: "Leaderboard" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#ffffff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e4e4e4",
    paddingTop: 8,
    minHeight: 72,
  },
  slot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    minHeight: 56,
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.1,
  },
  labelOn: {
    fontWeight: "700",
  },
  circle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  plusBar: {
    position: "absolute",
    width: 16,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: "#ffffff",
  },
  plusBarVertical: {
    width: 2.5,
    height: 16,
  },
});
