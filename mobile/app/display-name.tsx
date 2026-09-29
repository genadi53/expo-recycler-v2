import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { DisplayNameForm } from "@/components/display-name-form";
import { useProfile } from "@/components/profile";
import { Screen } from "@/components/ui";

export default function DisplayNameScreen() {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const hadName = Boolean(profile);

  return (
    <Screen title={t("displayName.screenTitle")}>
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
