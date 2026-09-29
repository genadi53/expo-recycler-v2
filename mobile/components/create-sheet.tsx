import { colors, serif } from "@/components/theme";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const pointer = Platform.OS === "web" ? ({ cursor: "pointer" } as const) : null;

type CircleShortcut = {
  labelKey: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: Href;
  testID: string;
};

type ListShortcut = {
  labelKey: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: Href;
  testID: string;
};

const CIRCLES: CircleShortcut[] = [
  { labelKey: "shortcuts.addItem", icon: "add-outline", href: "/submit?mode=item", testID: "shortcut-add-item" },
  { labelKey: "shortcuts.recipe", icon: "reader-outline", href: "/submit?mode=idea", testID: "shortcut-recipe" },
  { labelKey: "shortcuts.scan", icon: "barcode-outline", href: "/scan", testID: "shortcut-scan" },
  { labelKey: "shortcuts.search", icon: "search-outline", href: "/browse", testID: "shortcut-search" },
];

const ROWS: ListShortcut[] = [
  { labelKey: "shortcuts.logReuse", icon: "refresh-outline", href: "/browse", testID: "shortcut-log-reuse" },
  { labelKey: "shortcuts.beautyUse", icon: "sparkles-outline", href: "/submit?kind=beauty&mode=idea", testID: "shortcut-beauty" },
  { labelKey: "shortcuts.photos", icon: "camera-outline", href: "/photos", testID: "shortcut-photos" },
];
export function CreateSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  if (!visible) return null;

  function go(href: Href) {
    onClose();
    router.push(href);
  }

  return (
    <View style={styles.overlay} pointerEvents="box-none" testID="create-sheet">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("shortcuts.close")}
        onPress={onClose}
        style={styles.dim}
        testID="create-sheet-dim"
      />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("common.close")}
            onPress={onClose}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed, pointer]}
            hitSlop={8}
            testID="create-sheet-close"
          >
            <Ionicons name="close" size={24} color={colors.ink} />
          </Pressable>
          <Text style={styles.title}>{t("shortcuts.title")}</Text>
          <View style={styles.iconButton} />
        </View>

        <View style={styles.circles}>
          {CIRCLES.map((item) => {
            const label = t(item.labelKey);
            return (
              <Pressable
                key={item.labelKey}
                accessibilityRole="button"
                accessibilityLabel={label}
                onPress={() => go(item.href)}
                style={({ pressed }) => [styles.circleSlot, pressed && styles.pressed, pointer]}
                testID={item.testID}
              >
                <View style={styles.ring}>
                  <Ionicons name={item.icon} size={24} color={colors.green} />
                </View>
                <Text style={styles.circleLabel}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.group}>
          {ROWS.map((row, index) => {
            const label = t(row.labelKey);
            return (
              <View key={row.labelKey}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  onPress={() => go(row.href)}
                  style={({ pressed }) => [styles.row, pressed && styles.pressed, pointer]}
                  testID={row.testID}
                >
                  <Ionicons name={row.icon} size={22} color={colors.ink} />
                  <Text style={styles.rowLabel}>{label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 20,
    justifyContent: "flex-end",
  },
  dim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(28, 25, 21, 0.45)",
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 8,
    gap: 8,
  },
  header: {
    minHeight: 52,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontFamily: serif,
    fontSize: 20,
    color: colors.ink,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  circles: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  circleSlot: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  ring: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.greenSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  circleLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.ink,
  },
  group: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: 16,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: colors.ink,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.line,
    marginLeft: 48,
  },
  pressed: { opacity: 0.82 },
});
