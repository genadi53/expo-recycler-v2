import type { ImageSourcePropType } from "react-native";

export const ONBOARDING_SEEN_KEY = "recycler.onboarding.seen.v1";

export type OnboardingSlide = {
  id: string;
  titleKey: string;
  bodyKey: string;
  image: ImageSourcePropType;
};

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: "look-up",
    titleKey: "onboarding.lookUpTitle",
    bodyKey: "onboarding.lookUpBody",
    image: require("../assets/images/onboarding/look-up.png"),
  },
  {
    id: "reuse-first",
    titleKey: "onboarding.reuseFirstTitle",
    bodyKey: "onboarding.reuseFirstBody",
    image: require("../assets/images/onboarding/reuse-first.png"),
  },
  {
    id: "log-actions",
    titleKey: "onboarding.logActionsTitle",
    bodyKey: "onboarding.logActionsBody",
    image: require("../assets/images/onboarding/log-actions.png"),
  },
  {
    id: "keep-going",
    titleKey: "onboarding.keepGoingTitle",
    bodyKey: "onboarding.keepGoingBody",
    image: require("../assets/images/onboarding/keep-going.png"),
  },
];
