// ============================================================
// MicronutrientRow - always-visible chip strip (PRD Section 5.3).
// Iron / Calcium / Magnesium / Zinc with red-flag thresholds.
// White chips, soft warm shadow, state-colored values + mini bars.
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { tokens, font, type, radius, shadow } from '@/theme/tokens';

interface MicroItem {
  label: string;
  short: string;
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
  { label: 'Iron', short: 'Iron', target: 18, redThreshold: 15, unit: 'mg' },
  { label: 'Calcium', short: 'Calc', target: 1000, redThreshold: 800, unit: 'mg' },
  { label: 'Magnesium', short: 'Mag', target: 310, redThreshold: 250, unit: 'mg' },
  { label: 'Zinc', short: 'Zinc', target: 8, redThreshold: 6, unit: 'mg' },
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
  const color = isFlagged ? tokens.stateUnder : tokens.stateOnTrack;

  return (
    <View
      style={styles.chip}
      accessible
      accessibilityLabel={`${item.label}, ${item.consumed} of ${item.target} milligrams${isFlagged ? ', low' : ''}`}
    >
      <Text style={[styles.chipVal, { color }]}>
        {item.consumed}
        <Text style={styles.chipUnit}>{item.unit}</Text>
      </Text>
      <Text style={styles.chipKey}>{item.short}</Text>
      <View style={styles.miniTrack}>
        <View style={[styles.miniFill, { width: `${Math.round(fraction * 100)}%`, backgroundColor: color }]} />
      </View>
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
    <View style={styles.strip}>
      {micros.map((m) => (
        <MicroCell key={m.label} item={m} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    backgroundColor: tokens.surface,
    borderRadius: radius.chip,
    paddingVertical: 9,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 2,
    ...shadow.card,
  },
  chipVal: {
    fontFamily: font.numeric,
    fontSize: type.body,
  },
  chipUnit: {
    fontFamily: font.numeric,
    fontSize: 9,
    color: tokens.inkFaint,
  },
  chipKey: {
    fontFamily: font.body,
    fontSize: 9.5,
    color: tokens.inkFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  miniTrack: {
    width: '80%',
    height: 3,
    backgroundColor: tokens.track,
    borderRadius: 2,
    marginTop: 3,
    overflow: 'hidden',
  },
  miniFill: {
    height: '100%',
    borderRadius: 2,
  },
});
