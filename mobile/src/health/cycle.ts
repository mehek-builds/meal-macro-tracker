// ============================================================
// Cycle state - Section 11
//
// Reads real menstrual-flow samples from Apple Health (including period data
// written by Clue) via our patched react-native-health getMenstrualFlowSamples,
// then derives cycle day / phase / luteal adjustments. Mirrors the backend
// cycle service so HealthKit-derived state matches manual-entry state.
//
// Requires the MenstrualFlow read scope (granted in healthkit.ts permissions)
// and the native build that includes the menstrual-flow patch. Degrades to an
// "unknown" state on non-iOS / unlinked builds or when no period data exists.
// ============================================================

import { Platform } from 'react-native';
import AppleHealthKit, { type HealthInputOptions } from 'react-native-health';
import type { CycleState } from '@/types';

interface MenstrualSample {
  value: 'none' | 'unspecified' | 'light' | 'medium' | 'heavy';
  isCycleStart: boolean;
  startDate: string;
  endDate: string;
}

const UNKNOWN_STATE: CycleState = {
  cycleDay: 0,
  phase: 'unknown',
  lastPeriodStart: null,
  estimatedCycleLength: 28,
  nearOvulation: false,
  lutealCalorieBonus: 0,
  lutealProteinBonus: 0,
};

function isLinked(): boolean {
  return (
    Platform.OS === 'ios' &&
    typeof AppleHealthKit.getMenstrualFlowSamples === 'function'
  );
}

/** Whole calendar days between a and b in LOCAL time (b - a). */
function daysBetween(a: Date, b: Date): number {
  const a0 = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const b0 = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((b0.getTime() - a0.getTime()) / 86_400_000);
}

/** Local YYYY-MM-DD. Avoids toISOString()'s UTC shift, which moved a local
 *  midnight sample to the previous day for users east of UTC (e.g. +0400). */
function dayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Read menstrual-flow samples for the last ~180 days, oldest first. */
function getMenstrualSamples(): Promise<MenstrualSample[]> {
  if (!isLinked()) return Promise.resolve([]);
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 180);
  const options: HealthInputOptions = {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    ascending: true,
  };
  return new Promise((resolve) => {
    AppleHealthKit.getMenstrualFlowSamples(options, (err: string, results) => {
      if (err || !results) return resolve([]);
      resolve(results as MenstrualSample[]);
    });
  });
}

/**
 * Period-start dates (ascending). Prefers Apple Health's cycle-start metadata,
 * which Clue sets on the first day of each period; otherwise treats the first
 * bleeding day after a 1+ day gap as a start.
 */
function periodStartDates(samples: MenstrualSample[]): Date[] {
  const dedupByDay = (dates: Date[]): Date[] => {
    const seen = new Set<string>();
    const out: Date[] = [];
    for (const d of dates.sort((a, b) => a.getTime() - b.getTime())) {
      const key = dayKey(d);
      if (!seen.has(key)) {
        seen.add(key);
        out.push(d);
      }
    }
    return out;
  };

  const flagged = samples
    .filter((s) => s.isCycleStart)
    .map((s) => new Date(s.startDate));
  if (flagged.length > 0) return dedupByDay(flagged);

  // Fallback: starts of bleeding runs (a flow day with no flow the day before).
  const bleedDays = dedupByDay(
    samples.filter((s) => s.value !== 'none').map((s) => new Date(s.startDate)),
  );
  const starts: Date[] = [];
  let prev: Date | null = null;
  for (const d of bleedDays) {
    if (prev === null || daysBetween(prev, d) > 1) starts.push(d);
    prev = d;
  }
  return starts;
}

/**
 * Derive the current cycle state from Apple Health menstrual-flow data.
 * Returns an "unknown" state when there is no period data or HealthKit is
 * unavailable. Logic matches backend/app/services/cycle.py.
 */
export async function getCycleState(): Promise<CycleState> {
  const starts = periodStartDates(await getMenstrualSamples());
  if (starts.length === 0) return UNKNOWN_STATE;

  const lastStart = starts[starts.length - 1];
  const cycleDay = daysBetween(lastStart, new Date()) + 1; // day 1 = period start

  // Guard stale data: if the most recent period is more than ~45 days old, no
  // current cycle is being tracked in Apple Health, so we can't derive a phase
  // (avoids e.g. "cycle day 180 · luteal" off a months-old sample).
  if (cycleDay > 45) return UNKNOWN_STATE;

  let estimatedCycleLength = 28;
  if (starts.length >= 2) {
    const gap = daysBetween(starts[starts.length - 2], lastStart);
    if (gap >= 21 && gap <= 45) estimatedCycleLength = gap;
  }

  const ovulationDay = Math.floor(estimatedCycleLength / 2);
  const nearOvulation =
    cycleDay >= ovulationDay - 2 && cycleDay <= ovulationDay + 2;
  const isLuteal = cycleDay > ovulationDay;

  return {
    cycleDay,
    phase: isLuteal ? 'luteal' : 'follicular',
    lastPeriodStart: dayKey(lastStart),
    estimatedCycleLength,
    nearOvulation,
    lutealCalorieBonus: isLuteal ? 200 : 0,
    lutealProteinBonus: isLuteal ? 12 : 0,
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
