import { ContributionGraph } from "@/components/contribution-graph";
import { useProfile } from "@/components/profile";
import { RecipePreview } from "@/components/recipe-grid";
import { categoryAccent, colors, serif } from "@/components/theme";
import { Button, EmptyState, ErrorState, LoadingState, Screen } from "@/components/ui";
import { api } from "@/lib/api";
import type { CategoryCount, ProfileSnapshot } from "@/lib/types";
import { useQuery } from "@/lib/use-query";
import { useFocusEffect, router, type Href } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

const GREETINGS = [
  "Hey",
  "Welcome back",
  "Good to see you",
  "Nice to have you here",
  "Ready when you are",
  "Let's keep going",
  "What are we sorting today",
  "Another small win awaits",
];

function pickGreeting(previous?: string) {
  if (GREETINGS.length <= 1) return GREETINGS[0] ?? "";
  let next = GREETINGS[Math.floor(Math.random() * GREETINGS.length)]!;
  while (previous && next === previous) {
    next = GREETINGS[Math.floor(Math.random() * GREETINGS.length)]!;
  }
  return next;
}

export default function DashboardScreen() {
  const { ready, profile, snapshot, error, refresh } = useProfile();
  const recipes = useQuery("dashboard-recipes", () => api.ideas({ kind: "cook", limit: 4 }));

  if (!ready) {
    return (
      <Screen>
        <DashboardHeader />
        <LoadingState label="Loading your dashboard…" />
      </Screen>
    );
  }

  if (!profile) {
    return (
      <Screen>
        <DashboardHeader />
        <EmptyState
          title="Pick a display name"
          body="Your points, contribution graph, and charts stay with this name on this phone. Set it in Account under Settings."
          icon="person-outline"
          actionLabel="Open Account"
          onAction={() => router.push("/settings/account" as Href)}
        />
        {recipes.status === "ready" && recipes.data ? <RecipePreview recipes={recipes.data.ideas} /> : null}
        <View style={styles.ctaBlock}>
          <Button label="Find an item" onPress={() => router.push("/browse" as Href)} testID="cta-browse" />
        </View>
      </Screen>
    );
  }

  if (!snapshot && error) {
    return (
      <Screen>
        <DashboardHeader />
        <ErrorState message={error} onRetry={() => refresh().catch(() => {})} />
      </Screen>
    );
  }

  if (!snapshot) {
    return (
      <Screen>
        <DashboardHeader />
        <LoadingState label="Loading your dashboard…" />
      </Screen>
    );
  }

  return (
    <Screen>
      <DashboardHeader />
      <SummaryStrip snapshot={snapshot} />
      <ContributionGraph activity={snapshot.activity ?? []} />
      <ActionSplit reuses={snapshot.counts.reuses} disposals={snapshot.counts.disposals} />
      <CategoryBars rows={snapshot.byCategory ?? []} />
      {recipes.status === "ready" && recipes.data ? <RecipePreview recipes={recipes.data.ideas} /> : null}
      <View style={styles.ctaBlock}>
        <Button label="Find an item" onPress={() => router.push("/browse" as Href)} testID="cta-browse" />
        <Button
          label="Share an idea"
          tone="secondary"
          onPress={() => router.push("/submit?mode=idea" as Href)}
          testID="cta-submit"
        />
      </View>
    </Screen>
  );
}

function DashboardHeader() {
  return (
    <View style={styles.header} testID="dashboard-header">
      <Image
        source={require("../../assets/images/icon.png")}
        style={styles.logo}
        accessibilityLabel="Recycler logo"
      />
      <Text style={styles.mark}>Recycler</Text>
    </View>
  );
}

function SummaryStrip({ snapshot }: { snapshot: ProfileSnapshot }) {
  const [greeting, setGreeting] = useState(() => pickGreeting());
  const firstFocus = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      setGreeting((previous) => pickGreeting(previous));
    }, []),
  );

  return (
    <View style={styles.summary} testID="dashboard-summary">
      <View>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.hello}>{snapshot.displayName}</Text>
      </View>
      <View style={styles.counts}>
        <Count label="Reuses" value={snapshot.counts.reuses} />
        <Count label="Disposals" value={snapshot.counts.disposals} />
        <Count label="Ideas" value={snapshot.counts.ideasShared} />
      </View>
    </View>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.count}>
      <Text style={styles.countValue}>{value}</Text>
      <Text style={styles.countLabel}>{label}</Text>
    </View>
  );
}

function ActionSplit({ reuses, disposals }: { reuses: number; disposals: number }) {
  const total = reuses + disposals;
  const reusePct = total === 0 ? 0 : reuses / total;
  const disposePct = total === 0 ? 0 : disposals / total;

  return (
    <View style={styles.chartBlock} testID="action-split-chart">
      <Text style={styles.section}>Reuse vs dispose</Text>
      <Text style={styles.chartNote}>
        {total === 0 ? "Log a reuse or disposal to see the split." : `${reuses} reuses · ${disposals} disposals`}
      </Text>
      <View style={styles.splitTrack}>
        {total === 0 ? (
          <View style={styles.splitEmpty} />
        ) : (
          <>
            {reuses > 0 ? <View style={[styles.splitReuse, { flex: reusePct }]} /> : null}
            {disposals > 0 ? <View style={[styles.splitDispose, { flex: disposePct }]} /> : null}
          </>
        )}
      </View>
      <View style={styles.splitLegend}>
        <LegendDot color={colors.green} label="Reuse" />
        <LegendDot color={colors.terra} label="Dispose" />
      </View>
    </View>
  );
}

function CategoryBars({ rows }: { rows: CategoryCount[] }) {
  const max = rows.reduce((n, row) => Math.max(n, row.count), 0);

  return (
    <View style={styles.chartBlock} testID="category-chart">
      <Text style={styles.section}>By material</Text>
      <Text style={styles.chartNote}>
        {rows.length === 0 ? "Categories show up after you log an item." : "All-time actions by material."}
      </Text>
      {rows.map((row) => {
        const accent = categoryAccent[row.id] ?? colors.green;
        const width = max === 0 ? 0 : Math.max(8, (row.count / max) * 100);
        return (
          <View key={row.id} style={styles.barRow}>
            <Text style={styles.barLabel} numberOfLines={1}>
              {row.name}
            </Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${width}%`, backgroundColor: accent }]} />
            </View>
            <Text style={styles.barValue}>{row.count}</Text>
          </View>
        );
      })}
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  mark: {
    fontFamily: serif,
    fontSize: 32,
    color: colors.ink,
  },
  summary: { gap: 12 },
  greeting: { color: colors.muted, fontSize: 15, fontWeight: "600" },
  hello: { fontFamily: serif, fontSize: 34, color: colors.ink, lineHeight: 38, marginTop: 2 },
  counts: { flexDirection: "row", gap: 8 },
  count: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 10,
    gap: 2,
  },
  countValue: { fontFamily: serif, fontSize: 24, color: colors.ink },
  countLabel: { color: colors.muted, fontSize: 12 },
  chartBlock: { gap: 8 },
  section: { fontFamily: serif, fontSize: 24, color: colors.ink },
  chartNote: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  splitTrack: {
    height: 16,
    borderRadius: 8,
    overflow: "hidden",
    flexDirection: "row",
    backgroundColor: colors.line,
    gap: 2,
  },
  splitEmpty: { flex: 1, backgroundColor: colors.line },
  splitReuse: { backgroundColor: colors.green, borderRadius: 8 },
  splitDispose: { backgroundColor: colors.terra, borderRadius: 8 },
  splitLegend: { flexDirection: "row", gap: 16 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { color: colors.muted, fontSize: 13 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  barLabel: { width: 64, color: colors.ink, fontSize: 13, fontWeight: "600" },
  barTrack: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.line,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 6 },
  barValue: { width: 28, textAlign: "right", color: colors.muted, fontSize: 13, fontWeight: "700" },
  ctaBlock: { gap: 10, marginTop: 4, marginBottom: 8 },
});
