import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Banner, Button } from "@/components/ui";
import { useProfile } from "@/components/profile";
import { colors, serif } from "@/components/theme";
import { api } from "@/lib/api";
import { KIND_LABEL } from "@/lib/format";
import type { Idea, LogMethod, UnlockedBadge } from "@/lib/types";
import { router, type Href } from "expo-router";

export function LogAction({
  itemId,
  ideas,
  logMethods,
}: {
  itemId: string;
  ideas: Idea[];
  logMethods: LogMethod[];
}) {
  const { profile, refresh } = useProfile();
  const [mode, setMode] = useState<"reuse" | "dispose" | null>(null);
  const [ideaId, setIdeaId] = useState(ideas[0]?.id ?? "");
  const [method, setMethod] = useState(logMethods.find((entry) => entry.recommended)?.method ?? logMethods[0]?.method ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ points: number; badges: UnlockedBadge[] } | null>(null);

  function open(next: "reuse" | "dispose") {
    setError("");
    setSuccess(null);
    setMode(next);
  }

  async function confirm() {
    setError("");
    if (!profile) {
      setError("Pick a display name first.");
      return;
    }
    setSaving(true);
    try {
      const result =
        mode === "reuse"
          ? await api.log({ profileId: profile.id, itemId, action: "reuse", ideaId })
          : await api.log({ profileId: profile.id, itemId, action: "dispose", method });
      await refresh();
      setSuccess({ points: result.pointsAwarded, badges: result.badgesUnlocked });
      setMode(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.dock}>
      {success ? (
        <Banner
          tone="good"
          title={`Logged. +${success.points} points.`}
          body={
            success.badges.length
              ? `Unlocked ${success.badges.map((badge) => badge.title).join(", ")}.`
              : "It’s on your personal log."
          }
        />
      ) : null}
      {error ? <Banner tone="bad" title="Could not save that" body={error} /> : null}

      {mode === null ? (
        <View style={styles.actions}>
          <Button
            label="I reused this"
            onPress={() => open("reuse")}
            disabled={ideas.length === 0}
            testID="reuse-button"
          />
          <Button
            label="I disposed of this"
            tone="secondary"
            onPress={() => open("dispose")}
            disabled={logMethods.length === 0}
            testID="dispose-button"
          />
          {ideas.length === 0 ? (
            <Text style={styles.hint}>No reuse ideas yet. Submit one and it will show up here.</Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>{mode === "reuse" ? "Which idea did you use?" : "How did you get rid of it?"}</Text>
          {mode === "reuse"
            ? ideas.map((idea) => (
                <Choice
                  key={idea.id}
                  selected={idea.id === ideaId}
                  title={idea.title}
                  meta={`${KIND_LABEL[idea.kind]} · 10 points`}
                  onPress={() => setIdeaId(idea.id)}
                />
              ))
            : logMethods.map((entry) => (
                <Choice
                  key={entry.method}
                  selected={entry.method === method}
                  title={entry.label}
                  meta={`${entry.points} points${entry.recommended ? " · suggested" : ""}`}
                  onPress={() => setMethod(entry.method)}
                />
              ))}
          {!profile ? (
            <Button
              label="Pick a display name first"
              onPress={() => router.push("/display-name" as Href)}
              testID="log-pick-name"
            />
          ) : null}
          {mode === "dispose" && method === "trash" ? (
            <Text style={styles.hint}>
              Bag it with household trash. Keep it out of recycling if it is dirty or not accepted where you live.
            </Text>
          ) : null}
          <View style={styles.actions}>
            <Button
              label={mode === "reuse" ? "Log reuse · 10 pts" : `Log disposal · ${logMethods.find((entry) => entry.method === method)?.points ?? 0} pts`}
              onPress={confirm}
              loading={saving}
              disabled={(mode === "reuse" ? !ideaId : !method) || !profile}
              testID="confirm-log"
            />
            <Button label="Cancel" tone="quiet" onPress={() => setMode(null)} disabled={saving} />
          </View>
        </View>
      )}
    </View>
  );
}

function Choice({
  title,
  meta,
  selected,
  onPress,
}: {
  title: string;
  meta: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.choice, selected && styles.choiceOn]}>
      <View style={[styles.radio, selected && styles.radioOn]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.choiceTitle}>{title}</Text>
        <Text style={styles.hint}>{meta}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dock: {
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.bg,
  },
  actions: { gap: 8 },
  panel: { gap: 8 },
  panelTitle: { fontFamily: serif, fontSize: 20, color: colors.ink },
  hint: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  choice: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
  },
  choiceOn: { borderColor: colors.green, backgroundColor: colors.greenSoft },
  radio: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: colors.muted },
  radioOn: { borderColor: colors.green, backgroundColor: colors.green },
  choiceTitle: { fontWeight: "700", color: colors.ink, fontSize: 15 },
});
