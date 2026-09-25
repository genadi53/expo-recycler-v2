import { useProfile } from "@/components/profile";
import { colors, serif } from "@/components/theme";
import { LoadingState, Screen } from "@/components/ui";
import { formatMemberSince } from "@/lib/format";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { router, type Href } from "expo-router";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

const pointer = Platform.OS === "web" ? ({ cursor: "pointer" } as const) : null;
const version = Constants.expoConfig?.version ?? "1.0.0";

type SettingsRow = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: Href;
  testID: string;
};

type SettingsSection = {
  title: string;
  rows: SettingsRow[];
};

const SECTIONS: SettingsSection[] = [
  {
    title: "General",
    rows: [
      { label: "Account", icon: "person-outline", href: "/settings/account", testID: "settings-row-account" },
      { label: "Language", icon: "globe-outline", href: "/settings/language", testID: "settings-row-language" },
    ],
  },
  {
    title: "Feature Settings",
    rows: [
      { label: "Dashboard", icon: "grid-outline", href: "/settings/dashboard", testID: "settings-row-dashboard" },
      { label: "Favorites", icon: "heart-outline", href: "/settings/favorites", testID: "settings-row-favorites" },
    ],
  },
  {
    title: "Appearance",
    rows: [{ label: "Theme", icon: "contrast-outline", href: "/settings/theme", testID: "settings-row-theme" }],
  },
  {
    title: "Data management",
    rows: [
      { label: "Sync & storage", icon: "sync-outline", href: "/settings/sync-storage", testID: "settings-row-sync" },
      { label: "Clear log", icon: "trash-outline", href: "/settings/clear-log", testID: "settings-row-clear-log" },
    ],
  },
  {
    title: "Community & support",
    rows: [
      { label: "Help", icon: "help-circle-outline", href: "/settings/help", testID: "settings-row-help" },
      { label: "Feedback", icon: "chatbubble-outline", href: "/settings/feedback", testID: "settings-row-feedback" },
    ],
  },
  {
    title: "Other",
    rows: [
      { label: "About", icon: "information-circle-outline", href: "/settings/about", testID: "settings-row-about" },
      { label: "Licenses", icon: "document-text-outline", href: "/settings/licenses", testID: "settings-row-licenses" },
    ],
  },
];

export default function SettingsScreen() {
  const { ready, profile } = useProfile();
  const displayName = profile?.displayName?.trim() || "Guest";
  const initial = displayName.charAt(0).toUpperCase();
  const subtitle = profile
    ? `Member since ${formatMemberSince(profile.createdAt)}`
    : "Set a display name in Account";

  if (!ready) {
    return (
      <Screen>
        <LoadingState label="Loading settings…" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.mark}>Settings</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open Account"
        onPress={() => router.push("/settings/account" as Href)}
        style={({ pressed }) => [styles.profile, pressed && styles.pressed, pointer]}
        testID="settings-profile"
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{initial}</Text>
        </View>
        <View style={styles.profileCopy}>
          <Text style={styles.profileName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.profileMeta} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </Pressable>

      {SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.group}>
            {section.rows.map((row, index) => (
              <View key={row.label}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={row.label}
                  onPress={() => router.push(row.href)}
                  style={({ pressed }) => [styles.row, pressed && styles.pressed, pointer]}
                  testID={row.testID}
                >
                  <Ionicons name={row.icon} size={22} color={colors.ink} />
                  <Text style={styles.rowLabel}>{row.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      ))}

      <Text style={styles.version}>Recycler v{version}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mark: { fontFamily: serif, fontSize: 40, color: colors.ink },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 4,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { color: "#fffdf8", fontSize: 22, fontWeight: "800" },
  profileCopy: { flex: 1, gap: 2 },
  profileName: { fontSize: 22, fontWeight: "700", color: colors.ink },
  profileMeta: { color: colors.muted, fontSize: 14 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.ink },
  group: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowLabel: { flex: 1, fontSize: 16, fontWeight: "600", color: colors.ink },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginLeft: 48 },
  pressed: { opacity: 0.82 },
  version: { color: colors.muted, fontSize: 13, textAlign: "center", marginTop: 8 },
});
