import { useProfile } from "@/components/profile";
import { colors, serif } from "@/components/theme";
import { Banner, Button, Chip, EmptyState, ErrorState, Field, Input, LoadingState, Screen } from "@/components/ui";
import { api } from "@/lib/api";
import { KIND_LABEL } from "@/lib/format";
import type { IdeaImagePayload, SubmissionResult } from "@/lib/types";
import { useQuery } from "@/lib/use-query";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";

const KINDS = ["cook", "beauty", "art", "useful"] as const;
type IdeaKind = (typeof KINDS)[number];

const pointer = Platform.OS === "web" ? ({ cursor: "pointer" } as const) : null;

type PickedPicture = {
  uri: string;
  payload: IdeaImagePayload;
};

function parseKind(value: string | undefined): IdeaKind | null {
  if (!value) return null;
  return (KINDS as readonly string[]).includes(value) ? (value as IdeaKind) : null;
}

function mimeFromAsset(asset: ImagePicker.ImagePickerAsset): IdeaImagePayload["mime"] | null {
  const declared = asset.mimeType?.toLowerCase();
  if (declared === "image/jpeg" || declared === "image/png" || declared === "image/webp") return declared;
  const uri = asset.uri.toLowerCase();
  if (uri.endsWith(".jpg") || uri.endsWith(".jpeg")) return "image/jpeg";
  if (uri.endsWith(".png")) return "image/png";
  if (uri.endsWith(".webp")) return "image/webp";
  return null;
}

export default function SubmitScreen() {
  const params = useLocalSearchParams<{ item?: string; category?: string; kind?: string }>();
  const { profile, refresh } = useProfile();
  const { status, data, error, retry } = useQuery("submit-categories", () => api.categories());
  const [categoryId, setCategoryId] = useState("");
  const [itemName, setItemName] = useState("");
  const [kind, setKind] = useState<IdeaKind>("cook");
  const [title, setTitle] = useState("");
  const [materials, setMaterials] = useState("");
  const [steps, setSteps] = useState("");
  const [disposalNote, setDisposalNote] = useState("");
  const [picture, setPicture] = useState<PickedPicture | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<SubmissionResult | null>(null);
  const [matchLabel, setMatchLabel] = useState("");

  useEffect(() => {
    const item = typeof params.item === "string" ? params.item : "";
    if (item) setItemName(item);
  }, [params.item]);

  useEffect(() => {
    const category = typeof params.category === "string" ? params.category : "";
    if (category) setCategoryId(category);
  }, [params.category]);

  useEffect(() => {
    const next = parseKind(typeof params.kind === "string" ? params.kind : undefined);
    if (next) setKind(next);
  }, [params.kind]);

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

  async function pickPicture() {
    setFormError("");
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setFormError("Allow photo access to attach a picture, or publish without one.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const mime = mimeFromAsset(asset);
    if (!mime || !asset.base64) {
      setFormError("That picture could not be read. Try a JPEG, PNG, or WebP under 1.5 MB.");
      return;
    }
    setPicture({
      uri: asset.uri,
      payload: { mime, data: asset.base64 },
    });
  }

  async function publish() {
    const nextErrors: Record<string, string> = {};
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
      if (!profile) throw new Error("Pick a display name first.");
      const result = await api.submit({
        profileId: profile.id,
        category: categoryId,
        itemName: itemName.trim(),
        ideaKind: kind,
        title: title.trim(),
        materials: materials.trim(),
        steps: steps.trim(),
        disposalNote: disposalNote.trim() || undefined,
        image: picture?.payload,
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
    setPicture(null);
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

  if (!profile) {
    return (
      <Screen title="Submit">
        <EmptyState
          title="Pick a display name"
          body="Ideas you share are credited to the name stored on this phone."
          icon="person-outline"
          actionLabel="Choose a name"
          onAction={() => router.push("/display-name" as Href)}
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
        It publishes immediately as {profile.displayName}. If that item name already exists, your idea is attached to it.
        Otherwise a new item is created.
      </Text>
      {formError ? <Banner tone="bad" title="Could not publish" body={formError} /> : null}

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
      <Field label="Picture">
        {picture ? (
          <View style={styles.pictureBox}>
            <Image source={{ uri: picture.uri }} style={styles.picture} accessibilityLabel="Selected idea picture" />
            <View style={styles.pictureActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Change picture"
                onPress={pickPicture}
                style={({ pressed }) => [styles.pictureButton, pressed && styles.pressed, pointer]}
                testID="change-picture"
              >
                <Text style={styles.pictureButtonLabel}>Change</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Remove picture"
                onPress={() => setPicture(null)}
                style={({ pressed }) => [styles.pictureButton, pressed && styles.pressed, pointer]}
                testID="remove-picture"
              >
                <Text style={styles.pictureButtonLabel}>Remove</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add a picture"
            onPress={pickPicture}
            style={({ pressed }) => [styles.addPicture, pressed && styles.pressed, pointer]}
            testID="add-picture"
          >
            <Text style={styles.addPictureLabel}>Add a picture</Text>
            <Text style={styles.hint}>Optional. JPEG, PNG, or WebP under 1.5 MB.</Text>
          </Pressable>
        )}
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
  addPicture: {
    borderWidth: 1,
    borderColor: colors.line,
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 16,
    gap: 4,
    backgroundColor: colors.card,
  },
  addPictureLabel: { fontSize: 16, fontWeight: "700", color: colors.green },
  pictureBox: { gap: 10 },
  picture: {
    width: "100%",
    height: 180,
    borderRadius: 14,
    backgroundColor: colors.line,
  },
  pictureActions: { flexDirection: "row", gap: 10 },
  pictureButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  pictureButtonLabel: { fontSize: 14, fontWeight: "700", color: colors.ink },
  pressed: { opacity: 0.82 },
});
