import { IdeaImage } from "@/components/idea-image";
import { IdeaKindLabel } from "@/components/idea-kind-label";
import { LogAction } from "@/components/log-action";
import { categoryAccent, colors, serif } from "@/components/theme";
import { ErrorState, LoadingState, Screen } from "@/components/ui";
import { absoluteApiUrl, api } from "@/lib/api";
import { categoryLabel, kindLabel } from "@/lib/format";
import type { Idea } from "@/lib/types";
import { useQuery } from "@/lib/use-query";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { useTranslation } from "react-i18next";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";

const pointer = Platform.OS === "web" ? ({ cursor: "pointer" } as const) : null;

export default function ItemScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const { status, data, error, retry } = useQuery(`item:${id}`, () => api.item(id));

  if (status === "loading") {
    return (
      <Screen title={t("item.title")} back>
        <LoadingState label={t("item.loading")} />
      </Screen>
    );
  }
  if (status === "error" || !data) {
    return (
      <Screen title={t("item.title")} back>
        <ErrorState message={error || t("item.openFailed")} onRetry={retry} />
      </Screen>
    );
  }

  const accent = categoryAccent[data.item.categoryId] ?? colors.green;
  const itemImageUri = absoluteApiUrl(data.item.imageUrl);
  const categoryName = categoryLabel(data.item.categoryId, data.item.categoryName);
  return (
    <Screen
      title={categoryName}
      back
      footer={<LogAction itemId={data.item.id} ideas={data.ideas} logMethods={data.logMethods} />}
    >
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: accent }]}>{categoryName}</Text>
        <Text style={styles.name}>{data.item.name}</Text>
        {itemImageUri ? (
          <Image
            source={{ uri: itemImageUri }}
            style={styles.itemImage}
            accessibilityLabel={t("item.picture", { name: data.item.name })}
          />
        ) : null}
        <Text style={styles.summary}>{data.item.summary}</Text>
      </View>

      <Text style={styles.section}>{t("item.reuseIdeas")}</Text>
      {data.ideas.length === 0 ? (
        <Text style={styles.body}>{t("item.noIdeas")}</Text>
      ) : (
        data.ideas.map((idea) => <IdeaCard key={idea.id} idea={idea} itemName={data.item.name} />)
      )}

      <Text style={styles.section}>{t("item.disposeSection")}</Text>
      {data.disposal ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{data.disposal.title}</Text>
          {data.disposal.source === "category" ? (
            <Text style={styles.meta}>
              {t("item.generalPath", { category: categoryName })}
            </Text>
          ) : null}
          {data.disposal.steps.map((step, index) => (
            <Text key={step} style={styles.step}>
              {index + 1}. {step}
            </Text>
          ))}
        </View>
      ) : (
        <Text style={styles.body}>{t("item.noDisposal")}</Text>
      )}
      <Text style={styles.disclaimer}>{t("item.disclaimer")}</Text>
    </Screen>
  );
}

/** An Idea for this Item; opens Idea detail, where the checklist and steps live. */
function IdeaCard({ idea, itemName }: { idea: Idea; itemName: string }) {
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("home.ideaA11y", { title: idea.title, kind: kindLabel(idea.kind), item: itemName })}
      onPress={() => router.push(`/idea/${encodeURIComponent(idea.id)}` as Href)}
      style={({ pressed }) => [styles.ideaCard, pressed && styles.pressed, pointer]}
      testID={`item-idea-${idea.id}`}
    >
      <IdeaImage kind={idea.kind} imageUrl={idea.imageUrl} style={styles.ideaImage} iconSize={36} />
      <View style={styles.ideaBody}>
        <IdeaKindLabel kind={idea.kind} style={styles.kind} />
        <Text style={styles.ideaTitle} numberOfLines={2}>
          {idea.title}
        </Text>
        {idea.authorName ? (
          <Text style={styles.meta} numberOfLines={1}>
            {t("item.sharedBy", { name: idea.authorName })}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { gap: 6 },
  kicker: { fontSize: 12, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase" },
  name: { fontFamily: serif, fontSize: 34, color: colors.ink },
  itemImage: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    backgroundColor: colors.line,
    marginTop: 4,
  },
  summary: { fontSize: 16, lineHeight: 22, color: colors.ink },
  section: { fontFamily: serif, fontSize: 26, color: colors.ink, marginTop: 8 },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 14,
    gap: 6,
    overflow: "hidden",
  },
  ideaCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    padding: 10,
  },
  ideaImage: { width: 76, height: 76, borderRadius: 14 },
  ideaBody: { flex: 1, gap: 4 },
  ideaTitle: { fontFamily: serif, fontSize: 18, lineHeight: 22, color: colors.ink },
  pressed: { opacity: 0.82 },
  kind: { color: colors.green, fontSize: 12, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase" },
  cardTitle: { fontSize: 18, fontWeight: "700", color: colors.ink },
  meta: { color: colors.muted, fontSize: 13, fontWeight: "700" },
  body: { color: colors.ink, fontSize: 15, lineHeight: 21 },
  step: { color: colors.ink, fontSize: 15, lineHeight: 21 },
  disclaimer: { color: colors.muted, fontSize: 13, lineHeight: 18 },
});
