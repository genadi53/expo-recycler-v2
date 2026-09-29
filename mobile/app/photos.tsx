import { UnderConstructionScreen } from "@/components/under-construction";
import { useTranslation } from "react-i18next";

export default function PhotosScreen() {
  const { t } = useTranslation();
  return <UnderConstructionScreen title={t("photos.title")} body={t("photos.body")} icon="camera-outline" />;
}
