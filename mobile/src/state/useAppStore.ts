// ============================================================
// Zustand global store - Section 17 (state management)
// Stub data only. Real sync happens via TanStack Query + backend.
// ============================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import type {
  UserProfile,
  Targets,
  FoodLogEntry,
  WaterEntry,
  WaterSummary,
  CycleState,
  NetCalorieMode,
  BloodworkResult,
} from '@/types';

// --------------- Persistence (MMKV-backed) -----------------

const mmkv = new MMKV();

const zustandStorage = {
  getItem: (name: string): string | null => mmkv.getString(name) ?? null,
  setItem: (name: string, value: string): void => mmkv.set(name, value),
  removeItem: (name: string): void => mmkv.delete(name),
};

// --------------- Initial defaults -----------------
// Bootstrap state only. Onboarding writes the user's real profile/targets, and
// persisted state rehydrates over these on launch, so they are never shown as
// real data once a user has onboarded.

const DEFAULT_PROFILE: UserProfile = {
  id: 'local-user',
  sex: 'female',
  age: 20,
  heightCm: 163,
  weightKg: 42,
  goal: 'build_muscle',
  targetWeightKg: 57,
  milestoneWeightKg: 45,
  activityLevel: 'lightly_active',
  trainingPhase: 'phase_1',
  netCalorieMode: 'fixed',
  calorieSurplus: 300,
  waterGoalOz: null,
  dietaryRestrictions: [],
  allergies: [],
  lastPeriodStart: null,
};

/** Mifflin-St Jeor BMR + surplus for 42 kg lightly-active female (Section 2). */
const DEFAULT_TARGETS: Targets = {
  bmr: 1177.8,
  tdee: 1619.4,
  calories: 1919,
  proteinG: 122,
  carbsG: 238,
  fatG: 53,
  isLuteal: false,
  lutealCalorieBonus: 0,
  lutealProteinBonus: 0,
  effectiveCalories: 1919,
  effectiveProteinG: 122,
  waterGoalOz: 84.5,
};

const DEFAULT_WATER_SUMMARY: WaterSummary = {
  date: new Date().toISOString().split('T')[0],
  entries: [],
  totalOz: 0,
  totalMl: 0,
  goalOz: 85,
  remainingOz: 85,
  percentComplete: 0,
};

const DEFAULT_CYCLE_STATE: CycleState = {
  cycleDay: 0,
  phase: 'unknown',
  lastPeriodStart: null,
  estimatedCycleLength: 28,
  nearOvulation: false,
  lutealCalorieBonus: 0,
  lutealProteinBonus: 0,
};

// REAL lab results (not mock) — Mehek's 29 May 2026 panel, King's College
// Hospital Dubai. Seeds the bloodwork log with her confirmed deficiencies so
// the app has them to reference; editable/extendable via the store going forward.
const REAL_BLOODWORK: BloodworkResult[] = [
  {
    id: 'bw-vitd-2026-05-29',
    date: '2026-05-29',
    markerName: 'Vitamin D (25-OH)',
    value: 29.2,
    unit: 'ng/mL',
    refRangeLow: 30,
    refRangeHigh: 100,
    status: 'low',
    retestDate: '2026-07-15',
    notes:
      'Insufficient (target 40-60). On 10,000 IU D3/day correction dose; drop to 2,000-4,000 IU once at 40-60.',
  },
  {
    id: 'bw-ferritin-2026-05-29',
    date: '2026-05-29',
    markerName: 'Ferritin',
    value: 32,
    unit: 'ng/mL',
    refRangeLow: 15,
    refRangeHigh: 150,
    status: 'low',
    retestDate: '2026-08-01',
    notes:
      'Stage 1 iron depletion (~26 with lab calibration). Athlete target >40. On Eiron CR 60mg/day + vitamin C.',
  },
  {
    id: 'bw-rdw-2026-05-29',
    date: '2026-05-29',
    markerName: 'RDW',
    value: 11.6,
    unit: '%',
    refRangeLow: 12.3,
    refRangeHigh: 15.4,
    status: 'low',
    retestDate: null,
    notes: 'Flagged low. Rest of CBC clean — no anemia.',
  },
];

// --------------- Store shape -----------------

interface AppState {
  // Onboarding
  onboardingComplete: boolean;
  setOnboardingComplete: (complete: boolean) => void;

  // Profile & targets
  profile: UserProfile;
  targets: Targets;
  setProfile: (profile: UserProfile) => void;
  setTargets: (targets: Targets) => void;

  // Today's food log
  todayLog: FoodLogEntry[];
  setTodayLog: (entries: FoodLogEntry[]) => void;
  addLogEntry: (entry: FoodLogEntry) => void;
  removeLogEntry: (id: string) => void;

  // Water
  waterSummary: WaterSummary;
  setWaterSummary: (summary: WaterSummary) => void;
  addWaterEntry: (entry: WaterEntry) => void;
  removeWaterEntry: (id: string) => void;

  // Cycle state
  cycleState: CycleState;
  setCycleState: (state: CycleState) => void;

  // Bloodwork results (seeded with the user's real panel; persisted)
  bloodwork: BloodworkResult[];
  addBloodworkResult: (result: BloodworkResult) => void;
  removeBloodworkResult: (id: string) => void;

  // Supplements (daily checklist; resets each calendar day)
  supplementsTaken: { date: string; ids: string[] };
  supplementRemindersOn: boolean;
  toggleSupplementTaken: (id: string) => void;
  takenSupplementIdsToday: () => string[];
  setSupplementRemindersOn: (on: boolean) => void;

  // Settings helpers
  setNetCalorieMode: (mode: NetCalorieMode) => void;

  // Computed helpers
  caloriesConsumedToday: () => number;
  caloriesRemainingToday: () => number;
  proteinConsumedToday: () => number;
  carbsConsumedToday: () => number;
  fatConsumedToday: () => number;
}

// --------------- Store implementation -----------------

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
  // Onboarding
  onboardingComplete: false,
  setOnboardingComplete: (complete) => set({ onboardingComplete: complete }),

  // Profile & targets
  profile: DEFAULT_PROFILE,
  targets: DEFAULT_TARGETS,
  setProfile: (profile) => set({ profile }),
  setTargets: (targets) => set({ targets }),

  // Food log
  todayLog: [],
  setTodayLog: (entries) => set({ todayLog: entries }),
  addLogEntry: (entry) =>
    set((state) => ({ todayLog: [...state.todayLog, entry] })),
  removeLogEntry: (id) =>
    set((state) => ({ todayLog: state.todayLog.filter((e) => e.id !== id) })),

  // Water
  waterSummary: DEFAULT_WATER_SUMMARY,
  setWaterSummary: (summary) => set({ waterSummary: summary }),
  addWaterEntry: (entry) =>
    set((state) => {
      const entries = [...state.waterSummary.entries, entry];
      const totalOz = entries.reduce((sum, e) => sum + e.oz, 0);
      const goalOz = state.waterSummary.goalOz;
      return {
        waterSummary: {
          ...state.waterSummary,
          entries,
          totalOz,
          totalMl: totalOz * 29.5735,
          remainingOz: Math.max(0, goalOz - totalOz),
          percentComplete: Math.min(100, Math.round((totalOz / goalOz) * 100)),
        },
      };
    }),
  removeWaterEntry: (id) =>
    set((state) => {
      const entries = state.waterSummary.entries.filter((e) => e.id !== id);
      const totalOz = entries.reduce((sum, e) => sum + e.oz, 0);
      const goalOz = state.waterSummary.goalOz;
      return {
        waterSummary: {
          ...state.waterSummary,
          entries,
          totalOz,
          totalMl: totalOz * 29.5735,
          remainingOz: Math.max(0, goalOz - totalOz),
          percentComplete: Math.min(100, Math.round((totalOz / goalOz) * 100)),
        },
      };
    }),

  // Cycle
  cycleState: DEFAULT_CYCLE_STATE,
  setCycleState: (cycleState) => set({ cycleState }),

  // Bloodwork — seeded with the user's real panel; newest first.
  bloodwork: REAL_BLOODWORK,
  addBloodworkResult: (result) =>
    set((state) => ({ bloodwork: [result, ...state.bloodwork] })),
  removeBloodworkResult: (id) =>
    set((state) => ({ bloodwork: state.bloodwork.filter((b) => b.id !== id) })),

  // Supplements
  supplementsTaken: { date: '', ids: [] },
  supplementRemindersOn: false,
  toggleSupplementTaken: (id) =>
    set((state) => {
      const today = new Date().toISOString().slice(0, 10);
      // Start fresh on a new calendar day.
      const ids = state.supplementsTaken.date === today ? state.supplementsTaken.ids : [];
      const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
      return { supplementsTaken: { date: today, ids: next } };
    }),
  takenSupplementIdsToday: () => {
    const today = new Date().toISOString().slice(0, 10);
    const s = get().supplementsTaken;
    return s.date === today ? s.ids : [];
  },
  setSupplementRemindersOn: (on) => set({ supplementRemindersOn: on }),

  // Settings
  setNetCalorieMode: (mode) =>
    set((state) => ({
      profile: { ...state.profile, netCalorieMode: mode },
    })),

  // Computed
  caloriesConsumedToday: () =>
    get().todayLog.reduce((sum, e) => sum + e.item.calories, 0),
  caloriesRemainingToday: () =>
    get().targets.effectiveCalories - get().caloriesConsumedToday(),
  proteinConsumedToday: () =>
    get().todayLog.reduce((sum, e) => sum + e.item.proteinG, 0),
  carbsConsumedToday: () =>
    get().todayLog.reduce((sum, e) => sum + e.item.carbsG, 0),
  fatConsumedToday: () =>
    get().todayLog.reduce((sum, e) => sum + e.item.fatG, 0),
    }),
    {
      name: 'fitness-tracker-store',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        onboardingComplete: state.onboardingComplete,
        profile: state.profile,
        targets: state.targets,
        cycleState: state.cycleState,
        bloodwork: state.bloodwork,
        supplementsTaken: state.supplementsTaken,
        supplementRemindersOn: state.supplementRemindersOn,
      }),
    },
  ),
);
