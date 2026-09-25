import { router } from "expo-router";

import { DisplayNameForm } from "@/components/display-name-form";
import { useProfile } from "@/components/profile";
import { Screen } from "@/components/ui";

export default function DisplayNameScreen() {
  const { profile } = useProfile();
  const hadName = Boolean(profile);

  return (
    <Screen title="Your name">
      <DisplayNameForm
        initialName={profile?.displayName ?? ""}
        onSaved={() => {
          if (hadName && router.canGoBack()) {
            router.back();
            return;
          }
          router.replace("/");
        }}
      />
    </Screen>
  );
}
