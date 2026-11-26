import { colors } from "@/components/theme";
import { ideaKindMeta } from "@/constants/idea-kinds";
import { absoluteApiUrl } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState, type ReactNode } from "react";
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

/**
 * An idea's photo filling its box; without one (or when it fails to load), the idea kind's
 * accent with the kind icon centred. The caller sizes the box via `style`; `children` render on top.
 */
export function IdeaImage({
  kind,
  imageUrl,
  style,
  iconSize = 48,
  accessibilityLabel,
  children,
}: {
  kind: string;
  imageUrl: string | null;
  style?: StyleProp<ViewStyle>;
  iconSize?: number;
  /** Labels the photo; omit when the surrounding control already describes the idea. */
  accessibilityLabel?: string;
  children?: ReactNode;
}) {
  const uri = absoluteApiUrl(imageUrl);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);
  const meta = ideaKindMeta(kind);
  const showPhoto = Boolean(uri) && !failed;

  return (
    <View style={[styles.box, { backgroundColor: meta?.accent ?? colors.green }, style]}>
      {showPhoto ? (
        <Image
          source={{ uri: uri! }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onError={() => setFailed(true)}
          accessible={Boolean(accessibilityLabel)}
          accessibilityLabel={accessibilityLabel}
        />
      ) : (
        <Ionicons name={meta?.icon ?? "bulb-outline"} size={iconSize} color={colors.card} />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { overflow: "hidden", alignItems: "center", justifyContent: "center" },
});
