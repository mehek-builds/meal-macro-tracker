// ============================================================
// Cycle state - Section 11
//
// IMPORTANT: react-native-health (v1.18) exposes NO menstrual-flow read API —
// HKCategoryTypeIdentifierMenstrualFlow is not in its Permissions enum and there
// is no getMenstrualFlowSamples method. So cycle/period data (including anything
// Clue writes to Apple Health) cannot be read through this library.
//
// The app's real cycle state therefore comes from manual entry via the backend
// (POST /cycle/manual -> GET /cycle/state), surfaced through the Zustand store.
// This module returns an "unknown" state so callers degrade gracefully; it does
// NOT read HealthKit. To read menstrual flow natively you'd need a HealthKit lib
// that supports category samples (e.g. @kingstinct/react-native-healthkit).
// ============================================================

import type { CycleState } from '@/types';

/**
 * Returns an "unknown" cycle state. See the file header: this library cannot
 * read menstrual flow, so cycle data is sourced from manual backend entry, not
 * from here. Kept for API compatibility with callers expecting a CycleState.
 */
export async function getCycleState(): Promise<CycleState> {
  return {
    cycleDay: 0,
    phase: 'unknown',
    lastPeriodStart: null,
    estimatedCycleLength: 28,
    nearOvulation: false,
    lutealCalorieBonus: 0,
    lutealProteinBonus: 0,
  };
}

/**
 * Return the luteal-phase calorie and protein bonuses to add to daily targets.
 * Returns zeros when phase is unknown or follicular (Section 11.4).
 */
export function getLutealAdjustment(state: CycleState): {
  calorieBonus: number;
  proteinBonus: number;
} {
  if (state.phase !== 'luteal') return { calorieBonus: 0, proteinBonus: 0 };
  return {
    calorieBonus: state.lutealCalorieBonus,
    proteinBonus: state.lutealProteinBonus,
  };
}
