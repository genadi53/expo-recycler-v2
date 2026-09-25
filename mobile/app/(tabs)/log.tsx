import { BadgeArt } from "@/components/badge-art";
import { useProfile } from "@/components/profile";
import { colors, serif } from "@/components/theme";
import { EmptyState, ErrorState, LoadingState, Screen } from "@/components/ui";
import { formatWhen, METHOD_LABEL } from "@/lib/format";
import type { Badge, LogEntry } from "@/lib/types";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

const pointer = Platform.OS === "web" ? ({ cursor: "pointer" } as const) : null;

export default function LogScreen() {
  const { ready, profile, snapshot, error, refresh } = useProfile();

  if (!ready) {
    return (
      <Screen title="Your log">
        <LoadingState label="Loading your log…" />
      </Screen>
    );
  }

  if (!profile) {
    return (
      <Screen title="Your log">
        <EmptyState
          title="Pick a display name"
          body="The log and points stay with this name on this phone. Set it in Account under Settings. There is no sign-in, and a new phone starts fresh."
          icon="person-outline"
          actionLabel="Open Account"
          onAction={() => router.push("/settings/account" as Href)}
        />
      </Screen>
    );
  }

  if (!snapshot && error) {
    return (
      <Screen title="Your log">
        <ErrorState message={error} onRetry={() => refresh().catch(() => {})} />
      </Screen>
    );
  }

  if (!snapshot) {
    return (
      <Screen title="Your log">
        <LoadingState label="Loading your log…" />
      </Screen>
    );
  }

  return (
    <Screen title="Your log">
      <Text style={styles.hello}>{snapshot.displayName}</Text>
      <Text style={styles.points}>{snapshot.points}</Text>
      <Text style={styles.pointsLabel}>points on this phone</Text>
      <Text style={styles.note}>Counts only. No carbon estimate, and no weight saved.</Text>

      <View style={styles.counts}>
        <Count label="Reuses" value={snapshot.counts.reuses} />
        <Count label="Disposals" value={snapshot.counts.disposals} />
        <Count label="Ideas shared" value={snapshot.counts.ideasShared} />
      </View>

      <BadgesDoor badges={snapshot.badges} />

      <Text style={styles.section}>Recent</Text>
      {snapshot.recent.length === 0 ? (
        <EmptyState
          title="Nothing logged yet"
          body="Search for something you have, then record a reuse or a disposal. Ideas you share are counted above."
          actionLabel="Find an item"
          onAction={() => router.push("/" as Href)}
        />
      ) : (
        snapshot.recent.map((entry) => <LogRow key={entry.id} entry={entry} />)
      )}
    </Screen>
  );
}

function BadgesDoor({ badges }: { badges: Badge[] }) {
  const unlocked = badges.filter((badge) => badge.unlockedAt).length;
  const thumbs = badges.slice(0, 3);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Badges, ${unlocked} of ${badges.length} unlocked`}
      onPress={() => router.push("/badges" as Href)}
      testID="open-badges"
      style={({ pressed }) => [styles.door, pressed && styles.pressed, pointer]}
    >
      <View style={styles.thumbs}>
        {thumbs.map((badge) => (
          <BadgeArt key={badge.slug} slug={badge.slug} unlocked={Boolean(badge.unlockedAt)} size={44} />
        ))}
      </View>
      <View style={styles.doorCopy}>
        <Text style={styles.doorTitle}>Badges</Text>
        <Text style={styles.doorMeta}>
          {unlocked} of {badges.length} unlocked
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
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

function LogRow({ entry }: { entry: LogEntry }) {
  const detail =
    entry.action === "reuse"
      ? entry.ideaTitle ?? "Reuse"
      : entry.method
        ? METHOD_LABEL[entry.method] ?? entry.method
        : "Disposal";
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>
          {entry.action === "reuse" ? "Reused" : "Disposed"} · {entry.itemName}
        </Text>
        <Text style={styles.rowMeta}>
          {detail} · {entry.categoryName}
        </Text>
        <Text style={styles.rowMeta}>{formatWhen(entry.createdAt)}</Text>
      </View>
      <Text style={styles.rowPoints}>+{entry.pointsAwarded}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hello: { color: colors.muted, fontSize: 14, fontWeight: "700" },
  points: { fontFamily: serif, fontSize: 64, color: colors.ink, lineHeight: 68 },
  pointsLabel: { color: colors.muted, marginTop: -4 },
  note: { color: colors.muted, fontSize: 13, lineHeight: 18 },
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
  countValue: { fontFamily: serif, fontSize: 28, color: colors.ink },
  countLabel: { color: colors.muted, fontSize: 12 },
  door: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 12,
  },
  thumbs: { flexDirection: "row", gap: 6 },
  doorCopy: { flex: 1, gap: 2 },
  doorTitle: { fontWeight: "800", color: colors.ink, fontSize: 16 },
  doorMeta: { color: colors.muted, fontSize: 13 },
  pressed: { opacity: 0.82 },
  section: { fontFamily: serif, fontSize: 26, color: colors.ink },
  row: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
  },
  rowTitle: { fontWeight: "700", color: colors.ink },
  rowMeta: { color: colors.muted, fontSize: 13, marginTop: 2 },
  rowPoints: { color: colors.terra, fontWeight: "800" },
});
