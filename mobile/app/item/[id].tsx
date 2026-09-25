import { LogAction } from "@/components/log-action";
import { categoryAccent, colors, serif } from "@/components/theme";
import { ErrorState, LoadingState, Screen } from "@/components/ui";
import { api } from "@/lib/api";
import { KIND_LABEL } from "@/lib/format";
import type { Idea } from "@/lib/types";
import { useQuery } from "@/lib/use-query";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function ItemScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const { status, data, error, retry } = useQuery(`item:${id}`, () => api.item(id));

  if (status === "loading") {
    return (
      <Screen title="Item" back>
        <LoadingState label="Opening this item…" />
      </Screen>
    );
  }
  if (status === "error" || !data) {
    return (
      <Screen title="Item" back>
        <ErrorState message={error || "Could not open this item."} onRetry={retry} />
      </Screen>
    );
  }

  const accent = categoryAccent[data.item.categoryId] ?? colors.green;
  return (
    <Screen
      title={data.item.categoryName}
      back
      footer={<LogAction itemId={data.item.id} ideas={data.ideas} logMethods={data.logMethods} />}
    >
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: accent }]}>{data.item.categoryName}</Text>
        <Text style={styles.name}>{data.item.name}</Text>
        <Text style={styles.summary}>{data.item.summary}</Text>
      </View>

      <Text style={styles.section}>Reuse ideas</Text>
      {data.ideas.length === 0 ? (
        <Text style={styles.body}>No reuse ideas yet. Use Submit to add one. It publishes right away.</Text>
      ) : (
        data.ideas.map((idea) => <IdeaCard key={idea.id} idea={idea} />)
      )}

      <Text style={styles.section}>Rather just get rid of it</Text>
      {data.disposal ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{data.disposal.title}</Text>
          {data.disposal.source === "category" ? (
            <Text style={styles.meta}>General path for {data.item.categoryName}, because this item has no disposal of its own.</Text>
          ) : null}
          {data.disposal.steps.map((step, index) => (
            <Text key={step} style={styles.step}>
              {index + 1}. {step}
            </Text>
          ))}
        </View>
      ) : (
        <Text style={styles.body}>No disposal guidance for this item yet.</Text>
      )}
      <Text style={styles.disclaimer}>
        This is general guidance, not a map of local facilities. Rules differ by city, and Recycler does not ask where you live.
      </Text>
    </Screen>
  );
}

function IdeaCard({ idea }: { idea: Idea }) {
  const materials = idea.materials.split("\n").map((line) => line.trim()).filter(Boolean);
  return (
    <View style={styles.card}>
      <Text style={styles.kind}>{KIND_LABEL[idea.kind]}</Text>
      <Text style={styles.cardTitle}>{idea.title}</Text>
      {idea.authorName ? <Text style={styles.meta}>Shared by {idea.authorName}</Text> : null}
      <Text style={styles.meta}>You’ll need</Text>
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
  summary: { fontSize: 16, lineHeight: 22, color: colors.ink },
  section: { fontFamily: serif, fontSize: 26, color: colors.ink, marginTop: 8 },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  kind: { color: colors.green, fontSize: 12, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase" },
  cardTitle: { fontSize: 18, fontWeight: "700", color: colors.ink },
  meta: { color: colors.muted, fontSize: 13, fontWeight: "700" },
  body: { color: colors.ink, fontSize: 15, lineHeight: 21 },
  step: { color: colors.ink, fontSize: 15, lineHeight: 21 },
  disclaimer: { color: colors.muted, fontSize: 13, lineHeight: 18 },
});
