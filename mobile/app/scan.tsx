import { UnderConstructionScreen } from "@/components/under-construction";
import { useTranslation } from "react-i18next";

export default function ScanScreen() {
  const { t } = useTranslation();
  return <UnderConstructionScreen title={t("scan.title")} body={t("scan.body")} icon="barcode-outline" />;
}
