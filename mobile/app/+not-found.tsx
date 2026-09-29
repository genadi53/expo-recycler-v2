import { EmptyState, Screen } from "@/components/ui";
import { router, type Href } from "expo-router";
import { useTranslation } from "react-i18next";

export default function NotFoundScreen() {
  const { t } = useTranslation();
  return (
    <Screen title={t("notFound.title")} back>
      <EmptyState
        title={t("notFound.emptyTitle")}
        body={t("notFound.emptyBody")}
        actionLabel={t("notFound.goHome")}
        onAction={() => router.replace("/" as Href)}
      />
    </Screen>
  );
}
