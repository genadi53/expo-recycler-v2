import { useProfile } from "@/components/profile";
import { colors, serif } from "@/components/theme";
import { Banner, EmptyState, ErrorState, LoadingState, Screen } from "@/components/ui";
import { api } from "@/lib/api";
import { ordinal } from "@/lib/format";
import type { Leader } from "@/lib/types";
import { useQuery } from "@/lib/use-query";
import { router, type Href } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function LeaderboardScreen() {
  const { ready, profile } = useProfile();
  const key = ready ? `board:${profile?.id ?? "anon"}` : "board:wait";
  const { status, data, error, retry } = useQuery(key, () =>
    ready ? api.leaderboard(profile?.id) : Promise.resolve(null),
  );

  return (
    <Screen title="Leaderboard">
      <Banner
        tone="note"
        title="Friendly competition, not a verified ranking."
        body="Display names are not tied to an account, so a name can be copied and points can be inflated."
      />
      {!ready || status === "loading" ? <LoadingState label="Loading the leaderboard…" /> : null}
      {ready && status === "error" ? <ErrorState message={error} onRetry={retry} /> : null}
      {ready && status === "ready" && data ? (
        <>
          {data.you ? (
            <View style={styles.you} testID="your-rank">
              <Text style={styles.youLabel}>Your rank</Text>
              <Text style={styles.youRank}>{ordinal(data.you.rank)}</Text>
              <Text style={styles.youMeta}>
                {data.you.displayName} · {data.you.points} points
              </Text>
            </View>
          ) : (
            <Text style={styles.note}>Pick a display name on the Log tab to see your rank.</Text>
          )}
          {data.leaders.length === 0 ? (
            <EmptyState
              title="No one is on the board yet"
              body="Log a reuse or share an idea and your display name takes the first spot."
              actionLabel="Open your log"
              onAction={() => router.push("/log" as Href)}
              icon="trophy-outline"
            />
          ) : (
            data.leaders.map((leader) => <LeaderRow key={`${leader.rank}-${leader.displayName}`} leader={leader} />)
          )}
        </>
      ) : null}
    </Screen>
  );
}

function LeaderRow({ leader }: { leader: Leader }) {
  return (
    <View style={[styles.row, leader.isYou && styles.rowYou]}>
      <Text style={styles.rank}>{leader.rank}</Text>
      <Text style={[styles.name, leader.isYou && styles.nameYou]}>{leader.displayName}</Text>
      <Text style={styles.points}>{leader.points}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  you: {
    backgroundColor: colors.greenSoft,
    borderRadius: 16,
    padding: 14,
    gap: 2,
  },
  youLabel: { color: colors.green, fontSize: 12, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase" },
  youRank: { fontFamily: serif, fontSize: 36, color: colors.ink },
  youMeta: { color: colors.ink },
  note: { color: colors.muted, lineHeight: 20 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  rowYou: { borderColor: colors.green, backgroundColor: colors.greenSoft },
  rank: { width: 28, fontFamily: serif, fontSize: 20, color: colors.muted },
  name: { flex: 1, fontWeight: "700", color: colors.ink, fontSize: 16 },
  nameYou: { color: colors.greenDark },
  points: { fontWeight: "800", color: colors.terra },
});
