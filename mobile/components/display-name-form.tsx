import { useEffect, useState } from "react";

import { useProfile } from "@/components/profile";
import { Button, EmptyState, Field, Input } from "@/components/ui";

export function DisplayNameForm({
  initialName = "",
  onSaved,
}: {
  initialName?: string;
  onSaved?: () => void;
}) {
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
      setFormError("Display name is required.");
      return;
    }
    setSaving(true);
    try {
      await saveName(name);
      onSaved?.();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save that name.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <EmptyState
        title="Pick a display name"
        body="The log, points, and badges stay with this name on this phone. There is no account. A new phone starts fresh."
        icon="person-outline"
      />
      <Field label="Display name" error={formError}>
        <Input
          value={name}
          onChangeText={setName}
          placeholder="What should we call you?"
          maxLength={40}
          testID="display-name-input"
        />
      </Field>
      <Button label="Save name" onPress={save} loading={saving} testID="save-name" />
    </>
  );
}
