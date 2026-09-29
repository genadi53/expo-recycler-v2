import { EmptyState, Screen } from "@/components/ui";
import type { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

export function UnderConstructionScreen({
  title,
  body,
  icon = "construct-outline",
}: {
  title: string;
  body?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const { t } = useTranslation();
  return (
    <Screen title={title} back>
      <EmptyState title={t("underConstruction.title")} body={body ?? t("underConstruction.body")} icon={icon} />
    </Screen>
  );
}
