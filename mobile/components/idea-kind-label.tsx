import { ideaKindMeta } from "@/constants/idea-kinds";
import { kindLabel } from "@/lib/format";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View, type StyleProp, type TextStyle } from "react-native";

/** Localized idea-kind label with its icon. Unknown ids render as the raw label without an icon. */
export function IdeaKindLabel({ kind, style, iconSize = 13 }: { kind: string; style?: StyleProp<TextStyle>; iconSize?: number }) {
  const meta = ideaKindMeta(kind);
  return (
    <View style={styles.row}>
      {meta ? <Ionicons name={meta.icon} size={iconSize} color={meta.accent} /> : null}
      <Text style={style}>{kindLabel(kind)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 5 },
});
