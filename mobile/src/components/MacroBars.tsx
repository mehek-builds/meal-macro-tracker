// ============================================================
// MacroBars - Section 5
// Three progress bars: Protein / Carbs / Fat.
// Color logic: red = under target (surplus app), NOT over.
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MacroBarProps {
  label: string;
  consumed: number;
  target: number;
  unit?: string;
}

/** Color = same logic as CalorieRing. Red means still short, not over. */
function barColor(consumed: number, target: number): string {
  const remaining = target - consumed;
  if (remaining <= 0) return '#3B82F6';   // blue - hit
  if (remaining <= target * 0.1) return '#22C55E'; // green - within 10%
  if (remaining <= target * 0.25) return '#EAB308'; // yellow
  return '#EF4444';                        // red - significantly under
}

function MacroBar({ label, consumed, target, unit = 'g' }: MacroBarProps): React.ReactElement {
  const fraction = Math.min(1, consumed / Math.max(1, target));
  const color = barColor(consumed, target);

  return (
    <View style={styles.macroRow}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.values}>
          {Math.round(consumed)}{unit} / {target}{unit}
        </Text>
      </View>
      <View style={styles.track}>
        {/* TODO(Section 5) - animate with react-native-reanimated Animated.Value */}
        <View style={[styles.fill, { width: `${Math.round(fraction * 100)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

interface MacroBarsProps {
  protein: { consumed: number; target: number };
  carbs: { consumed: number; target: number };
  fat: { consumed: number; target: number };
}

export function MacroBars({ protein, carbs, fat }: MacroBarsProps): React.ReactElement {
  return (
    <View style={styles.container}>
      <MacroBar label="Protein" consumed={protein.consumed} target={protein.target} />
      <MacroBar label="Carbs" consumed={carbs.consumed} target={carbs.target} />
      <MacroBar label="Fat" consumed={fat.consumed} target={fat.target} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 10,
    marginVertical: 8,
  },
  macroRow: {
    gap: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  values: {
    fontSize: 12,
    color: '#6B7280',
  },
  track: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
