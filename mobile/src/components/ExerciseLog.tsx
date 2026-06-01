// ============================================================
// ExerciseLog - exercise summary card (PRD Section 5.6).
// White card (no green island). Active calories + workout list.
// Empty state offers a warm "Connect Apple Watch" CTA and a manual
// log option instead of a cold message (PRD Section 7).
// ============================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { WorkoutEntry } from '@/types';
import { Activity } from '@/theme/icons';
import { tokens, font, type, radius, space, shadow } from '@/theme/tokens';

interface ExerciseLogProps {
  activeCaloriesBurned: number;
  workouts: WorkoutEntry[];
  /** Trigger an Apple Health sync (request permissions + read today's data). */
  onConnectAppleWatch?: () => void;
  /** True while a HealthKit read is in flight. */
  syncing?: boolean;
  /** Non-null when the last sync failed (e.g. permission denied). */
  errorText?: string | null;
}

export function ExerciseLog({
  activeCaloriesBurned,
  workouts,
  onConnectAppleWatch,
  syncing = false,
  errorText = null,
}: ExerciseLogProps): React.ReactElement {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Activity size={16} color={tokens.accent} strokeWidth={2} />
          <Text style={styles.title}>Exercise</Text>
        </View>
        <Text style={styles.calBurned}>{activeCaloriesBurned} cal burned</Text>
      </View>

      {workouts.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.empty}>No workouts logged yet today.</Text>
          <TouchableOpacity
            style={styles.connectBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            disabled={syncing}
            onPress={onConnectAppleWatch}
          >
            <Activity size={15} color={tokens.accent} strokeWidth={2} />
            <Text style={styles.connectText}>
              {syncing ? 'Syncing with Apple Health…' : 'Connect Apple Watch'}
            </Text>
          </TouchableOpacity>
          {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
          <TouchableOpacity style={styles.manualBtn} activeOpacity={0.7} accessibilityRole="button">
            <Text style={styles.manualText}>Log workout manually</Text>
          </TouchableOpacity>
        </View>
      ) : (
        workouts.map((w) => (
          <View key={w.id} style={styles.workoutRow}>
            <View style={styles.workoutInfo}>
              <Text style={styles.workoutType}>{w.type}</Text>
              <Text style={styles.workoutMeta}>
                {w.durationMinutes} min
                {w.avgHeartRate != null ? ` · ${w.avgHeartRate} bpm avg` : ''}
                {' · '}
                {w.source === 'apple_watch' ? 'Apple Watch' : w.source === 'manual' ? 'Manual' : 'iPhone'}
              </Text>
            </View>
            <Text style={styles.workoutCal}>{w.caloriesBurned} cal</Text>
          </View>
        ))
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
    marginBottom: 8,
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
  calBurned: {
    fontFamily: font.numeric,
    fontSize: 13,
    color: tokens.inkMuted,
  },
  emptyWrap: {
    gap: 10,
  },
  empty: {
    fontFamily: font.body,
    fontSize: 13,
    color: tokens.inkMuted,
  },
  errorText: {
    fontFamily: font.body,
    fontSize: 12,
    color: tokens.stateUnder,
    textAlign: 'center',
  },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: tokens.accentSoft,
    borderRadius: radius.chip,
    paddingHorizontal: 14,
    minHeight: 44,
  },
  connectText: {
    fontFamily: font.bodyBold,
    fontSize: 13,
    color: tokens.accent,
  },
  manualBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  manualText: {
    fontFamily: font.bodyBold,
    fontSize: 13,
    color: tokens.accent,
  },
  workoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: tokens.border,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutType: {
    fontFamily: font.body,
    fontSize: type.body,
    color: tokens.ink,
  },
  workoutMeta: {
    fontFamily: font.body,
    fontSize: 12,
    color: tokens.inkFaint,
    marginTop: 2,
  },
  workoutCal: {
    fontFamily: font.numeric,
    fontSize: 13,
    color: tokens.inkMuted,
  },
});
