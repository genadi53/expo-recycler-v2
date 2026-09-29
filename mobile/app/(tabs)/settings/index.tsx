import { useProfile } from "@/components/profile";
import { colors, serif } from "@/components/theme";
import { LoadingState, Screen } from "@/components/ui";
import { localeDisplayName } from "@/i18n/locales";
import { useLocale } from "@/i18n/LocaleProvider";
import { formatMemberSince } from "@/lib/format";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { router, type Href } from "expo-router";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

const pointer = Platform.OS === "web" ? ({ cursor: "pointer" } as const) : null;
const version = Constants.expoConfig?.version ?? "1.0.0";

type SettingsRow = {
  labelKey: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: Href;
  testID: string;
  detail?: string;
};

type SettingsSection = {
  titleKey: string;
  rows: SettingsRow[];
};

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { ready, profile } = useProfile();
  const { locale } = useLocale();
  const displayName = profile?.displayName?.trim() || t("common.guest");
  const initial = displayName.charAt(0).toUpperCase();
  const subtitle = profile
    ? t("settings.memberSince", { date: formatMemberSince(profile.createdAt) })
    : t("settings.setDisplayName");

  const sections: SettingsSection[] = [
    {
      titleKey: "settings.general",
      rows: [
        { labelKey: "settings.account", icon: "person-outline", href: "/settings/account", testID: "settings-row-account" },
        {
          labelKey: "settings.language",
          icon: "globe-outline",
          href: "/settings/language",
          testID: "settings-row-language",
          detail: localeDisplayName(locale),
        },
      ],
    },
    {
      titleKey: "settings.featureSettings",
      rows: [
        { labelKey: "settings.dashboard", icon: "grid-outline", href: "/settings/dashboard", testID: "settings-row-dashboard" },
        { labelKey: "settings.favorites", icon: "heart-outline", href: "/settings/favorites", testID: "settings-row-favorites" },
      ],
    },
    {
      titleKey: "settings.appearance",
      rows: [{ labelKey: "settings.theme", icon: "contrast-outline", href: "/settings/theme", testID: "settings-row-theme" }],
    },
    {
      titleKey: "settings.dataManagement",
      rows: [
        { labelKey: "settings.syncStorage", icon: "sync-outline", href: "/settings/sync-storage", testID: "settings-row-sync" },
        { labelKey: "settings.clearLog", icon: "trash-outline", href: "/settings/clear-log", testID: "settings-row-clear-log" },
      ],
    },
    {
      titleKey: "settings.communitySupport",
      rows: [
        { labelKey: "settings.help", icon: "help-circle-outline", href: "/settings/help", testID: "settings-row-help" },
        { labelKey: "settings.feedback", icon: "chatbubble-outline", href: "/settings/feedback", testID: "settings-row-feedback" },
      ],
    },
    {
      titleKey: "settings.other",
      rows: [
        { labelKey: "settings.about", icon: "information-circle-outline", href: "/settings/about", testID: "settings-row-about" },
        { labelKey: "settings.licenses", icon: "document-text-outline", href: "/settings/licenses", testID: "settings-row-licenses" },
      ],
    },
  ];

  if (!ready) {
    return (
      <Screen>
        <LoadingState label={t("settings.loading")} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.mark}>{t("settings.title")}</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("settings.openAccount")}
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

      {sections.map((section) => (
        <View key={section.titleKey} style={styles.section}>
          <Text style={styles.sectionTitle}>{t(section.titleKey)}</Text>
          <View style={styles.group}>
            {section.rows.map((row, index) => {
              const label = t(row.labelKey);
              return (
                <View key={row.labelKey}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={label}
                    onPress={() => router.push(row.href)}
                    style={({ pressed }) => [styles.row, pressed && styles.pressed, pointer]}
                    testID={row.testID}
                  >
                    <Ionicons name={row.icon} size={22} color={colors.ink} />
                    <View style={styles.rowCopy}>
                      <Text style={styles.rowLabel}>{label}</Text>
                      {row.detail ? <Text style={styles.rowDetail}>{row.detail}</Text> : null}
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>
      ))}

      <Text style={styles.version}>{t("settings.version", { version })}</Text>
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
  rowCopy: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 16, fontWeight: "600", color: colors.ink },
  rowDetail: { fontSize: 13, color: colors.muted },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginLeft: 48 },
  pressed: { opacity: 0.82 },
  version: { color: colors.muted, fontSize: 13, textAlign: "center", marginTop: 8 },
});
