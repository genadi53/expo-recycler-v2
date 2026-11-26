import { LogAction } from "@/components/log-action";
import { colors, serif } from "@/components/theme";
import { EmptyState, ErrorState, LoadingState, Screen } from "@/components/ui";
import { api } from "@/lib/api";
import { ingredientsInStep } from "@/lib/idea-detail";
import type { IdeaDetail } from "@/lib/types";
import { useQuery } from "@/lib/use-query";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const pointer = Platform.OS === "web" ? ({ cursor: "pointer" } as const) : null;

/** Start making: an Idea's steps one at a time; the last step's "I made it" logs a reuse of the Idea. */
export default function StartMakingScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const { status, data, error, retry } = useQuery(`idea:${id}`, () => api.idea(id));

  if (status === "loading") {
    return (
      <Screen title={t("idea.title")} back>
        <LoadingState label={t("idea.loading")} />
      </Screen>
    );
  }
  if (status === "error" || !data) {
    return (
      <Screen title={t("idea.title")} back>
        <ErrorState message={error || t("idea.openFailed")} onRetry={retry} />
      </Screen>
    );
  }
  if (data.idea.steps.length === 0) {
    return (
      <Screen title={data.idea.title} back>
        <EmptyState title={data.idea.title} body={t("make.noSteps")} />
      </Screen>
    );
  }
  return <Steps idea={data.idea} />;
}

function close(ideaId: string) {
  if (router.canGoBack()) router.back();
  else router.replace(`/idea/${encodeURIComponent(ideaId)}` as Href);
}

function Steps({ idea }: { idea: IdeaDetail }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const [logging, setLogging] = useState(false);
  const total = idea.steps.length;
  const last = index === total - 1;
  const step = idea.steps[index];
  const next = last ? null : idea.steps[index + 1];
  const mentioned = ingredientsInStep(step, idea.ingredients);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.top}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("common.close")}
          onPress={() => close(idea.id)}
          style={({ pressed }) => [styles.close, pressed && styles.pressed, pointer]}
          hitSlop={8}
          testID="make-close"
        >
          <Ionicons name="close" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.stepOf} accessibilityRole="header" accessibilityLiveRegion="polite">
          {t("make.stepOf", { current: index + 1, total })}
        </Text>
        <View style={styles.close} />
      </View>
      <View style={styles.segments} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {idea.steps.map((_, segment) => (
          <View key={segment} style={[styles.segment, segment <= index && styles.segmentOn]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.main} testID="make-step">
          <View style={styles.ring} />
          <Text style={styles.number}>{index + 1}</Text>
          <Text style={styles.stepText}>{step}</Text>
          {mentioned.length > 0 ? (
            <View style={styles.chips}>
              {mentioned.map((ingredient) => (
                <View key={ingredient.id} style={styles.chip}>
                  <Text style={styles.chipText}>{ingredient.name}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
        {next ? (
          <View style={styles.next} testID="make-next-preview">
            <Text style={styles.nextText} numberOfLines={2}>
              <Text style={styles.nextLabel}>{t("make.nextLabel")} </Text>
              {next}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
        {logging ? (
          <LogAction
            itemId={idea.itemId}
            ideas={[idea]}
            logMethods={[]}
            initialMode="reuse"
            reuseOnly
            onCancel={() => setLogging(false)}
          />
        ) : (
          <View style={styles.dock}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("make.back")}
              accessibilityState={{ disabled: index === 0 }}
              disabled={index === 0}
              onPress={() => setIndex((value) => Math.max(0, value - 1))}
              style={({ pressed }) => [
                styles.button,
                styles.backButton,
                index === 0 && styles.disabled,
                pressed && styles.pressed,
                pointer,
              ]}
              testID="make-back"
            >
              <Text style={styles.backText}>‹ {t("make.back")}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={last ? t("make.iMadeIt") : t("make.nextStep")}
              onPress={() => (last ? setLogging(true) : setIndex((value) => Math.min(total - 1, value + 1)))}
              style={({ pressed }) => [styles.button, styles.nextButton, pressed && styles.pressed, pointer]}
              testID={last ? "make-done" : "make-next"}
            >
              <Text style={styles.nextButtonText}>{last ? t("make.iMadeIt") : `${t("make.nextStep")} →`}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, minHeight: 56 },
  close: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  stepOf: { flex: 1, textAlign: "center", fontSize: 15, fontWeight: "700", color: colors.ink },
  segments: { flexDirection: "row", gap: 6, paddingHorizontal: 20, paddingBottom: 8 },
  segment: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.line },
  segmentOn: { backgroundColor: colors.green },
  content: { padding: 20, gap: 14 },
  main: {
    overflow: "hidden",
    borderRadius: 28,
    backgroundColor: colors.greenDark,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 26,
    gap: 12,
    minHeight: 260,
  },
  ring: {
    position: "absolute",
    right: -60,
    top: -60,
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 26,
    borderColor: colors.green,
  },
  number: { fontFamily: serif, fontSize: 64, lineHeight: 70, color: colors.greenSoft },
  stepText: { fontFamily: serif, fontSize: 24, lineHeight: 32, color: colors.card },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: { borderRadius: 999, backgroundColor: colors.green, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { color: colors.card, fontSize: 14, fontWeight: "700" },
  next: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    padding: 16,
    opacity: 0.7,
  },
  nextText: { fontSize: 15, lineHeight: 21, color: colors.muted },
  nextLabel: { fontWeight: "800", color: colors.ink },
  dock: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.bg,
  },
  button: { minHeight: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  backButton: { flex: 1, borderWidth: 1, borderColor: colors.green, backgroundColor: colors.card },
  backText: { color: colors.green, fontSize: 16, fontWeight: "700" },
  nextButton: { flex: 2, backgroundColor: colors.green },
  nextButtonText: { color: colors.card, fontSize: 16, fontWeight: "700" },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.82 },
});
