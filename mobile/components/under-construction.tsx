import { EmptyState, Screen } from "@/components/ui";
import type { Ionicons } from "@expo/vector-icons";

export function UnderConstructionScreen({
  title,
  body = "This part of the app is not ready yet.",
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
