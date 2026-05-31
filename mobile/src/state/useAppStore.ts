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
} from '@/types';

// --------------- Persistence (MMKV-backed) -----------------

const mmkv = new MMKV();

const zustandStorage = {
  getItem: (name: string): string | null => mmkv.getString(name) ?? null,
  setItem: (name: string, value: string): void => mmkv.set(name, value),
  removeItem: (name: string): void => mmkv.delete(name),
};

// --------------- Mock seed data -----------------

const MOCK_PROFILE: UserProfile = {
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
const MOCK_TARGETS: Targets = {
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

const MOCK_WATER_SUMMARY: WaterSummary = {
  date: new Date().toISOString().split('T')[0],
  entries: [],
  totalOz: 0,
  totalMl: 0,
  goalOz: 85,
  remainingOz: 85,
  percentComplete: 0,
};

const MOCK_CYCLE_STATE: CycleState = {
  cycleDay: 0,
  phase: 'unknown',
  lastPeriodStart: null,
  estimatedCycleLength: 28,
  nearOvulation: false,
  lutealCalorieBonus: 0,
  lutealProteinBonus: 0,
};

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
  profile: MOCK_PROFILE,
  targets: MOCK_TARGETS,
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
  waterSummary: MOCK_WATER_SUMMARY,
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
  cycleState: MOCK_CYCLE_STATE,
  setCycleState: (cycleState) => set({ cycleState }),

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
      }),
    },
  ),
);
