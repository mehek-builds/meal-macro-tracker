// ============================================================
// ExerciseLog - Section 5 (exercise section on dashboard)
// Shows active calories burned + workout list.
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { WorkoutEntry } from '@/types';

interface ExerciseLogProps {
  activeCaloriesBurned: number;
  workouts: WorkoutEntry[];
}

export function ExerciseLog({ activeCaloriesBurned, workouts }: ExerciseLogProps): React.ReactElement {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Exercise</Text>
        <Text style={styles.calBurned}>{activeCaloriesBurned} cal burned</Text>
      </View>

      {workouts.length === 0 ? (
        <Text style={styles.empty}>
          No workouts logged today. Apple Watch workouts sync automatically via HealthKit.
          {/* TODO(Section 9.5) - manual workout entry fallback */}
        </Text>
      ) : (
        workouts.map((w) => (
          <View key={w.id} style={styles.workoutRow}>
            <View style={styles.workoutInfo}>
              <Text style={styles.workoutType}>{w.type}</Text>
              <Text style={styles.workoutMeta}>
                {w.durationMinutes} min
                {w.avgHeartRate != null ? ` · ${w.avgHeartRate} bpm avg` : ''}
                {' · '}
                <Text style={styles.source}>{w.source === 'apple_watch' ? 'Apple Watch' : w.source === 'manual' ? 'Manual' : 'iPhone'}</Text>
              </Text>
            </View>
            <Text style={styles.workoutCal}>{w.caloriesBurned} cal</Text>
          </View>
        ))
      )}

      {/* TODO(Section 9.5) - "Log workout manually" button */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    padding: 14,
    backgroundColor: '#F0FDF4',
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
    color: '#14532D',
  },
  calBurned: {
    fontSize: 14,
    color: '#16A34A',
    fontWeight: '500',
  },
  empty: {
    fontSize: 13,
    color: '#6B7280',
  },
  workoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#DCFCE7',
  },
  workoutInfo: {
    flex: 1,
  },
  workoutType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  workoutMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  source: {
    color: '#9CA3AF',
  },
  workoutCal: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
});
