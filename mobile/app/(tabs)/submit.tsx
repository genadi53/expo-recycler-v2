import { useProfile } from "@/components/profile";
import { colors, serif } from "@/components/theme";
import { Banner, Button, Chip, EmptyState, ErrorState, Field, Input, LoadingState, Screen } from "@/components/ui";
import { api } from "@/lib/api";
import { KIND_LABEL } from "@/lib/format";
import type { SubmissionResult } from "@/lib/types";
import { useQuery } from "@/lib/use-query";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

const KINDS = ["cook", "beauty", "art", "useful"] as const;

export default function SubmitScreen() {
  const params = useLocalSearchParams<{ item?: string; category?: string }>();
  const { ready, profile, saveName, refresh } = useProfile();
  const { status, data, error, retry } = useQuery("submit-categories", () => api.categories());
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [itemName, setItemName] = useState("");
  const [kind, setKind] = useState<(typeof KINDS)[number]>("cook");
  const [title, setTitle] = useState("");
  const [materials, setMaterials] = useState("");
  const [steps, setSteps] = useState("");
  const [disposalNote, setDisposalNote] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<SubmissionResult | null>(null);
  const [matchLabel, setMatchLabel] = useState("");

  useEffect(() => {
    if (ready && profile && !nameTouched) setName(profile.displayName);
  }, [ready, profile, nameTouched]);

  useEffect(() => {
    const item = typeof params.item === "string" ? params.item : "";
    if (item) setItemName(item);
  }, [params.item]);

  useEffect(() => {
    const category = typeof params.category === "string" ? params.category : "";
    if (category) setCategoryId(category);
  }, [params.category]);

  useEffect(() => {
    const trimmed = itemName.trim();
    if (!trimmed) {
      setMatchLabel("");
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      api
        .items({ q: trimmed })
        .then((result) => {
          if (cancelled) return;
          const found = result.items.find((item) => item.name.toLowerCase() === trimmed.toLowerCase());
          setMatchLabel(
            found
              ? `This adds an idea to ${found.name}. 15 points.`
              : "This creates a new item. 25 points.",
          );
        })
        .catch(() => {
          if (!cancelled) setMatchLabel("");
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [itemName]);

  async function publish() {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = "Display name is required.";
    if (!categoryId) nextErrors.category = "Pick a category.";
    if (!itemName.trim()) nextErrors.item = "Item name is required.";
    if (!title.trim()) nextErrors.title = "Title is required.";
    if (!materials.trim()) nextErrors.materials = "Materials are required.";
    if (!steps.trim()) nextErrors.steps = "Steps are required.";
    setFieldErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      const saved = await saveName(name);
      const result = await api.submit({
        profileId: saved.id,
        category: categoryId,
        itemName: itemName.trim(),
        ideaKind: kind,
        title: title.trim(),
        materials: materials.trim(),
        steps: steps.trim(),
        disposalNote: disposalNote.trim() || undefined,
      });
      await refresh();
      setSuccess(result);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not publish that.");
    } finally {
      setSaving(false);
    }
  }

  function another() {
    setSuccess(null);
    setTitle("");
    setMaterials("");
    setSteps("");
    setItemName("");
    setDisposalNote("");
    setMatchLabel("");
    setFieldErrors({});
    setFormError("");
  }

  if (status === "loading") {
    return (
      <Screen title="Submit">
        <LoadingState label="Loading categories…" />
      </Screen>
    );
  }
  if (status === "error") {
    return (
      <Screen title="Submit">
        <ErrorState message={error} onRetry={retry} />
      </Screen>
    );
  }
  if (!data || data.categories.length === 0) {
    return (
      <Screen title="Submit">
        <EmptyState
          title="Nowhere to file this"
          body="The catalog has no categories yet, so a new item has no shelf."
          icon="albums-outline"
        />
      </Screen>
    );
  }

  if (success) {
    return (
      <Screen title="Submit">
        <Text style={styles.headline}>It’s in the catalog</Text>
        <Text style={styles.body}>
          {success.item.name} now includes “{success.idea.title}”. You earned {success.pointsAwarded} points.
        </Text>
        {success.badgesUnlocked.length ? (
          <Banner
            tone="good"
            title="Badge unlocked"
            body={success.badgesUnlocked.map((badge) => badge.title).join(", ")}
          />
        ) : null}
        <Button label="See the item" onPress={() => router.push(`/item/${success.item.id}` as Href)} testID="see-item" />
        <Button label="Submit another" tone="secondary" onPress={another} />
      </Screen>
    );
  }

  return (
    <Screen title="Submit">
      <Text style={styles.headline}>Add an item or an idea</Text>
      <Text style={styles.body}>
        It publishes immediately. If that item name already exists, your idea is attached to it. Otherwise a new item is created.
      </Text>
      {formError ? <Banner tone="bad" title="Could not publish" body={formError} /> : null}

      <Field label="Display name" error={fieldErrors.name}>
        <Input
          value={name}
          onChangeText={(value) => {
            setNameTouched(true);
            setName(value);
          }}
          placeholder="What should we call you?"
          maxLength={40}
          testID="submit-name"
        />
      </Field>

      <Field label="Category" error={fieldErrors.category}>
        <View style={styles.chips}>
          {data.categories.map((category) => (
            <Chip
              key={category.id}
              label={category.name}
              selected={categoryId === category.id}
              onPress={() => setCategoryId(category.id)}
            />
          ))}
        </View>
      </Field>

      <Field label="Item" error={fieldErrors.item}>
        <Input
          value={itemName}
          onChangeText={setItemName}
          placeholder="Existing name, or a new one"
          maxLength={80}
          testID="submit-item"
        />
        {matchLabel ? <Text style={styles.hint}>{matchLabel}</Text> : null}
      </Field>

      <Field label="Idea kind">
        <View style={styles.chips}>
          {KINDS.map((entry) => (
            <Chip key={entry} label={KIND_LABEL[entry]} selected={kind === entry} onPress={() => setKind(entry)} />
          ))}
        </View>
        <Text style={styles.hint}>Food is often cook or beauty. Materials are often art or useful. Any kind is allowed.</Text>
      </Field>

      <Field label="Title" error={fieldErrors.title}>
        <Input value={title} onChangeText={setTitle} placeholder="What should this idea be called?" maxLength={120} testID="submit-title" />
      </Field>
      <Field label="Materials" error={fieldErrors.materials}>
        <Input
          value={materials}
          onChangeText={setMaterials}
          placeholder={"One ingredient or tool per line"}
          multiline
          testID="submit-materials"
        />
      </Field>
      <Field label="Steps" error={fieldErrors.steps}>
        <Input
          value={steps}
          onChangeText={setSteps}
          placeholder={"One step per line"}
          multiline
          testID="submit-steps"
        />
      </Field>
      <Field label="Disposal note">
        <Input
          value={disposalNote}
          onChangeText={setDisposalNote}
          placeholder="Optional. Used only if this item is new."
          multiline
          testID="submit-disposal"
        />
      </Field>
      <Button label="Publish" onPress={publish} loading={saving} testID="publish" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headline: { fontFamily: serif, fontSize: 28, color: colors.ink },
  body: { color: colors.ink, fontSize: 15, lineHeight: 21 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  hint: { color: colors.muted, fontSize: 13, lineHeight: 18 },
});
