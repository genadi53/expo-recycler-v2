import { colors, serif } from "@/components/theme";
import { LoadingState, Screen } from "@/components/ui";
import { LOCALE_OPTIONS, type AppLocale } from "@/i18n/locales";
import { useLocale } from "@/i18n/LocaleProvider";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

const pointer = Platform.OS === "web" ? ({ cursor: "pointer" } as const) : null;

export default function LanguageScreen() {
  const { t } = useTranslation();
  const { ready, locale, setLocale } = useLocale();

  if (!ready) {
    return (
      <Screen title={t("language.title")} back>
        <LoadingState label={t("settings.loading")} />
      </Screen>
    );
  }

  return (
    <Screen title={t("language.title")} back>
      <Text style={styles.headline}>{t("language.title")}</Text>
      <Text style={styles.hint}>{t("language.hint")}</Text>
      <View style={styles.group}>
        {LOCALE_OPTIONS.map((option, index) => {
          const selected = option.id === locale;
          return (
            <View key={option.id}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={option.nativeLabel}
                onPress={() => {
                  void setLocale(option.id as AppLocale);
                }}
                style={({ pressed }) => [styles.row, pressed && styles.pressed, pointer]}
                testID={`language-${option.id}`}
              >
                <Text style={[styles.rowLabel, selected && styles.rowLabelOn]}>{option.nativeLabel}</Text>
                {selected ? <Ionicons name="checkmark" size={22} color={colors.green} /> : null}
              </Pressable>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headline: { fontFamily: serif, fontSize: 28, color: colors.ink },
  hint: { color: colors.muted, fontSize: 15, lineHeight: 22 },
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
  rowLabelOn: { color: colors.greenDark, fontWeight: "700" },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginLeft: 14 },
  pressed: { opacity: 0.82 },
});
