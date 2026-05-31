// ============================================================
// Cycle state stub - Section 11
// getCycleState() reads menstrual flow samples from HealthKit.
// Returns a mock CycleState in this stub until react-native-health
// is linked in a bare/native build.
// ============================================================

import type { CycleState } from '@/types';

/**
 * Derive the current menstrual cycle state from HealthKit data.
 *
 * Real implementation (Section 11.3):
 * - Reads AppleHealthKit.getMenstrualFlowSamples() for the past 90 days
 * - Finds most recent period start (HKMetadataKeyMenstrualCycleStart = true)
 * - Calculates cycle day, phase, and luteal adjustments
 * - Returns a CycleState object
 *
 * This stub returns a mock "unknown" state to keep UI development unblocked.
 * TODO(Section 11.3) - replace with real HealthKit query in bare workflow.
 */
export async function getCycleState(): Promise<CycleState> {
  // TODO(Section 11.3) - implement real HealthKit read:
  // import AppleHealthKit from 'react-native-health';
  // return new Promise((resolve) => {
  //   AppleHealthKit.getMenstrualFlowSamples({ ... }, (err, samples) => { ... });
  // });

  console.warn(
    '[Cycle stub] getCycleState - returning mock data. ' +
      'Link react-native-health in a bare build to enable real cycle reading.',
  );

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
