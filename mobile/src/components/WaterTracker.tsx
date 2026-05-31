// ============================================================
// WaterTracker - Section 10.2
// 8/12/16/20oz preset buttons + progress bar.
// ============================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { WaterSummary } from '@/types';

const PRESETS_OZ: number[] = [8, 12, 16, 20];

interface WaterTrackerProps {
  summary: WaterSummary;
  /** Called when a preset or custom amount is tapped. TODO(Section 10.2) */
  onAddWater?: (oz: number) => void;
}

export function WaterTracker({ summary, onAddWater }: WaterTrackerProps): React.ReactElement {
  const fraction = Math.min(1, summary.totalOz / Math.max(1, summary.goalOz));
  const barColor = summary.percentComplete >= 100 ? '#1D4ED8' : '#60A5FA';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Water</Text>
        <Text style={styles.numbers}>
          {summary.totalOz} / {summary.goalOz} oz
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.track}>
        {/* TODO(Section 10.2) - animate fill with react-native-reanimated */}
        <View style={[styles.fill, { width: `${Math.round(fraction * 100)}%`, backgroundColor: barColor }]} />
      </View>

      {/* Preset buttons - Section 10.2 */}
      <View style={styles.presets}>
        {PRESETS_OZ.map((oz) => (
          <TouchableOpacity
            key={oz}
            style={styles.presetBtn}
            onPress={() => onAddWater?.(oz)}
            activeOpacity={0.7}
          >
            <Text style={styles.presetText}>+{oz}oz</Text>
          </TouchableOpacity>
        ))}
        {/* TODO(Section 10.2) - custom amount input (remembers last custom value as 5th option) */}
        <TouchableOpacity style={[styles.presetBtn, styles.customBtn]} activeOpacity={0.7}>
          <Text style={styles.customText}>Custom</Text>
        </TouchableOpacity>
      </View>

      {summary.remainingOz > 0 && (
        <Text style={styles.remaining}>{summary.remainingOz} oz remaining</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    padding: 14,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    marginVertical: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  numbers: {
    fontSize: 14,
    color: '#1D4ED8',
    fontWeight: '500',
  },
  track: {
    height: 10,
    backgroundColor: '#BFDBFE',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
  presets: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  presetBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  presetText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  customBtn: {
    backgroundColor: '#93C5FD',
  },
  customText: {
    color: '#1E3A5F',
    fontSize: 13,
    fontWeight: '600',
  },
  remaining: {
    marginTop: 8,
    fontSize: 12,
    color: '#1D4ED8',
  },
});
