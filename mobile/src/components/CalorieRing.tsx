// ============================================================
// CalorieRing - Section 5 (Surplus Mode)
// Center = calories STILL NEEDED (not "allowed").
// Red = under by 500+ cal, Yellow = under by 200-500, Green = on track, Blue = target hit.
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CalorieRingProps {
  /** Target calories for the day (after luteal adjustment). */
  target: number;
  /** Calories consumed so far today. */
  consumed: number;
  /** Whether we are currently in the luteal phase (shows badge). Section 5. */
  isLuteal?: boolean;
  /** Adjusted target label shown when luteal (e.g. "+200 cal"). Section 11.4 */
  lutealLabel?: string;
}

function ringColor(remaining: number): string {
  if (remaining <= 0) return '#3B82F6';         // blue - target hit / slightly over
  if (remaining <= 200) return '#22C55E';       // green - on track
  if (remaining <= 500) return '#EAB308';       // yellow - under by 200-500
  return '#EF4444';                             // red - under by 500+
}

/**
 * Placeholder ring using a View border-radius circle.
 * TODO(Section 5) - replace with @shopify/react-native-skia arc path for
 * smooth animated ring (react-native-reanimated progress value).
 */
export function CalorieRing({
  target,
  consumed,
  isLuteal = false,
  lutealLabel,
}: CalorieRingProps): React.ReactElement {
  const remaining = target - consumed;
  const color = ringColor(remaining);
  const progressFraction = Math.min(1, consumed / target);
  const progressPct = Math.round(progressFraction * 100);

  return (
    <View style={styles.wrapper}>
      {/* TODO(Section 5) - Skia arc ring; for now a plain circular border */}
      <View style={[styles.ring, { borderColor: color }]}>
        <Text style={[styles.remainingNumber, { color }]}>
          {Math.max(0, remaining)}
        </Text>
        <Text style={styles.remainingLabel}>cal still needed</Text>
        <Text style={styles.progressLabel}>{progressPct}% eaten</Text>
      </View>

      {isLuteal && (
        <View style={styles.lutealBadge}>
          <Text style={styles.lutealText}>
            Luteal {lutealLabel ? lutealLabel : ''}
          </Text>
        </View>
      )}

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{consumed}</Text>
          <Text style={styles.statKey}>eaten</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{target}</Text>
          <Text style={styles.statKey}>target</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginVertical: 16,
  },
  ring: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  remainingNumber: {
    fontSize: 36,
    fontWeight: '700',
  },
  remainingLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  progressLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  lutealBadge: {
    marginTop: 8,
    backgroundColor: '#FDF2F8',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  lutealText: {
    fontSize: 12,
    color: '#BE185D',
    fontWeight: '500',
  },
  stats: {
    flexDirection: 'row',
    gap: 32,
    marginTop: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statKey: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});
