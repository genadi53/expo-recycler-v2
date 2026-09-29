import { useProfile } from "@/components/profile";
import { colors, serif } from "@/components/theme";
import { Banner, Chip, EmptyState, ErrorState, LoadingState, Screen } from "@/components/ui";
import { DEFAULT_DIVISION, DIVISIONS, type DivisionId } from "@/constants/divisions";
import { api } from "@/lib/api";
import { ordinal } from "@/lib/format";
import type { Leader } from "@/lib/types";
import { useQuery } from "@/lib/use-query";
import { router, type Href } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

export default function LeaderboardScreen() {
  const { t } = useTranslation();
  const { ready, profile } = useProfile();
  const [division, setDivision] = useState<DivisionId>(DEFAULT_DIVISION);
  const selected = useMemo(() => DIVISIONS.find((item) => item.id === division) ?? DIVISIONS[0], [division]);
  const selectedLabel = t(selected.labelKey);
  const key = ready ? `board:${profile?.id ?? "anon"}` : "board:wait";
  const { status, data, error, retry } = useQuery(key, () =>
    ready ? api.leaderboard(profile?.id) : Promise.resolve(null),
  );

  return (
    <Screen title={t("leaderboard.title")}>
      <Banner tone="note" title={t("leaderboard.bannerTitle")} body={t("leaderboard.bannerBody")} />

      <View style={styles.divisions} testID="leaderboard-divisions">
        <Text style={styles.section}>{t("leaderboard.division")}</Text>
        <View style={styles.chips}>
          {DIVISIONS.map((item) => (
            <Chip
              key={item.id}
              label={t(item.labelKey)}
              selected={item.id === division}
              onPress={() => setDivision(item.id)}
              testID={`division-${item.id}`}
            />
          ))}
        </View>
        <Text style={styles.note}>{t("leaderboard.divisionNote", { label: selectedLabel })}</Text>
      </View>

      {!ready || status === "loading" ? <LoadingState label={t("leaderboard.loading")} /> : null}
      {ready && status === "error" ? <ErrorState message={error} onRetry={retry} /> : null}
      {ready && status === "ready" && data ? (
        <>
          {data.you ? (
            <View style={styles.you} testID="your-rank">
              <Text style={styles.youLabel}>{t("leaderboard.yourRank", { label: selectedLabel })}</Text>
              <Text style={styles.youRank}>{ordinal(data.you.rank)}</Text>
              <Text style={styles.youMeta}>
                {t("leaderboard.yourMeta", { name: data.you.displayName, points: data.you.points })}
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.note}>{t("leaderboard.rankUsesName")}</Text>
              <Text style={styles.note}>{t("leaderboard.setNameHint")}</Text>
            </>
          )}
          {data.leaders.length === 0 ? (
            <EmptyState
              title={t("leaderboard.emptyTitle")}
              body={t("leaderboard.emptyBody")}
              actionLabel={t("leaderboard.openLog")}
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
  divisions: { gap: 10 },
  section: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.muted,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
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
