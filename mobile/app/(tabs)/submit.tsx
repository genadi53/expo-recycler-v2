import { useProfile } from "@/components/profile";
import { colors, serif } from "@/components/theme";
import { Banner, Button, Chip, EmptyState, ErrorState, Field, Input, ItemRow, LoadingState, Screen } from "@/components/ui";
import { api } from "@/lib/api";
import { KIND_LABEL } from "@/lib/format";
import type { Category, IdeaImagePayload, ItemSummary, SubmissionResult } from "@/lib/types";
import { useQuery } from "@/lib/use-query";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";

const KINDS = ["cook", "beauty", "art", "useful"] as const;
type IdeaKind = (typeof KINDS)[number];
type SubmitMode = "idea" | "item";
type ItemAttachMode = "search" | "create";

const pointer = Platform.OS === "web" ? ({ cursor: "pointer" } as const) : null;

type PickedPicture = {
  uri: string;
  payload: IdeaImagePayload;
};

function parseKind(value: string | undefined): IdeaKind | null {
  if (!value) return null;
  return (KINDS as readonly string[]).includes(value) ? (value as IdeaKind) : null;
}

function parseMode(value: string | undefined): SubmitMode | null {
  if (value === "idea" || value === "item") return value;
  return null;
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
  const params = useLocalSearchParams<{ item?: string; category?: string; kind?: string; mode?: string }>();
  const mode = parseMode(typeof params.mode === "string" ? params.mode : undefined);
  const { profile, refresh } = useProfile();
  const { status, data, error, retry } = useQuery("submit-categories", () => api.categories());
  const [success, setSuccess] = useState<SubmissionResult | null>(null);
  const [formKey, setFormKey] = useState(0);

  const screenTitle = mode === "item" ? "Add item" : mode === "idea" ? "Add recipe" : "Submit";

  function another() {
    setSuccess(null);
    setFormKey((value) => value + 1);
  }

  if (status === "loading") {
    return (
      <Screen title={screenTitle}>
        <LoadingState label="Loading categories…" />
      </Screen>
    );
  }
  if (status === "error") {
    return (
      <Screen title={screenTitle}>
        <ErrorState message={error} onRetry={retry} />
      </Screen>
    );
  }
  if (!data || data.categories.length === 0) {
    return (
      <Screen title={screenTitle}>
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
      <Screen title={screenTitle}>
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
      <Screen title={screenTitle}>
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

  if (!mode) {
    return (
      <Screen title="Submit">
        <Text style={styles.headline}>What are you adding?</Text>
        <Text style={styles.body}>
          Pick a path. An item is a material in the catalog. A recipe is a reuse idea attached to an item.
        </Text>
        <Button
          label="Add item"
          onPress={() => router.replace("/submit?mode=item" as Href)}
          testID="choose-add-item"
        />
        <Button
          label="Add recipe"
          tone="secondary"
          onPress={() => router.replace("/submit?mode=idea" as Href)}
          testID="choose-add-recipe"
        />
      </Screen>
    );
  }

  const initialItem = typeof params.item === "string" ? params.item : "";
  const initialCategory = typeof params.category === "string" ? params.category : "";
  const initialKind = parseKind(typeof params.kind === "string" ? params.kind : undefined) ?? "cook";

  if (mode === "item") {
    return (
      <Screen title={screenTitle}>
        <AddItemForm
          key={`item-${formKey}`}
          categories={data.categories}
          profileId={profile.id}
          displayName={profile.displayName}
          initialItemName={initialItem}
          initialCategoryId={initialCategory}
          initialKind={initialKind}
          onPublished={async (result) => {
            await refresh();
            setSuccess(result);
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen title={screenTitle}>
      <RecipeForm
        key={`idea-${formKey}`}
        categories={data.categories}
        profileId={profile.id}
        displayName={profile.displayName}
        initialItemName={initialItem}
        initialCategoryId={initialCategory}
        initialKind={initialKind}
        onPublished={async (result) => {
          await refresh();
          setSuccess(result);
        }}
      />
    </Screen>
  );
}

async function pickPictureFromLibrary(): Promise<{ picture?: PickedPicture; error?: string }> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return { error: "Allow photo access to attach a picture, or publish without one." };
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.7,
    base64: true,
  });
  if (result.canceled || !result.assets[0]) return {};
  const asset = result.assets[0];
  const mime = mimeFromAsset(asset);
  if (!mime || !asset.base64) {
    return { error: "That picture could not be read. Try a JPEG, PNG, or WebP under 1.5 MB." };
  }
  return {
    picture: {
      uri: asset.uri,
      payload: { mime, data: asset.base64 },
    },
  };
}

function AddItemForm({
  categories,
  profileId,
  displayName,
  initialItemName,
  initialCategoryId,
  initialKind,
  onPublished,
}: {
  categories: Category[];
  profileId: string;
  displayName: string;
  initialItemName: string;
  initialCategoryId: string;
  initialKind: IdeaKind;
  onPublished: (result: SubmissionResult) => Promise<void>;
}) {
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [itemName, setItemName] = useState(initialItemName);
  const [kind, setKind] = useState<IdeaKind>(initialKind);
  const [title, setTitle] = useState("");
  const [materials, setMaterials] = useState("");
  const [steps, setSteps] = useState("");
  const [disposalNote, setDisposalNote] = useState("");
  const [ideaPicture, setIdeaPicture] = useState<PickedPicture | null>(null);
  const [itemPicture, setItemPicture] = useState<PickedPicture | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [matchHint, setMatchHint] = useState<{ name: string; text: string } | null>(null);
  const trimmedItemName = itemName.trim();
  const matchLabel = trimmedItemName && matchHint?.name === trimmedItemName ? matchHint.text : "";

  useEffect(() => {
    if (!trimmedItemName) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      api
        .items({ q: trimmedItemName })
        .then((result) => {
          if (cancelled) return;
          const found = result.items.find((item) => item.name.toLowerCase() === trimmedItemName.toLowerCase());
          setMatchHint({
            name: trimmedItemName,
            text: found
              ? `“${found.name}” already exists. Publishing will add an idea to it (15 points) and keep its current photo.`
              : "This creates a new item. 25 points.",
          });
        })
        .catch(() => {
          if (!cancelled) setMatchHint(null);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmedItemName]);

  async function pickPicture(target: "idea" | "item") {
    setFormError("");
    const result = await pickPictureFromLibrary();
    if (result.error) {
      setFormError(result.error);
      return;
    }
    if (!result.picture) return;
    if (target === "item") setItemPicture(result.picture);
    else setIdeaPicture(result.picture);
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
      const result = await api.submit({
        profileId,
        category: categoryId,
        itemName: itemName.trim(),
        ideaKind: kind,
        title: title.trim(),
        materials: materials.trim(),
        steps: steps.trim(),
        disposalNote: disposalNote.trim() || undefined,
        image: ideaPicture?.payload,
        itemImage: itemPicture?.payload,
      });
      await onPublished(result);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not publish that.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Text style={styles.headline}>Add a new item</Text>
      <Text style={styles.body}>
        It publishes immediately as {displayName}. Include a photo of the material. You still share one reuse idea with
        it.
      </Text>
      {formError ? <Banner tone="bad" title="Could not publish" body={formError} /> : null}

      <Field label="Category" error={fieldErrors.category}>
        <View style={styles.chips}>
          {categories.map((category) => (
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
          placeholder="Name for this material"
          maxLength={80}
          testID="submit-item"
        />
        {matchLabel ? <Text style={styles.hint}>{matchLabel}</Text> : null}
      </Field>

      <PictureField
        label="Item picture"
        picture={itemPicture}
        onPick={() => pickPicture("item")}
        onRemove={() => setItemPicture(null)}
        addTestID="add-item-picture"
        changeTestID="change-item-picture"
        removeTestID="remove-item-picture"
        accessibilityName="item"
      />

      <IdeaFields
        kind={kind}
        setKind={setKind}
        title={title}
        setTitle={setTitle}
        materials={materials}
        setMaterials={setMaterials}
        steps={steps}
        setSteps={setSteps}
        ideaPicture={ideaPicture}
        onPickIdeaPicture={() => pickPicture("idea")}
        onRemoveIdeaPicture={() => setIdeaPicture(null)}
        fieldErrors={fieldErrors}
      />

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
    </>
  );
}

function RecipeForm({
  categories,
  profileId,
  displayName,
  initialItemName,
  initialCategoryId,
  initialKind,
  onPublished,
}: {
  categories: Category[];
  profileId: string;
  displayName: string;
  initialItemName: string;
  initialCategoryId: string;
  initialKind: IdeaKind;
  onPublished: (result: SubmissionResult) => Promise<void>;
}) {
  const [itemMode, setItemMode] = useState<ItemAttachMode>(initialItemName || initialCategoryId ? "create" : "search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ItemSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selectedItem, setSelectedItem] = useState<ItemSummary | null>(null);

  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [itemName, setItemName] = useState(initialItemName);
  const [disposalNote, setDisposalNote] = useState("");
  const [itemPicture, setItemPicture] = useState<PickedPicture | null>(null);

  const [kind, setKind] = useState<IdeaKind>(initialKind);
  const [title, setTitle] = useState("");
  const [materials, setMaterials] = useState("");
  const [steps, setSteps] = useState("");
  const [ideaPicture, setIdeaPicture] = useState<PickedPicture | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [createHint, setCreateHint] = useState<{ name: string; text: string } | null>(null);

  const trimmedSearch = searchQuery.trim();
  const canSearch = itemMode === "search" && !selectedItem && trimmedSearch.length > 0;
  const visibleResults = canSearch ? searchResults : [];
  const showSearching = canSearch && searching;
  const showSearchError = canSearch ? searchError : "";
  const trimmedCreateName = itemName.trim();
  const createHintText =
    itemMode === "create" && trimmedCreateName && createHint?.name === trimmedCreateName ? createHint.text : "";

  useEffect(() => {
    if (!canSearch) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      setSearching(true);
      setSearchError("");
      api
        .items({ q: trimmedSearch })
        .then((result) => {
          if (cancelled) return;
          setSearchResults(result.items);
          setSearching(false);
        })
        .catch((err) => {
          if (cancelled) return;
          setSearchResults([]);
          setSearching(false);
          setSearchError(err instanceof Error ? err.message : "Could not search the catalog.");
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [canSearch, trimmedSearch]);

  useEffect(() => {
    if (itemMode !== "create" || !trimmedCreateName) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      api
        .items({ q: trimmedCreateName })
        .then((result) => {
          if (cancelled) return;
          const found = result.items.find((item) => item.name.toLowerCase() === trimmedCreateName.toLowerCase());
          setCreateHint({
            name: trimmedCreateName,
            text: found
              ? `“${found.name}” already exists. Publishing will add an idea to it (15 points) and keep its current photo.`
              : "This creates a new item. 25 points.",
          });
        })
        .catch(() => {
          if (!cancelled) setCreateHint(null);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [itemMode, trimmedCreateName]);

  function switchItemMode(next: ItemAttachMode) {
    setItemMode(next);
    setFieldErrors({});
    setFormError("");
    if (next === "search") {
      setCategoryId("");
      setItemName("");
      setDisposalNote("");
      setItemPicture(null);
      setCreateHint(null);
    } else {
      setSearchQuery("");
      setSearchResults([]);
      setSelectedItem(null);
      setSearchError("");
      setSearching(false);
    }
  }

  async function pickPicture(target: "idea" | "item") {
    setFormError("");
    const result = await pickPictureFromLibrary();
    if (result.error) {
      setFormError(result.error);
      return;
    }
    if (!result.picture) return;
    if (target === "item") setItemPicture(result.picture);
    else setIdeaPicture(result.picture);
  }

  async function publish() {
    const nextErrors: Record<string, string> = {};
    if (itemMode === "search") {
      if (!selectedItem) nextErrors.item = "Search and pick an existing item, or create one.";
    } else {
      if (!categoryId) nextErrors.category = "Pick a category.";
      if (!itemName.trim()) nextErrors.item = "Item name is required.";
    }
    if (!title.trim()) nextErrors.title = "Title is required.";
    if (!materials.trim()) nextErrors.materials = "Materials are required.";
    if (!steps.trim()) nextErrors.steps = "Steps are required.";
    setFieldErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      const result = await api.submit({
        profileId,
        category: itemMode === "search" ? selectedItem!.categoryId : categoryId,
        itemName: itemMode === "search" ? selectedItem!.name : itemName.trim(),
        ideaKind: kind,
        title: title.trim(),
        materials: materials.trim(),
        steps: steps.trim(),
        disposalNote: itemMode === "create" ? disposalNote.trim() || undefined : undefined,
        image: ideaPicture?.payload,
        itemImage: itemMode === "create" ? itemPicture?.payload : undefined,
      });
      await onPublished(result);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not publish that.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Text style={styles.headline}>Add a new recipe</Text>
      <Text style={styles.body}>
        It publishes immediately as {displayName}. Attach it to an existing item, or create a new one first.
      </Text>
      {formError ? <Banner tone="bad" title="Could not publish" body={formError} /> : null}

      <View style={styles.attachToggle}>
        <Chip
          label="Search"
          selected={itemMode === "search"}
          onPress={() => switchItemMode("search")}
          testID="item-mode-search"
        />
        <Chip
          label="Create item"
          selected={itemMode === "create"}
          onPress={() => switchItemMode("create")}
          testID="item-mode-create"
        />
      </View>

      {itemMode === "search" ? (
        <Field label="Item" error={fieldErrors.item}>
          {selectedItem ? (
            <View style={styles.selectedItem} testID="selected-item">
              <View style={styles.selectedCopy}>
                <Text style={styles.selectedName}>{selectedItem.name}</Text>
                <Text style={styles.hint}>{selectedItem.categoryName}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear selected item"
                onPress={() => setSelectedItem(null)}
                style={({ pressed }) => [styles.clearButton, pressed && styles.pressed, pointer]}
                testID="clear-selected-item"
              >
                <Text style={styles.clearLabel}>Clear</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.searchBlock}>
              <Input
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search the catalog"
                maxLength={80}
                testID="recipe-item-search"
              />
              {showSearching ? <Text style={styles.hint}>Searching…</Text> : null}
              {showSearchError ? <Text style={styles.inlineError}>{showSearchError}</Text> : null}
              {!showSearching && canSearch && visibleResults.length === 0 && !showSearchError ? (
                <Text style={styles.hint}>No matches. Create an item instead.</Text>
              ) : null}
              {visibleResults.map((item) => (
                <ItemRow key={item.id} item={item} onPress={() => setSelectedItem(item)} />
              ))}
            </View>
          )}
        </Field>
      ) : (
        <>
          <Field label="Category" error={fieldErrors.category}>
            <View style={styles.chips}>
              {categories.map((category) => (
                <Chip
                  key={category.id}
                  label={category.name}
                  selected={categoryId === category.id}
                  onPress={() => setCategoryId(category.id)}
                />
              ))}
            </View>
          </Field>
          <Field label="Item name" error={fieldErrors.item}>
            <Input
              value={itemName}
              onChangeText={setItemName}
              placeholder="Name for this material"
              maxLength={80}
              testID="submit-item"
            />
            {createHintText ? <Text style={styles.hint}>{createHintText}</Text> : null}
          </Field>
          <PictureField
            label="Item picture"
            picture={itemPicture}
            onPick={() => pickPicture("item")}
            onRemove={() => setItemPicture(null)}
            addTestID="add-item-picture"
            changeTestID="change-item-picture"
            removeTestID="remove-item-picture"
            accessibilityName="item"
          />
          <Field label="Disposal note">
            <Input
              value={disposalNote}
              onChangeText={setDisposalNote}
              placeholder="Optional. Used only if this item is new."
              multiline
              testID="submit-disposal"
            />
          </Field>
        </>
      )}

      <IdeaFields
        kind={kind}
        setKind={setKind}
        title={title}
        setTitle={setTitle}
        materials={materials}
        setMaterials={setMaterials}
        steps={steps}
        setSteps={setSteps}
        ideaPicture={ideaPicture}
        onPickIdeaPicture={() => pickPicture("idea")}
        onRemoveIdeaPicture={() => setIdeaPicture(null)}
        fieldErrors={fieldErrors}
      />

      <Button label="Publish" onPress={publish} loading={saving} testID="publish" />
    </>
  );
}

function IdeaFields({
  kind,
  setKind,
  title,
  setTitle,
  materials,
  setMaterials,
  steps,
  setSteps,
  ideaPicture,
  onPickIdeaPicture,
  onRemoveIdeaPicture,
  fieldErrors,
}: {
  kind: IdeaKind;
  setKind: (kind: IdeaKind) => void;
  title: string;
  setTitle: (value: string) => void;
  materials: string;
  setMaterials: (value: string) => void;
  steps: string;
  setSteps: (value: string) => void;
  ideaPicture: PickedPicture | null;
  onPickIdeaPicture: () => void;
  onRemoveIdeaPicture: () => void;
  fieldErrors: Record<string, string>;
}) {
  return (
    <>
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
      <PictureField
        label="Idea picture"
        picture={ideaPicture}
        onPick={onPickIdeaPicture}
        onRemove={onRemoveIdeaPicture}
        addTestID="add-picture"
        changeTestID="change-picture"
        removeTestID="remove-picture"
        accessibilityName="idea"
      />
    </>
  );
}

function PictureField({
  label,
  picture,
  onPick,
  onRemove,
  addTestID,
  changeTestID,
  removeTestID,
  accessibilityName,
}: {
  label: string;
  picture: PickedPicture | null;
  onPick: () => void;
  onRemove: () => void;
  addTestID: string;
  changeTestID: string;
  removeTestID: string;
  accessibilityName: string;
}) {
  return (
    <Field label={label}>
      {picture ? (
        <View style={styles.pictureBox}>
          <Image
            source={{ uri: picture.uri }}
            style={styles.picture}
            accessibilityLabel={`Selected ${accessibilityName} picture`}
          />
          <View style={styles.pictureActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Change ${accessibilityName} picture`}
              onPress={onPick}
              style={({ pressed }) => [styles.pictureButton, pressed && styles.pressed, pointer]}
              testID={changeTestID}
            >
              <Text style={styles.pictureButtonLabel}>Change</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove ${accessibilityName} picture`}
              onPress={onRemove}
              style={({ pressed }) => [styles.pictureButton, pressed && styles.pressed, pointer]}
              testID={removeTestID}
            >
              <Text style={styles.pictureButtonLabel}>Remove</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Add a ${accessibilityName} picture`}
          onPress={onPick}
          style={({ pressed }) => [styles.addPicture, pressed && styles.pressed, pointer]}
          testID={addTestID}
        >
          <Text style={styles.addPictureLabel}>Add a picture</Text>
          <Text style={styles.hint}>Optional. JPEG, PNG, or WebP under 1.5 MB.</Text>
        </Pressable>
      )}
    </Field>
  );
}

const styles = StyleSheet.create({
  headline: { fontFamily: serif, fontSize: 28, color: colors.ink },
  body: { color: colors.ink, fontSize: 15, lineHeight: 21 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  hint: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  inlineError: { color: colors.danger, fontSize: 13, lineHeight: 18 },
  attachToggle: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  searchBlock: { gap: 10 },
  selectedItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 14,
    backgroundColor: colors.card,
  },
  selectedCopy: { flex: 1, gap: 2 },
  selectedName: { fontSize: 16, fontWeight: "700", color: colors.ink },
  clearButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
  },
  clearLabel: { fontSize: 14, fontWeight: "700", color: colors.ink },
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
