// ============================================================
// HealthKit sync - Section 9
// Real Apple HealthKit reads via react-native-health. Reads active energy,
// steps, latest body weight, and workouts (incl. Apple Watch) for a given day.
// Requires the native module (npx expo run:ios after pod install) and the
// HealthKit entitlement; calls reject cleanly on non-iOS / unlinked builds.
// ============================================================

import { Platform } from 'react-native';
import AppleHealthKit, {
  type HealthKitPermissions,
  type HealthInputOptions,
  type HealthValue,
  type HKWorkoutQueriedSampleType,
  type AnchoredQueryResults,
} from 'react-native-health';
import type { WorkoutEntry } from '@/types';

const P = AppleHealthKit.Constants.Permissions;

/** Read scopes we ask Apple Health for (Section 9.2). */
export const HEALTHKIT_PERMISSIONS: HealthKitPermissions = {
  permissions: {
    read: [
      P.ActiveEnergyBurned,
      P.BasalEnergyBurned,
      P.StepCount,
      P.Steps,
      P.Weight,
      P.Workout,
      P.HeartRate,
      P.MenstrualFlow, // cycle tracking (e.g. period data Clue writes to Apple Health)
    ],
    write: [P.Weight, P.Water],
  },
};

/** True only on iOS with the native module actually linked into the build. */
function isLinked(): boolean {
  return Platform.OS === 'ios' && typeof AppleHealthKit.initHealthKit === 'function';
}

function notLinkedError(): Error {
  return new Error(
    'HealthKit unavailable: needs an iOS build with react-native-health linked ' +
      '(run `npx expo run:ios` after `pod install`).',
  );
}

/** Whole-day [00:00, 23:59:59.999] bounds for a date, as ISO strings. */
function dayBounds(date: Date): { startDate: string; endDate: string } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

/** "FunctionalStrengthTraining" -> "Functional Strength Training". */
function prettifyActivity(name: string): string {
  if (!name) return 'Workout';
  return name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').trim();
}

/**
 * Request HealthKit read/write permissions (Section 9.2).
 * Safe to call repeatedly — iOS returns the existing grant without re-prompting.
 * @throws if not on a linked iOS build, or if the user denies access.
 */
export function requestPermissions(): Promise<void> {
  if (!isLinked()) return Promise.reject(notLinkedError());
  return new Promise((resolve, reject) => {
    AppleHealthKit.initHealthKit(HEALTHKIT_PERMISSIONS, (error: string) => {
      if (error) reject(new Error(`HealthKit permission error: ${error}`));
      else resolve();
    });
  });
}

/** Total active energy burned (kcal) for a day (Section 9.3). */
export function getActiveCaloriesForDay(date: Date): Promise<number> {
  if (!isLinked()) return Promise.reject(notLinkedError());
  const options: HealthInputOptions = dayBounds(date);
  return new Promise((resolve, reject) => {
    AppleHealthKit.getActiveEnergyBurned(
      options,
      (err: string, results: HealthValue[]) => {
        if (err) return reject(new Error(`getActiveEnergyBurned: ${err}`));
        const total = (results ?? []).reduce((sum, r) => sum + (r.value || 0), 0);
        resolve(Math.round(total));
      },
    );
  });
}

/** Step count for a day (Section 9.5). */
export function getStepsForDay(date: Date): Promise<number> {
  if (!isLinked()) return Promise.reject(notLinkedError());
  const { startDate, endDate } = dayBounds(date);
  const options: HealthInputOptions = { startDate, endDate, date: startDate };
  return new Promise((resolve, reject) => {
    AppleHealthKit.getStepCount(options, (err: string, results: HealthValue) => {
      if (err) return reject(new Error(`getStepCount: ${err}`));
      resolve(Math.round(results?.value ?? 0));
    });
  });
}

/** Most recent body weight in pounds, or null if none recorded (Section 9.5). */
export function getMostRecentWeight(): Promise<number | null> {
  if (!isLinked()) return Promise.reject(notLinkedError());
  return new Promise((resolve) => {
    AppleHealthKit.getLatestWeight(
      { unit: 'pound' as HealthInputOptions['unit'] },
      (err: string, results: HealthValue) => {
        if (err) return resolve(null); // no weight samples is not an error
        resolve(results?.value != null ? Math.round(results.value * 10) / 10 : null);
      },
    );
  });
}

/** Workouts for a day, mapped to our WorkoutEntry shape (Section 9.4). */
export function getWorkoutsForDay(date: Date): Promise<WorkoutEntry[]> {
  if (!isLinked()) return Promise.reject(notLinkedError());
  const dateStr = date.toISOString().slice(0, 10);
  const options: HealthInputOptions = {
    ...dayBounds(date),
    type: 'Workout' as HealthInputOptions['type'],
  };
  return new Promise((resolve, reject) => {
    AppleHealthKit.getAnchoredWorkouts(
      options,
      (err: unknown, results: AnchoredQueryResults) => {
        if (err) return reject(new Error(`getAnchoredWorkouts: ${String(err)}`));
        const samples: HKWorkoutQueriedSampleType[] = results?.data ?? [];
        const workouts: WorkoutEntry[] = samples.map((w) => ({
          id: w.id,
          date: dateStr,
          type: prettifyActivity(w.activityName),
          durationMinutes: Math.round((w.duration || 0) / 60),
          caloriesBurned: w.calories != null ? Math.round(w.calories) : null,
          avgHeartRate: null, // not on the workout sample; needs a separate HR query
          source: /watch/i.test(w.sourceName || '') ? 'apple_watch' : 'iphone',
          notes: '',
        }));
        resolve(workouts);
      },
    );
  });
}

export interface HealthDaySync {
  activeCalories: number;
  steps: number;
  weightLbs: number | null;
  workouts: WorkoutEntry[];
}

/**
 * Full daily read: active calories, steps, latest weight, and workouts.
 * Requests permissions first, then reads everything in parallel (Section 9.6).
 */
export async function syncHealthKitForDay(date: Date): Promise<HealthDaySync> {
  await requestPermissions();
  const [activeCalories, steps, weightLbs, workouts] = await Promise.all([
    getActiveCaloriesForDay(date),
    getStepsForDay(date),
    getMostRecentWeight(),
    getWorkoutsForDay(date),
  ]);
  return { activeCalories, steps, weightLbs, workouts };
}
