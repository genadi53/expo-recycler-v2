import { colors } from "@/components/theme";
import { Ionicons } from "@expo/vector-icons";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

const pointer = Platform.OS === "web" ? ({ cursor: "pointer" } as const) : null;

/** Soft ink-tinted lift shared by the white cards on home (no new colours, only the ink token). */
export const homeCardShadow = {
  shadowColor: colors.ink,
  shadowOpacity: 0.08,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 3,
} as const;

/** Full-width home action row: solid green icon tile, title, body and a chevron. One button for screen readers. */
export function HomeActionCard({
  title,
  body,
  icon,
  onPress,
  testID,
}: {
  title: string;
  body: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${body}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed, pointer]}
      testID={testID}
    >
      <View style={styles.icon}>
        <Ionicons name={icon} size={24} color={colors.card} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 76,
    padding: 14,
    borderRadius: 20,
    backgroundColor: colors.card,
    ...homeCardShadow,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.green,
  },
  copy: { flex: 1, minWidth: 0 },
  title: { fontSize: 17, fontWeight: "700", color: colors.ink },
  body: { marginTop: 2, fontSize: 14, lineHeight: 19, color: colors.muted },
});
