import { colors, serif } from "@/components/theme";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

const pointer = Platform.OS === "web" ? ({ cursor: "pointer" } as const) : null;

/** Bold block hero: dark green card with the headline, tagline and the item search. */
export function HomeHero() {
  const { t } = useTranslation();
  return (
    <View style={styles.card} testID="home-hero">
      <Rings />
      <Text style={styles.headline} accessibilityRole="header">
        <Trans i18nKey="home.headline" components={{ em: <Text style={styles.headlineEm} /> }} />
      </Text>
      <Text style={styles.tagline}>{t("home.tagline")}</Text>
      <HomeSearch />
    </View>
  );
}

/** Decorative concentric rings in the top-right corner of the hero. */
function Rings() {
  return (
    <View style={styles.rings} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {[100, 160, 220].map((size) => (
        <View
          key={size}
          style={[styles.ring, { width: size, height: size, borderRadius: size / 2, top: (260 - size) / 2, left: (260 - size) / 2 }]}
        />
      ))}
    </View>
  );
}

/** Item search: a non-empty, trimmed query opens the results screen; an empty one does nothing. */
export function HomeSearch() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  function submit() {
    const q = query.trim();
    if (!q) return;
    router.push(`/results?q=${encodeURIComponent(q)}` as Href);
  }

  return (
    <View style={styles.search}>
      <Ionicons name="search" size={20} color={colors.green} />
      <TextInput
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={submit}
        placeholder={t("home.searchPlaceholder")}
        placeholderTextColor={colors.muted}
        accessibilityLabel={t("home.searchLabel")}
        returnKeyType="search"
        enterKeyHint="search"
        autoCorrect={false}
        autoCapitalize="none"
        style={styles.input}
        testID="home-search-input"
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("home.searchSubmit")}
        onPress={submit}
        style={({ pressed }) => [styles.go, pressed && styles.goPressed, pointer]}
        testID="home-search-submit"
      >
        <Ionicons name="arrow-forward" size={20} color={colors.card} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "relative",
    overflow: "hidden",
    marginHorizontal: -6,
    paddingTop: 28,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderRadius: 28,
    backgroundColor: colors.greenDark,
  },
  rings: { position: "absolute", right: -70, top: -80, width: 260, height: 260 },
  ring: { position: "absolute", borderWidth: 1.5, borderColor: colors.green },
  headline: {
    fontFamily: serif,
    fontSize: 33,
    lineHeight: 37,
    letterSpacing: -0.5,
    color: colors.card,
  },
  headlineEm: { fontStyle: "italic", color: colors.greenSoft },
  tagline: { marginTop: 12, marginBottom: 24, fontSize: 16, lineHeight: 22, color: colors.greenSoft },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 56,
    paddingLeft: 16,
    paddingRight: 6,
    borderRadius: 18,
    backgroundColor: colors.card,
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: "100%",
    paddingVertical: 0,
    fontSize: 16,
    color: colors.ink,
  },
  go: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.green,
  },
  goPressed: { backgroundColor: colors.greenDark },
});
