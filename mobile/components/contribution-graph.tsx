import { colors } from "@/components/theme";
import type { ActivityDay } from "@/lib/types";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

const CELL = 12;
const GAP = 3;
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function levelColor(count: number, max: number): string {
  if (count <= 0) return colors.line;
  if (max <= 1) return colors.green;
  const ratio = count / max;
  if (ratio <= 0.25) return "#a8c9b4";
  if (ratio <= 0.5) return "#6f9f7f";
  if (ratio <= 0.75) return "#3d7a56";
  return colors.green;
}

function toDateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

type Week = {
  days: { key: string; count: number; inRange: boolean }[];
  monthLabel: string | null;
};

function buildWeeks(activity: ActivityDay[]): { weeks: Week[]; total: number; max: number } {
  const map = new Map(activity.map((day) => [day.date, day.count]));
  const today = startOfUtcDay(new Date());
  const rangeStart = new Date(today);
  rangeStart.setUTCDate(rangeStart.getUTCDate() - 364);

  const start = new Date(rangeStart);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());

  const weeks: Week[] = [];
  let cursor = new Date(start);
  let total = 0;
  let max = 0;
  let lastMonth = -1;

  while (cursor.getTime() <= today.getTime()) {
    const days: Week["days"] = [];
    let monthLabel: string | null = null;
    for (let dow = 0; dow < 7; dow++) {
      const key = toDateKey(cursor);
      const inRange = cursor.getTime() >= rangeStart.getTime() && cursor.getTime() <= today.getTime();
      const count = inRange ? map.get(key) ?? 0 : 0;
      if (inRange && count > 0) {
        total += count;
        if (count > max) max = count;
      }
      if (inRange && dow === 0 && cursor.getUTCMonth() !== lastMonth) {
        monthLabel = MONTHS[cursor.getUTCMonth()];
        lastMonth = cursor.getUTCMonth();
      }
      days.push({ key, count, inRange });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    weeks.push({ days, monthLabel });
  }

  return { weeks, total, max };
}

export function ContributionGraph({ activity }: { activity: ActivityDay[] }) {
  const { weeks, total, max } = useMemo(() => buildWeeks(activity), [activity]);

  return (
    <View style={styles.wrap} testID="contribution-graph">
      <Text style={styles.title}>
        {total} {total === 1 ? "action" : "actions"} in the last year
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.dayCol}>
          {DAY_LABELS.map((label, index) => (
            <Text key={`d-${index}`} style={styles.dayLabel}>
              {label}
            </Text>
          ))}
        </View>
        <View>
          <View style={styles.monthRow}>
            {weeks.map((week, index) => (
              <View key={`m-${index}`} style={styles.monthCell}>
                {week.monthLabel ? <Text style={styles.monthLabel}>{week.monthLabel}</Text> : null}
              </View>
            ))}
          </View>
          <View style={styles.grid}>
            {weeks.map((week, wi) => (
              <View key={`w-${wi}`} style={styles.week}>
                {week.days.map((day) => (
                  <View
                    key={day.key}
                    style={[
                      styles.cell,
                      {
                        backgroundColor: day.inRange ? levelColor(day.count, max) : "transparent",
                      },
                    ]}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      <View style={styles.legend}>
        <Text style={styles.legendText}>Less</Text>
        {[0, 1, 2, 3, 4].map((level) => (
          <View
            key={level}
            style={[
              styles.legendCell,
              { backgroundColor: level === 0 ? colors.line : levelColor(level, 4) },
            ]}
          />
        ))}
        <Text style={styles.legendText}>More</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  title: { fontSize: 16, fontWeight: "700", color: colors.ink },
  scroll: { paddingRight: 8, alignItems: "flex-start" },
  dayCol: {
    width: 28,
    marginRight: 4,
    marginTop: 18,
    gap: GAP,
  },
  dayLabel: {
    height: CELL,
    fontSize: 9,
    lineHeight: CELL,
    color: colors.muted,
  },
  monthRow: { flexDirection: "row", height: 16, marginBottom: 2, gap: GAP },
  monthCell: { width: CELL },
  monthLabel: { fontSize: 9, color: colors.muted, position: "absolute", left: 0, width: 28 },
  grid: { flexDirection: "row", gap: GAP },
  week: { gap: GAP },
  cell: {
    width: CELL,
    height: CELL,
    borderRadius: 3,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  legendText: { fontSize: 11, color: colors.muted },
  legendCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});
