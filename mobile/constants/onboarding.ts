import type { ImageSourcePropType } from "react-native";

export const ONBOARDING_SEEN_KEY = "recycler.onboarding.seen.v1";

export type OnboardingSlide = {
  id: string;
  title: string;
  body: string;
  image: ImageSourcePropType;
};

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: "look-up",
    title: "Look up what you have",
    body: "Search the catalog or pick a material. Recycler shows whether it can be reused, and a plain way to get rid of it if not.",
    image: require("../assets/images/onboarding/look-up.png"),
  },
  {
    id: "reuse-first",
    title: "Reuse first, then let it go",
    body: "Follow a cook, beauty, art, or useful idea. Disposal steps sit on the same page. Trash is the last stop, not the first.",
    image: require("../assets/images/onboarding/reuse-first.png"),
  },
  {
    id: "log-actions",
    title: "Log it on this phone",
    body: "Record each reuse or disposal. No account and no password. You’ll pick a display name next, and Recycler will keep it on this phone.",
    image: require("../assets/images/onboarding/log-actions.png"),
  },
  {
    id: "keep-going",
    title: "Make it a habit",
    body: "Points and badges come from real actions, not carbon math. Recycler counts reuses, disposals, and ideas you share.",
    image: require("../assets/images/onboarding/keep-going.png"),
  },
];
