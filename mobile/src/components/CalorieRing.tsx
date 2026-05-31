// ============================================================
// CalorieRing - the hero (PRD Section 5.1 / 21.5).
// Inverted ring: center = calories STILL NEEDED.
// Real animated Skia arc. State color by calories remaining, with
// the "morning rule": red is suppressed before 13:00 so a near-empty
// ring reads as opportunity, not deficit.
// ============================================================

import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import {
  useSharedValue,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated';
import { Moon } from '@/theme/icons';
import { tokens, font, type, space, radius } from '@/theme/tokens';

interface CalorieRingProps {
  /** Target calories for the day (after luteal adjustment). */
  target: number;
  /** Calories consumed so far today. */
  consumed: number;
  /** Active calories burned today (shown in the stat row). */
  burned?: number;
  /** Whether we are currently in the luteal phase (shows badge). */
  isLuteal?: boolean;
  /** Adjusted target label shown when luteal (e.g. "+200 cal, +12g protein"). */
  lutealLabel?: string;
}

const RING_SIZE = 200;
const STROKE = 16;
const R = 84;
const CX = 100;
const CY = 100;

const fmt = (n: number): string => Math.round(n).toLocaleString('en-US');

/**
 * State color by calories remaining (the inverted logic). The morning rule
 * (PRD 21.9): before 13:00, the red "you are under" state is suppressed in
 * favor of a warm terracotta arc, framed as a fresh start.
 */
function ringColor(remaining: number, hour: number): string {
  if (remaining <= 0) return tokens.stateHit; // blue - surplus hit
  if (remaining <= 200) return tokens.stateOnTrack; // green - on track
  if (remaining <= 500) return tokens.stateClose; // amber - getting close
  if (hour < 13) return tokens.accent; // morning rule: warm-neutral, not red
  return tokens.stateUnder; // red - significantly under
}

export function CalorieRing({
  target,
  consumed,
  burned,
  isLuteal = false,
  lutealLabel,
}: CalorieRingProps): React.ReactElement {
  const remaining = target - consumed;
  const hour = new Date().getHours();
  const color = ringColor(remaining, hour);
  const fraction = Math.min(1, consumed / Math.max(1, target));
  const progressPct = Math.round(fraction * 100);
  const isFreshStart = consumed === 0 && hour < 13; // align with morning rule in ringColor

  // Full-circle path, drawn from 12 o'clock clockwise. The progress arc is the
  // same path trimmed to `progress` (0..1).
  const circlePath = useMemo(() => {
    const p = Skia.Path.Make();
    p.addArc(Skia.XYWHRect(CX - R, CY - R, R * 2, R * 2), -90, 360);
    return p;
  }, []);

  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = fraction;
    } else {
      progress.value = withSpring(fraction, {
        damping: 16,
        stiffness: 90,
        mass: 0.7,
      });
    }
  }, [fraction, reduceMotion, progress]);

  const a11yLabel =
    `${fmt(Math.max(0, remaining))} calories still needed, ` +
    `${progressPct} percent of ${fmt(target)} eaten`;

  return (
    <View style={styles.wrapper}>
      {isLuteal && (
        <View style={styles.lutealBadge}>
          <Moon size={13} color={tokens.luteal} strokeWidth={2} />
          <Text style={styles.lutealText}>
            Luteal{lutealLabel ? ` · ${lutealLabel}` : ''}
          </Text>
        </View>
      )}

      <View style={styles.ringPos}>
        <Canvas style={{ width: RING_SIZE, height: RING_SIZE }}>
          <Path
            path={circlePath}
            style="stroke"
            strokeWidth={STROKE}
            strokeCap="round"
            color={tokens.track}
          />
          <Path
            path={circlePath}
            style="stroke"
            strokeWidth={STROKE}
            strokeCap="round"
            color={color}
            start={0}
            end={progress}
          />
        </Canvas>

        <View
          style={styles.ringCenter}
          accessible
          accessibilityRole="text"
          accessibilityLabel={a11yLabel}
        >
          <Text style={[styles.ringNumber, { color }]} numberOfLines={1} adjustsFontSizeToFit>
            {fmt(Math.max(0, remaining))}
          </Text>
          <Text style={styles.ringLabel}>cal still needed</Text>
          <Text style={styles.ringPct}>
            {progressPct}% of {fmt(target)} eaten
          </Text>
          {isFreshStart && (
            <Text style={styles.freshStart}>Fresh start. Let's fuel up.</Text>
          )}
        </View>
      </View>

      <View style={styles.stats}>
        <Stat label="eaten" value={fmt(consumed)} />
        <Stat label="target" value={fmt(target)} />
        {burned != null && <Stat label="burned" value={fmt(burned)} />}
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statKey}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  lutealBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: tokens.lutealBg,
    borderRadius: radius.badge,
    paddingHorizontal: 11,
    paddingVertical: 5,
    marginBottom: space.md,
  },
  lutealText: {
    fontFamily: font.bodyBold,
    fontSize: type.caption,
    color: tokens.luteal,
  },
  ringPos: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 170,
    paddingHorizontal: 6,
  },
  ringNumber: {
    fontFamily: font.displayBold,
    fontSize: type.ringNumber,
    lineHeight: type.ringNumber + 2,
    letterSpacing: -1.5,
  },
  ringLabel: {
    fontFamily: font.body,
    fontSize: type.label,
    color: tokens.inkMuted,
    marginTop: 4,
  },
  ringPct: {
    fontFamily: font.numeric,
    fontSize: type.caption,
    color: tokens.inkFaint,
    marginTop: 2,
  },
  freshStart: {
    fontFamily: font.body,
    fontSize: type.label,
    color: tokens.accent,
    marginTop: 6,
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    gap: space.xl,
    marginTop: space.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: font.display,
    fontSize: type.statValue,
    color: tokens.ink,
  },
  statKey: {
    fontFamily: font.body,
    fontSize: 10,
    color: tokens.inkFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 1,
  },
});
