import { FreshIdeas } from "@/components/fresh-ideas";
import { HomeActionCard } from "@/components/home-action-card";
import { HomeHero } from "@/components/home-hero";
import { colors, serif } from "@/components/theme";
import { Screen } from "@/components/ui";
import { router, type Href } from "expo-router";
import { useTranslation } from "react-i18next";
import { Image, StyleSheet, Text, View } from "react-native";

/** Home: the same discovery-first screen for everyone, with or without a profile. */
export default function HomeScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <HomeHeader />
      <HomeHero />
      <View style={styles.actions}>
        <HomeActionCard
          title={t("home.rescueTitle")}
          body={t("home.rescueBody")}
          icon="leaf-outline"
          onPress={() => router.push("/browse" as Href)}
          testID="cta-browse"
        />
        <HomeActionCard
          title={t("home.recipesTitle")}
          body={t("home.recipesBody")}
          icon="bulb-outline"
          onPress={() => router.push("/recipes" as Href)}
          testID="cta-recipes"
        />
      </View>
      <FreshIdeas />
    </Screen>
  );
}

function HomeHeader() {
  const { t } = useTranslation();
  return (
    <View style={styles.header} testID="dashboard-header">
      <Image
        source={require("../../assets/images/icon.png")}
        style={styles.logo}
        accessibilityLabel={t("home.logo")}
      />
      <Text style={styles.mark}>{t("common.appName")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  mark: {
    fontFamily: serif,
    fontSize: 32,
    color: colors.ink,
  },
  actions: { gap: 10, marginHorizontal: -6 },
});
