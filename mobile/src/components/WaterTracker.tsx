// ============================================================
// WaterTracker - hydration card (PRD Section 5.5).
// White card (no blue island). Fill is accent-tinted until the
// goal is hit, then calm blue (stateHit = success). Fill animates.
// ============================================================

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated';
import type { WaterSummary } from '@/types';
import { Droplet } from '@/theme/icons';
import { tokens, font, type, radius, space, shadow } from '@/theme/tokens';

const PRESETS_OZ: number[] = [8, 12, 16, 20];

interface WaterTrackerProps {
  summary: WaterSummary;
  onAddWater?: (oz: number) => void;
}

export function WaterTracker({ summary, onAddWater }: WaterTrackerProps): React.ReactElement {
  const fraction = Math.min(1, summary.totalOz / Math.max(1, summary.goalOz));
  const isFull = summary.percentComplete >= 100;
  const fillColor = isFull ? tokens.stateHit : tokens.accent;

  const reduceMotion = useReducedMotion();
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = reduceMotion
      ? fraction
      : withSpring(fraction, { damping: 18, stiffness: 110, mass: 0.6 });
  }, [fraction, reduceMotion, w]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Droplet size={16} color={tokens.accent} strokeWidth={2} />
          <Text style={styles.title}>Water</Text>
        </View>
        <Text style={styles.numbers}>
          {summary.totalOz} / {summary.goalOz} oz
        </Text>
      </View>

      <View style={styles.track}>
        <Animated.View style={[styles.fill, fillStyle, { backgroundColor: fillColor }]} />
      </View>

      <View style={styles.presets}>
        {PRESETS_OZ.map((oz) => (
          <TouchableOpacity
            key={oz}
            style={styles.presetBtn}
            onPress={() => onAddWater?.(oz)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Add ${oz} ounces of water`}
          >
            <Text style={styles.presetText}>+{oz}oz</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.presetBtn} activeOpacity={0.7} accessibilityRole="button">
          <Text style={styles.presetText}>Custom</Text>
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
    backgroundColor: tokens.surface,
    borderRadius: radius.card,
    padding: space.md,
    ...shadow.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontFamily: font.bodyBold,
    fontSize: type.body,
    color: tokens.ink,
  },
  numbers: {
    fontFamily: font.numeric,
    fontSize: 13,
    color: tokens.inkMuted,
  },
  track: {
    height: 10,
    backgroundColor: tokens.track,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 12,
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
    backgroundColor: tokens.accentSoft,
    borderRadius: radius.chip,
    paddingHorizontal: 14,
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetText: {
    fontFamily: font.bodyBold,
    fontSize: 13,
    color: tokens.accent,
  },
  remaining: {
    fontFamily: font.body,
    fontSize: 12,
    color: tokens.inkMuted,
    marginTop: 10,
  },
});
