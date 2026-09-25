import { BadgeArt } from "@/components/badge-art";
import { useProfile } from "@/components/profile";
import { colors, serif } from "@/components/theme";
import { EmptyState, ErrorState, LoadingState, Screen } from "@/components/ui";
import { formatUnlocked } from "@/lib/format";
import type { Badge } from "@/lib/types";
import { router, type Href } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function BadgesScreen() {
  const { ready, profile, snapshot, error, refresh } = useProfile();

  if (!ready) {
    return (
      <Screen title="Badges" back>
        <LoadingState label="Loading your badges…" />
      </Screen>
    );
  }

  if (!profile) {
    return (
      <Screen title="Badges" back>
        <EmptyState
          title="Pick a display name"
          body="Badges stay with the name on this phone. Set it in Account under Settings."
          icon="ribbon-outline"
          actionLabel="Open Account"
          onAction={() => router.push("/settings/account" as Href)}
        />
      </Screen>
    );
  }

  if (!snapshot && error) {
    return (
      <Screen title="Badges" back>
        <ErrorState message={error} onRetry={() => refresh().catch(() => {})} />
      </Screen>
    );
  }

  if (!snapshot) {
    return (
      <Screen title="Badges" back>
        <LoadingState label="Loading your badges…" />
      </Screen>
    );
  }

  const unlocked = snapshot.badges.filter((badge) => badge.unlockedAt).length;

  return (
    <Screen title="Badges" back>
      <Text style={styles.lede}>
        {unlocked} of {snapshot.badges.length} unlocked
      </Text>
      <Text style={styles.note}>Earned from reuses, disposals, and ideas you share. Not from carbon math.</Text>
      <View style={styles.grid}>
        {snapshot.badges.map((badge) => (
          <View key={badge.slug} style={styles.slot}>
            <BadgeCard badge={badge} />
          </View>
        ))}
      </View>
    </Screen>
  );
}

function BadgeCard({ badge }: { badge: Badge }) {
  const unlocked = Boolean(badge.unlockedAt);
  return (
    <View style={[styles.card, unlocked ? styles.cardOn : styles.cardOff]} testID={`badge-${badge.slug}`}>
      <BadgeArt slug={badge.slug} unlocked={unlocked} size={132} />
      <Text style={styles.title}>{badge.title}</Text>
      <Text style={styles.rule}>{badge.rule}</Text>
      <Text style={styles.state}>{unlocked && badge.unlockedAt ? formatUnlocked(badge.unlockedAt) : "Locked"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  lede: { fontFamily: serif, fontSize: 26, color: colors.ink },
  note: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: -6 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 },
  slot: { width: "50%", padding: 6 },
  card: {
    borderRadius: 16,
    padding: 12,
    gap: 6,
    alignItems: "center",
    minHeight: 236,
  },
  cardOn: { backgroundColor: colors.greenSoft },
  cardOff: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  title: { fontWeight: "800", color: colors.ink, textAlign: "center" },
  rule: { color: colors.muted, fontSize: 13, lineHeight: 18, textAlign: "center" },
  state: { color: colors.green, fontSize: 12, fontWeight: "700", marginTop: 2 },
});
