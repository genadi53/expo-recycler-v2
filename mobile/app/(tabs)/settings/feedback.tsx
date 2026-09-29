import { UnderConstructionScreen } from "@/components/under-construction";
import { useTranslation } from "react-i18next";

export default function FeedbackScreen() {
  const { t } = useTranslation();
  return <UnderConstructionScreen title={t("settings.feedback")} />;
}
