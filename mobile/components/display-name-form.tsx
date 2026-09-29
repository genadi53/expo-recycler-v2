import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useProfile } from "@/components/profile";
import { Button, EmptyState, Field, Input } from "@/components/ui";

export function DisplayNameForm({
  initialName = "",
  onSaved,
}: {
  initialName?: string;
  onSaved?: () => void;
}) {
  const { t } = useTranslation();
  const { saveName } = useProfile();
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (initialName) setName(initialName);
  }, [initialName]);

  async function save() {
    setFormError("");
    if (!name.trim()) {
      setFormError(t("displayName.required"));
      return;
    }
    setSaving(true);
    try {
      await saveName(name);
      onSaved?.();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t("displayName.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <EmptyState title={t("displayName.title")} body={t("displayName.body")} icon="person-outline" />
      <Field label={t("displayName.label")} error={formError}>
        <Input
          value={name}
          onChangeText={setName}
          placeholder={t("displayName.placeholder")}
          maxLength={40}
          testID="display-name-input"
        />
      </Field>
      <Button label={t("displayName.save")} onPress={save} loading={saving} testID="save-name" />
    </>
  );
}
