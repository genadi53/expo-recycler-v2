import { LogAction } from "@/components/log-action";
import { categoryAccent, colors, serif } from "@/components/theme";
import { ErrorState, LoadingState, Screen } from "@/components/ui";
import { absoluteApiUrl, api } from "@/lib/api";
import { kindLabel } from "@/lib/format";
import type { Idea } from "@/lib/types";
import { useQuery } from "@/lib/use-query";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { Image, StyleSheet, Text, View } from "react-native";

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
  return (
    <Screen
      title={data.item.categoryName}
      back
      footer={<LogAction itemId={data.item.id} ideas={data.ideas} logMethods={data.logMethods} />}
    >
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: accent }]}>{data.item.categoryName}</Text>
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
        data.ideas.map((idea) => <IdeaCard key={idea.id} idea={idea} />)
      )}

      <Text style={styles.section}>{t("item.disposeSection")}</Text>
      {data.disposal ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{data.disposal.title}</Text>
          {data.disposal.source === "category" ? (
            <Text style={styles.meta}>
              {t("item.generalPath", { category: data.item.categoryName })}
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

function IdeaCard({ idea }: { idea: Idea }) {
  const { t } = useTranslation();
  const materials = idea.materials.split("\n").map((line) => line.trim()).filter(Boolean);
  const imageUri = absoluteApiUrl(idea.imageUrl);
  return (
    <View style={styles.card}>
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.ideaImage}
          accessibilityLabel={t("item.picture", { name: idea.title })}
        />
      ) : null}
      <Text style={styles.kind}>{kindLabel(idea.kind)}</Text>
      <Text style={styles.cardTitle}>{idea.title}</Text>
      {idea.authorName ? <Text style={styles.meta}>{t("item.sharedBy", { name: idea.authorName })}</Text> : null}
      <Text style={styles.meta}>{t("item.youllNeed")}</Text>
      {materials.length > 1 ? (
        materials.map((line) => (
          <Text key={line} style={styles.body}>
            · {line}
          </Text>
        ))
      ) : (
        <Text style={styles.body}>{idea.materials}</Text>
      )}
      {idea.steps.map((step, index) => (
        <Text key={step} style={styles.step}>
          {index + 1}. {step}
        </Text>
      ))}
    </View>
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
  ideaImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 4,
    backgroundColor: colors.line,
  },
  kind: { color: colors.green, fontSize: 12, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase" },
  cardTitle: { fontSize: 18, fontWeight: "700", color: colors.ink },
  meta: { color: colors.muted, fontSize: 13, fontWeight: "700" },
  body: { color: colors.ink, fontSize: 15, lineHeight: 21 },
  step: { color: colors.ink, fontSize: 15, lineHeight: 21 },
  disclaimer: { color: colors.muted, fontSize: 13, lineHeight: 18 },
});
