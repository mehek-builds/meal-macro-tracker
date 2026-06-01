// ============================================================
// Daily supplement schedule (Section 12)
//
// Sourced from the fitness vault — Mehek's active protocol as of 2026-05-31
// (fitness/bloodwork/2026-05-29-results.md + muscle-gain/marathon supplements
// docs). Doses and timing are taken verbatim; the critical iron <-> D3 / calcium
// / coffee 2-hour separation is encoded in the notes and the time-of-day order.
// ============================================================

export type SupplementTime = 'morning' | 'meal' | 'night';

export interface ScheduledSupplement {
  id: string;
  name: string;
  dose: string;
  time: SupplementTime;
  /** Local time for the daily reminder. */
  reminderHour: number;
  reminderMinute: number;
  /** Timing / interaction guidance shown under the row. */
  note: string;
}

export const TIME_LABEL: Record<SupplementTime, string> = {
  morning: 'Morning · empty stomach',
  meal: 'With your main (fattiest) meal',
  night: 'Before bed',
};

export const TIME_ORDER: SupplementTime[] = ['morning', 'meal', 'night'];

export const SUPPLEMENT_SCHEDULE: ScheduledSupplement[] = [
  {
    id: 'iron',
    name: 'Iron (Eiron CR)',
    dose: '60 mg + 500 mg vitamin C',
    time: 'morning',
    reminderHour: 7,
    reminderMinute: 0,
    note: 'Empty stomach with vitamin C. Keep 2h away from D3, calcium, coffee, and tea (all block absorption).',
  },
  {
    id: 'd3k2',
    name: 'Vitamin D3 + K2',
    dose: '10,000 IU + MK-7 100-200 mcg',
    time: 'meal',
    reminderHour: 13,
    reminderMinute: 0,
    note: 'With the fattiest meal (fat-soluble). At least 2h after iron. Retest ~mid-July.',
  },
  {
    id: 'omega3',
    name: 'Omega-3 fish oil',
    dose: '2-3 g EPA+DHA',
    time: 'meal',
    reminderHour: 13,
    reminderMinute: 0,
    note: 'With food.',
  },
  {
    id: 'creatine',
    name: 'Creatine monohydrate',
    dose: '3-5 g',
    time: 'meal',
    reminderHour: 13,
    reminderMinute: 0,
    note: 'With food, any time of day. No loading needed.',
  },
];
