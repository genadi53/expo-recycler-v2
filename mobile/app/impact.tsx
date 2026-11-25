import { ContributionGraph } from "@/components/contribution-graph";
import { useProfile } from "@/components/profile";
import { categoryAccent, colors, serif } from "@/components/theme";
import { EmptyState, ErrorState, LoadingState, Screen } from "@/components/ui";
import { categoryLabel } from "@/lib/format";
import type { CategoryCount, ProfileSnapshot } from "@/lib/types";
import { useFocusEffect, router, type Href } from "expo-router";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

function pickGreeting(greetings: string[], previous?: string) {
  if (greetings.length <= 1) return greetings[0] ?? "";
  let next = greetings[Math.floor(Math.random() * greetings.length)]!;
  while (previous && next === previous) {
    next = greetings[Math.floor(Math.random() * greetings.length)]!;
  }
  return next;
}

export default function ImpactScreen() {
  const { t } = useTranslation();
  const { ready, profile, snapshot, error, refresh } = useProfile();

  if (!ready) {
    return (
      <ImpactShell>
        <LoadingState label={t("impact.loading")} />
      </ImpactShell>
    );
  }

  if (!profile) {
    return (
      <ImpactShell>
        <EmptyState
          title={t("impact.pickNameTitle")}
          body={t("impact.pickNameBody")}
          icon="person-outline"
          actionLabel={t("impact.openAccount")}
          onAction={() => router.push("/settings/account" as Href)}
        />
      </ImpactShell>
    );
  }

  if (!snapshot && error) {
    return (
      <ImpactShell>
        <ErrorState message={error} onRetry={() => refresh().catch(() => {})} />
      </ImpactShell>
    );
  }

  if (!snapshot) {
    return (
      <ImpactShell>
        <LoadingState label={t("impact.loading")} />
      </ImpactShell>
    );
  }

  return (
    <ImpactShell>
      <SummaryStrip snapshot={snapshot} />
      <ContributionGraph activity={snapshot.activity ?? []} />
      <ActionSplit reuses={snapshot.counts.reuses} disposals={snapshot.counts.disposals} />
      <CategoryBars rows={snapshot.byCategory ?? []} />
    </ImpactShell>
  );
}

function ImpactShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <Screen title={t("impact.title")} back>
      <View style={styles.content} testID="impact-screen">
        {children}
      </View>
    </Screen>
  );
}

function SummaryStrip({ snapshot }: { snapshot: ProfileSnapshot }) {
  const { t, i18n } = useTranslation();
  const greetings = t("impact.greetings", { returnObjects: true }) as string[];
  const list = Array.isArray(greetings) ? greetings : ["Hey"];
  const [greeting, setGreeting] = useState(() => pickGreeting(list));
  const firstFocus = useRef(true);

  useEffect(() => {
    const nextList = t("impact.greetings", { returnObjects: true }) as string[];
    setGreeting(pickGreeting(Array.isArray(nextList) ? nextList : ["Hey"]));
  }, [i18n.language, t]);

  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      const nextList = t("impact.greetings", { returnObjects: true }) as string[];
      const fallback = Array.isArray(nextList) ? nextList : ["Hey"];
      setGreeting((previous) => pickGreeting(fallback, previous));
    }, [t]),
  );

  return (
    <View style={styles.summary} testID="dashboard-summary">
      <View>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.hello}>{snapshot.displayName}</Text>
      </View>
      <View style={styles.counts}>
        <Count label={t("impact.reuses")} value={snapshot.counts.reuses} />
        <Count label={t("impact.disposals")} value={snapshot.counts.disposals} />
        <Count label={t("impact.ideas")} value={snapshot.counts.ideasShared} />
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
  const { t } = useTranslation();
  const total = reuses + disposals;
  const reusePct = total === 0 ? 0 : reuses / total;
  const disposePct = total === 0 ? 0 : disposals / total;

  return (
    <View style={styles.chartBlock} testID="action-split-chart">
      <Text style={styles.section}>{t("impact.reuseVsDispose")}</Text>
      <Text style={styles.chartNote}>
        {total === 0 ? t("impact.splitEmpty") : t("impact.splitCounts", { reuses, disposals })}
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
        <LegendDot color={colors.green} label={t("impact.reuse")} />
        <LegendDot color={colors.terra} label={t("impact.dispose")} />
      </View>
    </View>
  );
}

function CategoryBars({ rows }: { rows: CategoryCount[] }) {
  const { t } = useTranslation();
  const max = rows.reduce((n, row) => Math.max(n, row.count), 0);

  return (
    <View style={styles.chartBlock} testID="category-chart">
      <Text style={styles.section}>{t("impact.byMaterial")}</Text>
      <Text style={styles.chartNote}>
        {rows.length === 0 ? t("impact.categoriesEmpty") : t("impact.categoriesNote")}
      </Text>
      {rows.map((row) => {
        const accent = categoryAccent[row.id] ?? colors.green;
        const width = max === 0 ? 0 : Math.max(8, (row.count / max) * 100);
        return (
          <View key={row.id} style={styles.barRow}>
            <Text style={styles.barLabel} numberOfLines={1}>
              {categoryLabel(row.id, row.name)}
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
  content: { gap: 16 },
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
});
