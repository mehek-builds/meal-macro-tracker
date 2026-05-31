// ============================================================
// MicronutrientRow - Section 5
// Always visible (not collapsed).
// Iron / Calcium / Magnesium / Zinc with red flag thresholds.
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MicroItem {
  label: string;
  consumed: number;
  target: number;
  redThreshold: number; // flagged red below this value
  unit: string;
}

/** Targets from Section 5:
 *  Iron 18mg (red < 15), Calcium 1000mg (red < 800),
 *  Magnesium 310mg (red < 250), Zinc 8mg (red < 6).
 */
const DEFAULT_MICROS: Omit<MicroItem, 'consumed'>[] = [
  { label: 'Iron', target: 18, redThreshold: 15, unit: 'mg' },
  { label: 'Calcium', target: 1000, redThreshold: 800, unit: 'mg' },
  { label: 'Magnesium', target: 310, redThreshold: 250, unit: 'mg' },
  { label: 'Zinc', target: 8, redThreshold: 6, unit: 'mg' },
];

interface MicronutrientRowProps {
  iron_mg?: number;
  calcium_mg?: number;
  magnesium_mg?: number;
  zinc_mg?: number;
}

function MicroCell({ item }: { item: MicroItem }): React.ReactElement {
  const isFlagged = item.consumed < item.redThreshold;
  const fraction = Math.min(1, item.consumed / item.target);
  const color = isFlagged ? '#EF4444' : '#22C55E';

  return (
    <View style={styles.cell}>
      <Text style={[styles.microLabel, isFlagged && styles.redLabel]}>
        {item.label}
      </Text>
      <Text style={[styles.microValue, { color }]}>
        {item.consumed.toFixed(1)}{item.unit}
      </Text>
      <View style={styles.miniTrack}>
        <View style={[styles.miniFill, { width: `${Math.round(fraction * 100)}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.microTarget}>/ {item.target}{item.unit}</Text>
    </View>
  );
}

export function MicronutrientRow({
  iron_mg = 0,
  calcium_mg = 0,
  magnesium_mg = 0,
  zinc_mg = 0,
}: MicronutrientRowProps): React.ReactElement {
  const micros: MicroItem[] = [
    { ...DEFAULT_MICROS[0], consumed: iron_mg },
    { ...DEFAULT_MICROS[1], consumed: calcium_mg },
    { ...DEFAULT_MICROS[2], consumed: magnesium_mg },
    { ...DEFAULT_MICROS[3], consumed: zinc_mg },
  ];

  return (
    <View style={styles.container}>
      {/* TODO(Section 5) - secondary row (Fiber, Sodium, B12, Vitamin D) added via swipe/collapse */}
      {micros.map((m) => (
        <MicroCell key={m.label} item={m} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    marginHorizontal: 16,
    borderRadius: 10,
    marginVertical: 6,
  },
  cell: {
    alignItems: 'center',
    flex: 1,
  },
  microLabel: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
  },
  redLabel: {
    color: '#EF4444',
  },
  microValue: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  miniTrack: {
    width: '80%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginTop: 3,
    overflow: 'hidden',
  },
  miniFill: {
    height: '100%',
    borderRadius: 2,
  },
  microTarget: {
    fontSize: 9,
    color: '#9CA3AF',
    marginTop: 2,
  },
});
