// ============================================================
// MacroBars - Protein / Carbs / Fat (PRD Section 5.2).
// Inverted color logic: red = still under target (this is a
// surplus app), blue = hit. Fills animate with Reanimated.
// ============================================================

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated';
import { tokens, font, type, space } from '@/theme/tokens';

interface MacroBarProps {
  label: string;
  consumed: number;
  target: number;
  unit?: string;
}

/** Same inverted logic as CalorieRing. Red means still short, not over. */
function barColor(consumed: number, target: number): string {
  const remaining = target - consumed;
  if (remaining <= 0) return tokens.stateHit; // blue - hit
  if (remaining <= target * 0.1) return tokens.stateOnTrack; // green - within 10%
  if (remaining <= target * 0.25) return tokens.stateClose; // amber
  return tokens.stateUnder; // red - significantly under
}

function MacroBar({ label, consumed, target, unit = 'g' }: MacroBarProps): React.ReactElement {
  const fraction = Math.min(1, consumed / Math.max(1, target));
  const color = barColor(consumed, target);

  const reduceMotion = useReducedMotion();
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = reduceMotion
      ? fraction
      : withSpring(fraction, { damping: 18, stiffness: 110, mass: 0.6 });
  }, [fraction, reduceMotion, w]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));

  return (
    <View
      style={styles.macroRow}
      accessible
      accessibilityLabel={`${label}, ${Math.round(consumed)} of ${target} ${unit === 'g' ? 'grams' : unit}`}
    >
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.values}>
          {Math.round(consumed)} / {target} {unit}
        </Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fillStyle, { backgroundColor: color }]} />
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
    gap: 11,
  },
  macroRow: {
    gap: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: font.body,
    fontSize: type.label,
    color: tokens.ink,
  },
  values: {
    fontFamily: font.numeric,
    fontSize: type.label,
    color: tokens.inkMuted,
  },
  track: {
    height: 7,
    backgroundColor: tokens.track,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
