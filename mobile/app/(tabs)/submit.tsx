import { useProfile } from "@/components/profile";
import { colors, serif } from "@/components/theme";
import { Banner, Button, Chip, EmptyState, ErrorState, Field, Input, ItemRow, LoadingState, Screen } from "@/components/ui";
import i18n from "@/i18n";
import { api } from "@/lib/api";
import { categoryLabel, kindLabel } from "@/lib/format";
import type { Category, IdeaImagePayload, ItemSummary, SubmissionResult } from "@/lib/types";
import { useQuery } from "@/lib/use-query";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ item?: string; category?: string; kind?: string; mode?: string }>();
  const mode = parseMode(typeof params.mode === "string" ? params.mode : undefined);
  const { profile, refresh } = useProfile();
  const { status, data, error, retry } = useQuery("submit-categories", () => api.categories());
  const [success, setSuccess] = useState<SubmissionResult | null>(null);
  const [formKey, setFormKey] = useState(0);

  const screenTitle =
    mode === "item" ? t("submit.addItem") : mode === "idea" ? t("submit.addRecipe") : t("submit.title");

  function another() {
    setSuccess(null);
    setFormKey((value) => value + 1);
  }

  if (status === "loading") {
    return (
      <Screen title={screenTitle}>
        <LoadingState label={t("submit.loadingCategories")} />
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
          title={t("submit.nowhereTitle")}
          body={t("submit.nowhereBody")}
          icon="albums-outline"
        />
      </Screen>
    );
  }

  if (!profile) {
    return (
      <Screen title={screenTitle}>
        <EmptyState
          title={t("submit.pickNameTitle")}
          body={t("submit.pickNameBody")}
          icon="person-outline"
          actionLabel={t("submit.chooseName")}
          onAction={() => router.push("/display-name" as Href)}
        />
      </Screen>
    );
  }

  if (success) {
    const successBody = success.idea
      ? t("submit.successIdea", {
          item: success.item.name,
          idea: success.idea.title,
          points: success.pointsAwarded,
        })
      : t("submit.successItem", {
          item: success.item.name,
          points: success.pointsAwarded,
        });
    return (
      <Screen title={screenTitle}>
        <Text style={styles.headline}>{t("submit.inCatalog")}</Text>
        <Text style={styles.body}>{successBody}</Text>
        {success.badgesUnlocked.length ? (
          <Banner
            tone="good"
            title={t("submit.badgeUnlocked")}
            body={success.badgesUnlocked.map((badge) => badge.title).join(", ")}
          />
        ) : null}
        <Button
          label={t("submit.seeItem")}
          onPress={() => router.push(`/item/${success.item.id}` as Href)}
          testID="see-item"
        />
        <Button label={t("submit.submitAnother")} tone="secondary" onPress={another} />
      </Screen>
    );
  }

  if (!mode) {
    return (
      <Screen title={t("submit.title")}>
        <Text style={styles.headline}>{t("submit.whatAdding")}</Text>
        <Text style={styles.body}>{t("submit.choosePath")}</Text>
        <Button
          label={t("submit.addItem")}
          onPress={() => router.replace("/submit?mode=item" as Href)}
          testID="choose-add-item"
        />
        <Button
          label={t("submit.addRecipe")}
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
    return { error: i18n.t("submit.photoPermission") };
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
    return { error: i18n.t("submit.photoReadFailed") };
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
  onPublished,
}: {
  categories: Category[];
  profileId: string;
  displayName: string;
  initialItemName: string;
  initialCategoryId: string;
  onPublished: (result: SubmissionResult) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [itemName, setItemName] = useState(initialItemName);
  const [disposalNote, setDisposalNote] = useState("");
  const [itemPicture, setItemPicture] = useState<PickedPicture | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [matchHint, setMatchHint] = useState<{ name: string; text: string; exists: boolean } | null>(null);
  const trimmedItemName = itemName.trim();
  const matchLabel = trimmedItemName && matchHint?.name === trimmedItemName ? matchHint.text : "";
  const nameTaken = Boolean(trimmedItemName && matchHint?.name === trimmedItemName && matchHint.exists);

  useEffect(() => {
    if (!trimmedItemName) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      api
        .items({ q: trimmedItemName })
        .then((result) => {
          if (cancelled) return;
          const found = result.items.find((item) => item.name.toLowerCase() === trimmedItemName.toLowerCase());
          setMatchHint(
            found
              ? {
                  name: trimmedItemName,
                  exists: true,
                  text: t("submit.itemExistsHint", { name: found.name }),
                }
              : { name: trimmedItemName, exists: false, text: t("submit.createsItem") },
          );
        })
        .catch(() => {
          if (!cancelled) setMatchHint(null);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmedItemName, t]);

  async function pickPicture() {
    setFormError("");
    const result = await pickPictureFromLibrary();
    if (result.error) {
      setFormError(result.error);
      return;
    }
    if (!result.picture) return;
    setItemPicture(result.picture);
  }

  async function publish() {
    const nextErrors: Record<string, string> = {};
    if (!categoryId) nextErrors.category = t("submit.pickCategory");
    if (!itemName.trim()) nextErrors.item = t("submit.itemRequired");
    else if (nameTaken) nextErrors.item = t("submit.itemExistsError");
    setFieldErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      const result = await api.submit({
        profileId,
        category: categoryId,
        itemName: itemName.trim(),
        disposalNote: disposalNote.trim() || undefined,
        itemImage: itemPicture?.payload,
      });
      await onPublished(result);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t("submit.publishFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Text style={styles.headline}>{t("submit.addItemHeadline")}</Text>
      <Text style={styles.body}>{t("submit.addItemBody", { name: displayName })}</Text>
      {formError ? <Banner tone="bad" title={t("submit.couldNotPublish")} body={formError} /> : null}

      <Field label={t("submit.category")} error={fieldErrors.category}>
        <View style={styles.chips}>
          {categories.map((category) => (
            <Chip
              key={category.id}
              label={categoryLabel(category.id, category.name)}
              selected={categoryId === category.id}
              onPress={() => setCategoryId(category.id)}
            />
          ))}
        </View>
      </Field>

      <Field label={t("submit.item")} error={fieldErrors.item}>
        <Input
          value={itemName}
          onChangeText={setItemName}
          placeholder={t("submit.itemPlaceholder")}
          maxLength={80}
          testID="submit-item"
        />
        {matchLabel ? <Text style={styles.hint}>{matchLabel}</Text> : null}
      </Field>

      <PictureField
        label={t("submit.itemPicture")}
        picture={itemPicture}
        onPick={pickPicture}
        onRemove={() => setItemPicture(null)}
        addTestID="add-item-picture"
        changeTestID="change-item-picture"
        removeTestID="remove-item-picture"
        accessibilityName="item"
      />

      <Field label={t("submit.disposalNote")}>
        <Input
          value={disposalNote}
          onChangeText={setDisposalNote}
          placeholder={t("submit.disposalPlaceholder")}
          multiline
          testID="submit-disposal"
        />
      </Field>
      <Button label={t("submit.publish")} onPress={publish} loading={saving} disabled={nameTaken} testID="publish" />
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
  const { t } = useTranslation();
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
          setSearchError(err instanceof Error ? err.message : t("submit.searchCatalogFailed"));
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [canSearch, trimmedSearch, t]);

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
              ? t("submit.itemExistsAttachHint", { name: found.name })
              : t("submit.createsItem"),
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
  }, [itemMode, trimmedCreateName, t]);

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
      if (!selectedItem) nextErrors.item = t("submit.pickOrCreate");
    } else {
      if (!categoryId) nextErrors.category = t("submit.pickCategory");
      if (!itemName.trim()) nextErrors.item = t("submit.itemRequired");
    }
    if (!title.trim()) nextErrors.title = t("submit.titleRequired");
    if (!materials.trim()) nextErrors.materials = t("submit.materialsRequired");
    if (!steps.trim()) nextErrors.steps = t("submit.stepsRequired");
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
      setFormError(err instanceof Error ? err.message : t("submit.publishFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Text style={styles.headline}>{t("submit.addRecipeHeadline")}</Text>
      <Text style={styles.body}>{t("submit.addRecipeBody", { name: displayName })}</Text>
      {formError ? <Banner tone="bad" title={t("submit.couldNotPublish")} body={formError} /> : null}

      <View style={styles.attachToggle}>
        <Chip
          label={t("submit.search")}
          selected={itemMode === "search"}
          onPress={() => switchItemMode("search")}
          testID="item-mode-search"
        />
        <Chip
          label={t("submit.createItem")}
          selected={itemMode === "create"}
          onPress={() => switchItemMode("create")}
          testID="item-mode-create"
        />
      </View>

      {itemMode === "search" ? (
        <Field label={t("submit.item")} error={fieldErrors.item}>
          {selectedItem ? (
            <View style={styles.selectedItem} testID="selected-item">
              <View style={styles.selectedCopy}>
                <Text style={styles.selectedName}>{selectedItem.name}</Text>
                <Text style={styles.hint}>
                  {categoryLabel(selectedItem.categoryId, selectedItem.categoryName)}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("submit.clearSelected")}
                onPress={() => setSelectedItem(null)}
                style={({ pressed }) => [styles.clearButton, pressed && styles.pressed, pointer]}
                testID="clear-selected-item"
              >
                <Text style={styles.clearLabel}>{t("submit.clearSelected")}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.searchBlock}>
              <Input
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t("submit.searchPlaceholder")}
                maxLength={80}
                testID="recipe-item-search"
              />
              {showSearching ? <Text style={styles.hint}>{t("submit.searching")}</Text> : null}
              {showSearchError ? <Text style={styles.inlineError}>{showSearchError}</Text> : null}
              {!showSearching && canSearch && visibleResults.length === 0 && !showSearchError ? (
                <Text style={styles.hint}>{t("submit.noMatches")}</Text>
              ) : null}
              {visibleResults.map((item) => (
                <ItemRow key={item.id} item={item} onPress={() => setSelectedItem(item)} />
              ))}
            </View>
          )}
        </Field>
      ) : (
        <>
          <Field label={t("submit.category")} error={fieldErrors.category}>
            <View style={styles.chips}>
              {categories.map((category) => (
                <Chip
                  key={category.id}
                  label={categoryLabel(category.id, category.name)}
                  selected={categoryId === category.id}
                  onPress={() => setCategoryId(category.id)}
                />
              ))}
            </View>
          </Field>
          <Field label={t("submit.itemName")} error={fieldErrors.item}>
            <Input
              value={itemName}
              onChangeText={setItemName}
              placeholder={t("submit.itemPlaceholder")}
              maxLength={80}
              testID="submit-item"
            />
            {createHintText ? <Text style={styles.hint}>{createHintText}</Text> : null}
          </Field>
          <PictureField
            label={t("submit.itemPicture")}
            picture={itemPicture}
            onPick={() => pickPicture("item")}
            onRemove={() => setItemPicture(null)}
            addTestID="add-item-picture"
            changeTestID="change-item-picture"
            removeTestID="remove-item-picture"
            accessibilityName="item"
          />
          <Field label={t("submit.disposalNote")}>
            <Input
              value={disposalNote}
              onChangeText={setDisposalNote}
              placeholder={t("submit.disposalPlaceholderNew")}
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

      <Button label={t("submit.publish")} onPress={publish} loading={saving} testID="publish" />
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
  const { t } = useTranslation();
  return (
    <>
      <Field label={t("submit.ideaKind")}>
        <View style={styles.chips}>
          {KINDS.map((entry) => (
            <Chip key={entry} label={kindLabel(entry)} selected={kind === entry} onPress={() => setKind(entry)} />
          ))}
        </View>
      </Field>

      <Field label={t("submit.titleLabel")} error={fieldErrors.title}>
        <Input
          value={title}
          onChangeText={setTitle}
          placeholder={t("submit.titlePlaceholder")}
          maxLength={120}
          testID="submit-title"
        />
      </Field>
      <Field label={t("submit.materials")} error={fieldErrors.materials}>
        <Input
          value={materials}
          onChangeText={setMaterials}
          placeholder={t("submit.materialsPlaceholder")}
          multiline
          testID="submit-materials"
        />
      </Field>
      <Field label={t("submit.steps")} error={fieldErrors.steps}>
        <Input
          value={steps}
          onChangeText={setSteps}
          placeholder={t("submit.stepsPlaceholder")}
          multiline
          testID="submit-steps"
        />
      </Field>
      <PictureField
        label={t("submit.ideaPicture")}
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
  const { t } = useTranslation();
  return (
    <Field label={label}>
      {picture ? (
        <View style={styles.pictureBox}>
          <Image
            source={{ uri: picture.uri }}
            style={styles.picture}
            accessibilityLabel={t("submit.picturePreview", { name: accessibilityName })}
          />
          <View style={styles.pictureActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("submit.changePicture")}
              onPress={onPick}
              style={({ pressed }) => [styles.pictureButton, pressed && styles.pressed, pointer]}
              testID={changeTestID}
            >
              <Text style={styles.pictureButtonLabel}>{t("submit.changePicture")}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("submit.removePicture")}
              onPress={onRemove}
              style={({ pressed }) => [styles.pictureButton, pressed && styles.pressed, pointer]}
              testID={removeTestID}
            >
              <Text style={styles.pictureButtonLabel}>{t("submit.removePicture")}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("submit.addPicture")}
          onPress={onPick}
          style={({ pressed }) => [styles.addPicture, pressed && styles.pressed, pointer]}
          testID={addTestID}
        >
          <Text style={styles.addPictureLabel}>{t("submit.addPicture")}</Text>
          <Text style={styles.hint}>{t("submit.pictureHint")}</Text>
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
