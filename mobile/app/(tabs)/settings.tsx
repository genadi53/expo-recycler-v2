import { useProfile } from "@/components/profile";
import { colors, serif } from "@/components/theme";
import { Banner, Button, ErrorState, Field, Input, LoadingState, Screen } from "@/components/ui";
import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";

export default function SettingsScreen() {
  const { ready, profile, snapshot, error, refresh, saveName } = useProfile();
  const [name, setName] = useState("");
  const [seeded, setSeeded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile && !seeded) {
      setName(profile.displayName);
      setSeeded(true);
    }
  }, [profile, seeded]);

  async function save() {
    setFormError("");
    setSaved(false);
    if (!name.trim()) {
      setFormError("Display name is required.");
      return;
    }
    setSaving(true);
    try {
      await saveName(name);
      setSaved(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save that name.");
    } finally {
      setSaving(false);
    }
  }

  if (!ready) {
    return (
      <Screen title="Settings">
        <LoadingState label="Loading settings…" />
      </Screen>
    );
  }

  return (
    <Screen title="Settings">
      <Text style={styles.headline}>This phone</Text>
      <Text style={styles.body}>
        There is no account. The display name lives on this phone, shows on the leaderboard, and starts over on a new phone.
      </Text>
      {error && profile && !snapshot ? <ErrorState message={error} onRetry={() => refresh().catch(() => {})} /> : null}
      {saved ? <Banner tone="good" title="Name saved" body="The leaderboard will use this display name." /> : null}
      <Field label="Display name" error={formError}>
        <Input
          value={name}
          onChangeText={(value) => {
            setName(value);
            if (saved) setSaved(false);
          }}
          placeholder="What should we call you?"
          maxLength={40}
          testID="settings-name"
        />
      </Field>
      <Button label="Save name" onPress={save} loading={saving} testID="settings-save" />
      {snapshot ? (
        <Text style={styles.meta}>
          {snapshot.points} points · {snapshot.counts.logs} logged · {snapshot.counts.ideasShared} ideas shared
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headline: { fontFamily: serif, fontSize: 28, color: colors.ink },
  body: { color: colors.ink, fontSize: 15, lineHeight: 22 },
  meta: { color: colors.muted, fontSize: 14 },
});
