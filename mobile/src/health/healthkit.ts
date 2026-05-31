// ============================================================
// HealthKit sync stubs - Section 9
// Each function mirrors the PRD spec signatures but returns mock data
// or throws until react-native-health is linked in a bare/native build.
// ============================================================

import type { WorkoutEntry } from '@/types';

/** Mock active calories for UI development (Section 9.3). */
const MOCK_ACTIVE_CALORIES = 380;
/** Mock steps for UI development (Section 9.5). */
const MOCK_STEPS = 7432;
/** Mock weight in lbs for UI development (Section 9.5). */
const MOCK_WEIGHT_LBS = 92.6; // ~42 kg

/** Mock workouts for UI development (Section 9.4). */
const MOCK_WORKOUTS: WorkoutEntry[] = [
  {
    id: 'mock-workout-1',
    type: 'Functional Strength Training',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    durationMinutes: 45,
    caloriesBurned: 220,
    avgHeartRate: 128,
    source: 'apple_watch',
  },
];

/**
 * Request HealthKit permissions for read/write access.
 * TODO(Section 9.2) - real implementation uses AppleHealthKit.initHealthKit().
 *
 * @throws {Error} In this stub always — native module not linked.
 */
export async function requestPermissions(): Promise<void> {
  // TODO(Section 9.2) - implement:
  // import AppleHealthKit from 'react-native-health';
  // return new Promise((resolve, reject) => {
  //   AppleHealthKit.initHealthKit(HEALTHKIT_PERMISSIONS, (err) => err ? reject(err) : resolve());
  // });
  throw new Error(
    'HealthKit: react-native-health native module not linked. ' +
      'Run `npx expo run:ios` in a bare workflow.',
  );
}

/**
 * Get total active calories burned for a given date.
 * TODO(Section 9.3) - real implementation queries AppleHealthKit.getActiveEnergyBurned().
 * Returns mock value in this stub.
 */
export async function getActiveCaloriesForDay(date: Date): Promise<number> {
  // TODO(Section 9.3) - replace with real HealthKit query
  console.warn('[HealthKit stub] getActiveCaloriesForDay called with', date.toISOString());
  return MOCK_ACTIVE_CALORIES;
}

/**
 * Get all workouts for a given date.
 * TODO(Section 9.4) - real implementation queries AppleHealthKit.getSamples({ type: 'Workout' }).
 * Returns mock workouts in this stub.
 */
export async function getWorkoutsForDay(date: Date): Promise<WorkoutEntry[]> {
  // TODO(Section 9.4) - replace with real HealthKit query
  console.warn('[HealthKit stub] getWorkoutsForDay called with', date.toISOString());
  return MOCK_WORKOUTS;
}

/**
 * Get step count for a given date.
 * TODO(Section 9.5) - real implementation queries AppleHealthKit.getStepCount().
 * Returns mock value in this stub.
 */
export async function getStepsForDay(date: Date): Promise<number> {
  // TODO(Section 9.5) - replace with real HealthKit query
  console.warn('[HealthKit stub] getStepsForDay called with', date.toISOString());
  return MOCK_STEPS;
}

/**
 * Get the most recently logged body weight in lbs.
 * TODO(Section 9.5) - real implementation queries AppleHealthKit.getLatestWeight().
 * Returns mock value in this stub.
 */
export async function getMostRecentWeight(): Promise<number | null> {
  // TODO(Section 9.5) - replace with real HealthKit query
  console.warn('[HealthKit stub] getMostRecentWeight called');
  return MOCK_WEIGHT_LBS;
}

/**
 * Full daily sync: fetch active calories, workouts, steps, and weight,
 * then POST to the backend /exercise/sync endpoint.
 * TODO(Section 9.6) - replace individual calls with real HealthKit queries.
 */
export async function syncHealthKitForDay(
  date: Date,
): Promise<{ activeCalories: number; workouts: WorkoutEntry[]; steps: number }> {
  // TODO(Section 9.6) - replace with real HealthKit queries, then POST to backend
  const [activeCalories, workouts, steps] = await Promise.all([
    getActiveCaloriesForDay(date),
    getWorkoutsForDay(date),
    getStepsForDay(date),
  ]);

  console.warn(
    '[HealthKit stub] syncHealthKitForDay - skipping POST /exercise/sync (stub mode)',
  );

  return { activeCalories, workouts, steps };
}
