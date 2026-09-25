import { EmptyState, Screen } from "@/components/ui";

export function UnderConstructionScreen({ title }: { title: string }) {
  return (
    <Screen title={title} back>
      <EmptyState
        title="Under construction"
        body="This part of Settings is not ready yet."
        icon="construct-outline"
      />
    </Screen>
  );
}
