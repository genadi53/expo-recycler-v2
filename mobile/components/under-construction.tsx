import { EmptyState, Screen } from "@/components/ui";
import { Ionicons } from "@expo/vector-icons";

export function UnderConstructionScreen({
  title,
  body = "This part of Settings is not ready yet.",
  icon = "construct-outline",
}: {
  title: string;
  body?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Screen title={title} back>
      <EmptyState title="Under construction" body={body} icon={icon} />
    </Screen>
  );
}
