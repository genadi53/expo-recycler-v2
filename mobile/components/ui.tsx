import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { categoryAccent, colors, serif } from "@/components/theme";
import type { ItemSummary } from "@/lib/types";

const pointer = Platform.OS === "web" ? ({ cursor: "pointer" } as const) : null;

export function Screen({
  title,
  back,
  children,
  footer,
  scroll = true,
}: {
  title?: string;
  back?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {title ? <TopBar title={title} back={back} /> : null}
      {scroll ? (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={styles.fill}>{children}</View>
      )}
      {footer ? <View style={{ paddingBottom: Math.max(insets.bottom, 10) }}>{footer}</View> : null}
    </KeyboardAvoidingView>
  );
}

export function TopBar({ title, back }: { title: string; back?: boolean }) {
  return (
    <View style={styles.topBar}>
      {back ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
          style={[styles.iconButton, pointer]}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
      ) : (
        <View style={styles.iconButton} />
      )}
      <Text style={styles.topTitle}>{title}</Text>
      <View style={styles.iconButton} />
    </View>
  );
}

export function Button({
  label,
  onPress,
  disabled,
  loading,
  tone = "primary",
  testID,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: "primary" | "secondary" | "quiet";
  testID?: string;
}) {
  const blocked = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      disabled={blocked}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        tone === "secondary" && styles.buttonSecondary,
        tone === "quiet" && styles.buttonQuiet,
        blocked && styles.buttonDisabled,
        pressed && !blocked && styles.pressed,
        pointer,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={tone === "primary" ? "#fffdf8" : colors.green} />
      ) : (
        <Text style={[styles.buttonText, tone !== "primary" && styles.buttonTextDark]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export function Input(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.muted}
      {...props}
      style={[styles.input, props.multiline && styles.inputMulti, props.style]}
    />
  );
}

export function Chip({
  label,
  selected,
  onPress,
  testID,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      testID={testID}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipOn, pointer]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <View style={styles.state} testID="loading-state">
      <ActivityIndicator color={colors.green} size="large" />
      <Text style={styles.stateTitle}>{label}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.state} testID="error-state">
      <View style={[styles.stateIcon, { backgroundColor: colors.dangerSoft }]}>
        <Ionicons name="cloud-offline-outline" size={28} color={colors.danger} />
      </View>
      <Text style={styles.stateTitle}>Something went wrong</Text>
      <Text style={styles.stateBody}>{message}</Text>
      {onRetry ? <Button label="Try again" onPress={onRetry} /> : null}
    </View>
  );
}

export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
  icon = "leaf-outline",
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.state} testID="empty-state">
      <View style={[styles.stateIcon, { backgroundColor: colors.greenSoft }]}>
        <Ionicons name={icon} size={28} color={colors.green} />
      </View>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateBody}>{body}</Text>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

export function ItemRow({ item, onPress }: { item: ItemSummary; onPress: () => void }) {
  const accent = categoryAccent[item.categoryId] ?? colors.green;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.itemRow, pressed && styles.pressed, pointer]}>
      <View style={[styles.accent, { backgroundColor: accent }]} />
      <View style={styles.itemCopy}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemSummary} numberOfLines={2}>
          {item.summary}
        </Text>
        <Text style={styles.itemMeta}>{item.categoryName}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

export function Banner({
  tone,
  title,
  body,
}: {
  tone: "good" | "bad" | "note";
  title: string;
  body?: string;
}) {
  const palette =
    tone === "bad"
      ? { bg: colors.dangerSoft, fg: colors.danger }
      : tone === "note"
        ? { bg: colors.terraSoft, fg: colors.terra }
        : { bg: colors.greenSoft, fg: colors.greenDark };
  return (
    <View style={[styles.banner, { backgroundColor: palette.bg }]}>
      <Text style={[styles.bannerTitle, { color: palette.fg }]}>{title}</Text>
      {body ? <Text style={[styles.bannerBody, { color: palette.fg }]}>{body}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  fill: { flex: 1 },
  content: { padding: 20, paddingBottom: 32, gap: 16 },
  topBar: {
    minHeight: 52,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  topTitle: { flex: 1, textAlign: "center", fontFamily: serif, fontSize: 20, color: colors.ink },
  iconButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  button: {
    backgroundColor: colors.green,
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  buttonSecondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.green },
  buttonQuiet: { backgroundColor: "transparent" },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { color: "#fffdf8", fontSize: 16, fontWeight: "700" },
  buttonTextDark: { color: colors.greenDark },
  pressed: { opacity: 0.82 },
  field: { gap: 6 },
  label: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.muted,
  },
  fieldError: { color: colors.danger, fontSize: 13 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
  },
  inputMulti: { minHeight: 96, textAlignVertical: "top" },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipOn: { backgroundColor: colors.green, borderColor: colors.green },
  chipText: { color: colors.ink, fontWeight: "600" },
  chipTextOn: { color: "#fffdf8" },
  state: { alignItems: "center", gap: 10, paddingVertical: 28, paddingHorizontal: 12 },
  stateIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  stateTitle: { fontFamily: serif, fontSize: 26, color: colors.ink, textAlign: "center" },
  stateBody: { color: colors.muted, fontSize: 16, lineHeight: 22, textAlign: "center" },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
  },
  accent: { width: 8, alignSelf: "stretch", borderRadius: 8 },
  itemCopy: { flex: 1, gap: 2 },
  itemName: { fontSize: 17, fontWeight: "700", color: colors.ink },
  itemSummary: { color: colors.muted, fontSize: 14, lineHeight: 19 },
  itemMeta: { color: colors.terra, fontSize: 12, fontWeight: "700", marginTop: 4 },
  banner: { borderRadius: 14, padding: 14, gap: 4 },
  bannerTitle: { fontWeight: "700", fontSize: 15 },
  bannerBody: { fontSize: 14, lineHeight: 20 },
});
