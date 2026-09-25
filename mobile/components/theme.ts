import { Platform, type TextStyle } from "react-native";

export const colors = {
  stage: "#cfc6b8",
  bg: "#f4efe6",
  card: "#fffdf8",
  ink: "#1c1915",
  muted: "#6f675c",
  line: "#e4d9c8",
  green: "#1e5c3f",
  greenDark: "#143f2b",
  greenSoft: "#e5f2ea",
  terra: "#a6532c",
  terraSoft: "#f8ece4",
  danger: "#8d2f2a",
  dangerSoft: "#f8e8e4",
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
