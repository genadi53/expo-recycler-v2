import { StyleSheet, View } from "react-native";

import { colors } from "@/components/theme";

type ProgressDotsProps = {
  count: number;
  activeIndex: number;
};

export function ProgressDots({ count, activeIndex }: ProgressDotsProps) {
  return (
    <View
      style={styles.row}
      accessibilityRole="adjustable"
      accessibilityLabel={`Page ${activeIndex + 1} of ${count}`}
    >
      {Array.from({ length: count }, (_, index) => {
        const active = index === activeIndex;
        return (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: active ? colors.green : colors.line,
                transform: [{ scale: active ? 1.15 : 1 }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
