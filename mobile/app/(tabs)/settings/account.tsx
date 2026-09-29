import { useProfile } from "@/components/profile";
import { colors, serif } from "@/components/theme";
import { Banner, Button, ErrorState, Field, Input, LoadingState, Screen } from "@/components/ui";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text } from "react-native";

export default function AccountScreen() {
  const { t } = useTranslation();
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
      setFormError(t("account.required"));
      return;
    }
    setSaving(true);
    try {
      await saveName(name);
      setSaved(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t("account.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  if (!ready) {
    return (
      <Screen title={t("account.title")} back>
        <LoadingState label={t("account.loading")} />
      </Screen>
    );
  }

  return (
    <Screen title={t("account.title")} back>
      <Text style={styles.headline}>{t("account.headline")}</Text>
      <Text style={styles.body}>{t("account.body")}</Text>
      {error && profile && !snapshot ? <ErrorState message={error} onRetry={() => refresh().catch(() => {})} /> : null}
      {saved ? <Banner tone="good" title={t("account.nameSaved")} body={t("account.nameSavedBody")} /> : null}
      <Field label={t("account.displayName")} error={formError}>
        <Input
          value={name}
          onChangeText={(value) => {
            setName(value);
            if (saved) setSaved(false);
          }}
          placeholder={t("account.placeholder")}
          maxLength={40}
          testID="settings-name"
        />
      </Field>
      <Button label={t("account.save")} onPress={save} loading={saving} testID="settings-save" />
      {snapshot ? (
        <Text style={styles.meta}>
          {t("account.meta", {
            points: snapshot.points,
            logs: snapshot.counts.logs,
            ideas: snapshot.counts.ideasShared,
          })}
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
