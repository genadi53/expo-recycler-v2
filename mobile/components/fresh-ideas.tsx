import { homeCardShadow } from "@/components/home-action-card";
import { IdeaImage } from "@/components/idea-image";
import { IdeaKindLabel } from "@/components/idea-kind-label";
import { colors, serif } from "@/components/theme";
import { api } from "@/lib/api";
import { kindLabel } from "@/lib/format";
import type { IdeaSummary } from "@/lib/types";
import { useQuery } from "@/lib/use-query";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const pointer = Platform.OS === "web" ? ({ cursor: "pointer" } as const) : null;

const CARD_WIDTH = 258;
const CARD_GAP = 14;
const IMAGE_HEIGHT = 206;
/** Image plus a two-line serif title and the item line; the loading placeholder keeps this height. */
const CARD_HEIGHT = IMAGE_HEIGHT + 104;
/** Matches the screen's horizontal padding so the rail bleeds to the edges. */
const GUTTER = 20;

/** "Fresh ideas": the newest ideas of every kind in a horizontal rail. Owns its data and its states. */
export function FreshIdeas({ limit = 6, testID = "fresh-ideas" }: { limit?: number; testID?: string }) {
  const { t } = useTranslation();
  const { status, data, error, retry } = useQuery(`fresh-ideas-${limit}`, () => api.ideas({ limit }));

  // No Ideas yet (e.g. right after the fresh start): the whole section hides itself.
  if (status === "ready" && data && data.ideas.length === 0) return null;

  return (
    <View style={styles.section} testID={testID}>
      <View style={styles.head}>
        <Text style={styles.heading} accessibilityRole="header">
          {t("home.freshIdeas")}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("home.seeAll")}
          onPress={() => router.push("/recipes" as Href)}
          style={({ pressed }) => [styles.seeAll, pressed && styles.pressed, pointer]}
          testID="fresh-ideas-see-all"
        >
          <Text style={styles.seeAllText}>{t("home.seeAll")}</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.green} />
        </Pressable>
      </View>

      {status === "loading" ? (
        <View style={styles.placeholder} accessibilityLabel={t("home.ideasLoading")} accessible>
          <ActivityIndicator color={colors.green} />
          <Text style={styles.stateText}>{t("home.ideasLoading")}</Text>
        </View>
      ) : null}

      {status === "error" ? (
        <View style={styles.error}>
          <Ionicons name="cloud-offline-outline" size={22} color={colors.danger} />
          <Text style={styles.errorText} numberOfLines={3}>
            {error || t("errors.somethingWrong")}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={retry}
            style={({ pressed }) => [styles.retry, pressed && styles.pressed, pointer]}
            testID="fresh-ideas-retry"
          >
            <Text style={styles.retryText}>{t("common.tryAgain")}</Text>
          </Pressable>
        </View>
      ) : null}

      {status === "ready" && data && data.ideas.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + CARD_GAP}
          snapToAlignment="start"
          decelerationRate="fast"
          style={styles.rail}
          contentContainerStyle={styles.railContent}
        >
          {data.ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

function IdeaCard({ idea }: { idea: IdeaSummary }) {
  const { t } = useTranslation();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("home.ideaA11y", { title: idea.title, kind: kindLabel(idea.kind), item: idea.itemName })}
      onPress={() => router.push(`/idea/${encodeURIComponent(idea.id)}` as Href)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed, pointer]}
      testID={`fresh-idea-${idea.id}`}
    >
      <IdeaImage kind={idea.kind} imageUrl={idea.imageUrl} style={styles.image} iconSize={56}>
        <View style={styles.pill}>
          <IdeaKindLabel kind={idea.kind} style={styles.pillText} iconSize={14} />
        </View>
      </IdeaImage>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {idea.title}
        </Text>
        <Text style={styles.item} numberOfLines={1}>
          {idea.itemName}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10, marginTop: 8 },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  heading: { flexShrink: 1, fontFamily: serif, fontSize: 24, color: colors.ink },
  seeAll: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 44, paddingHorizontal: 2 },
  seeAllText: { fontSize: 15, fontWeight: "700", color: colors.green },
  pressed: { opacity: 0.82 },
  rail: { marginHorizontal: -GUTTER },
  railContent: { paddingHorizontal: GUTTER, paddingTop: 4, paddingBottom: 16, gap: CARD_GAP },
  card: {
    width: CARD_WIDTH,
    borderRadius: 22,
    backgroundColor: colors.card,
    ...homeCardShadow,
  },
  image: {
    height: IMAGE_HEIGHT,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  pill: {
    position: "absolute",
    left: 12,
    top: 12,
    paddingVertical: 6,
    paddingLeft: 8,
    paddingRight: 10,
    borderRadius: 999,
    backgroundColor: colors.card,
  },
  pillText: { fontSize: 12, fontWeight: "700", color: colors.ink },
  body: { paddingTop: 14, paddingHorizontal: 16, paddingBottom: 18 },
  title: { fontFamily: serif, fontSize: 20, lineHeight: 23, color: colors.ink },
  item: { marginTop: 4, fontSize: 14, color: colors.muted },
  placeholder: {
    height: CARD_HEIGHT,
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  stateText: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: "center" },
  error: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.dangerSoft,
  },
  errorText: { flex: 1, color: colors.danger, fontSize: 14, lineHeight: 19 },
  retry: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
  },
  retryText: { color: colors.danger, fontWeight: "700", fontSize: 14 },
});
