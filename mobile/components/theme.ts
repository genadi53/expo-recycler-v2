import { Platform, type TextStyle } from "react-native";

export const colors = {
  stage: "#86a57d",
  bg: "#f7f3ea",
  card: "#fffdf8",
  ink: "#1f2a22",
  muted: "#6b7466",
  line: "#e3e8dc",
  green: "#2e5a3f",
  greenDark: "#1f4030",
  greenSoft: "#cfe1cc",
  terra: "#a6532c",
  terraSoft: "#fbe3d5",
  danger: "#8d2f2a",
  dangerSoft: "#f8e8e4",
  /** Dims the screen behind a bottom sheet. */
  scrim: "rgba(28, 25, 21, 0.45)",
};

export const serif: TextStyle["fontFamily"] = Platform.select({
  web: 'Georgia, "Iowan Old Style", Palatino, "Palatino Linotype", serif',
  ios: "Georgia",
  default: "serif",
});

export const categoryAccent: Record<string, string> = {
  food: "#a6532c",
  plastic: "#2a6f97",
  metal: "#6e675e",
  glass: "#2f7d6d",
  paper: "#a6843d",
  other: "#5d5278",
};
