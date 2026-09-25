import { EmptyState, Screen } from "@/components/ui";
import { router } from "expo-router";

export default function NotFoundScreen() {
  return (
    <Screen title="Missing page" back>
      <EmptyState
        title="That page is not in the app"
        body="Head back to the catalog and search for what you have."
        actionLabel="Go home"
        onAction={() => router.replace("/")}
        icon="help-circle-outline"
      />
    </Screen>
  );
}
