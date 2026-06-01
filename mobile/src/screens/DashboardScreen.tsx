// ============================================================
// DashboardScreen - the Home tab ("Nourish").
// date -> ring -> macros -> micros -> meals -> water -> exercise.
// The scan FAB now lives in the tab bar (App.tsx), not here.
// ============================================================

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import type { FoodLogEntry, WorkoutEntry } from '@/types';
import { useAppStore } from '@/state/useAppStore';
import { syncHealthKitForDay } from '@/health/healthkit';
import { CalorieRing } from '@/components/CalorieRing';
import { MacroBars } from '@/components/MacroBars';
import { MicronutrientRow } from '@/components/MicronutrientRow';
import { MealSection } from '@/components/MealSection';
import { WaterTracker } from '@/components/WaterTracker';
import { ExerciseLog } from '@/components/ExerciseLog';
import { tokens, font, type, space } from '@/theme/tokens';

interface DashboardScreenProps {
  /** Open the scan modal (from meal "+" prompts). */
  onPressScan?: () => void;
}

/** Group log entries by meal type. */
function groupByMeal(entries: FoodLogEntry[]) {
  return {
    breakfast: entries.filter((e) => e.meal === 'breakfast'),
    lunch: entries.filter((e) => e.meal === 'lunch'),
    dinner: entries.filter((e) => e.meal === 'dinner'),
    snacks: entries.filter((e) => e.meal === 'snacks'),
  };
}

// Mock iron/calcium/magnesium/zinc consumed today.
const MOCK_MICROS = { iron_mg: 6, calcium_mg: 320, magnesium_mg: 110, zinc_mg: 4 };

function SectionLabel({ children }: { children: string }): React.ReactElement {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export function DashboardScreen({ onPressScan }: DashboardScreenProps): React.ReactElement {
  const targets = useAppStore((s) => s.targets);
  const todayLog = useAppStore((s) => s.todayLog);
  const waterSummary = useAppStore((s) => s.waterSummary);
  const addWaterEntry = useAppStore((s) => s.addWaterEntry);
  const cycleState = useAppStore((s) => s.cycleState);
  const caloriesConsumed = useAppStore((s) => s.caloriesConsumedToday)();
  const proteinConsumed = useAppStore((s) => s.proteinConsumedToday)();
  const carbsConsumed = useAppStore((s) => s.carbsConsumedToday)();
  const fatConsumed = useAppStore((s) => s.fatConsumedToday)();

  // Real Apple Health data for today (active calories + workouts). Null until synced.
  const [activeCalories, setActiveCalories] = useState(0);
  const [steps, setSteps] = useState(0);
  const [weightLbs, setWeightLbs] = useState<number | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);
  const [healthSyncing, setHealthSyncing] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);

  const syncHealth = useCallback(async () => {
    setHealthSyncing(true);
    setHealthError(null);
    try {
      const data = await syncHealthKitForDay(new Date());
      setActiveCalories(data.activeCalories);
      setSteps(data.steps);
      setWeightLbs(data.weightLbs);
      setWorkouts(data.workouts);
    } catch (err) {
      setHealthError(
        err instanceof Error ? err.message : 'Could not read Apple Health.',
      );
    } finally {
      setHealthSyncing(false);
    }
  }, []);

  // Attempt a sync on first mount; the first call surfaces the iOS permission
  // sheet. Errors (denied / not on a HealthKit build) are shown, not thrown.
  useEffect(() => {
    void syncHealth();
  }, [syncHealth]);

  const meals = groupByMeal(todayLog);

  const isLuteal = cycleState.phase === 'luteal';
  const lutealLabel = isLuteal
    ? `+${cycleState.lutealCalorieBonus} cal, +${cycleState.lutealProteinBonus}g protein`
    : undefined;

  const handleAddWater = (oz: number): void => {
    addWaterEntry({
      id: `stub-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      oz,
      ml: oz * 29.5735,
      loggedAt: new Date().toISOString(),
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>

        <CalorieRing
          target={targets.effectiveCalories}
          consumed={caloriesConsumed}
          burned={activeCalories}
          isLuteal={isLuteal}
          lutealLabel={lutealLabel}
        />

        {(steps > 0 || weightLbs != null || activeCalories > 0) && (
          <Text style={styles.healthLine}>
            Apple Health · {steps.toLocaleString()} steps
            {activeCalories > 0 ? ` · ${activeCalories} cal burned` : ''}
            {weightLbs != null ? ` · ${weightLbs} lb` : ''}
          </Text>
        )}

        <MacroBars
          protein={{ consumed: proteinConsumed, target: targets.effectiveProteinG }}
          carbs={{ consumed: carbsConsumed, target: targets.carbsG }}
          fat={{ consumed: fatConsumed, target: targets.fatG }}
        />

        <View style={styles.block}>
          <SectionLabel>Micronutrients</SectionLabel>
          <MicronutrientRow
            iron_mg={MOCK_MICROS.iron_mg}
            calcium_mg={MOCK_MICROS.calcium_mg}
            magnesium_mg={MOCK_MICROS.magnesium_mg}
            zinc_mg={MOCK_MICROS.zinc_mg}
          />
        </View>

        <View style={styles.mealsBlock}>
          <SectionLabel>Today's meals</SectionLabel>
          <MealSection meal="breakfast" entries={meals.breakfast} onAddFood={onPressScan} />
          <MealSection meal="lunch" entries={meals.lunch} onAddFood={onPressScan} />
          <MealSection meal="dinner" entries={meals.dinner} onAddFood={onPressScan} />
          <MealSection meal="snacks" entries={meals.snacks} onAddFood={onPressScan} />
        </View>

        <WaterTracker summary={waterSummary} onAddWater={handleAddWater} />

        <ExerciseLog
          activeCaloriesBurned={activeCalories}
          workouts={workouts}
          onConnectAppleWatch={syncHealth}
          syncing={healthSyncing}
          errorText={healthError}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg },
  scroll: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.xxl,
    gap: space.md,
  },
  dateText: {
    fontFamily: font.display,
    fontSize: type.statValue,
    color: tokens.ink,
    textAlign: 'center',
    marginBottom: 2,
  },
  sectionLabel: {
    fontFamily: font.bodyBold,
    fontSize: type.caption,
    color: tokens.inkFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  healthLine: {
    fontFamily: font.body,
    fontSize: 12,
    color: tokens.inkMuted,
    textAlign: 'center',
    marginTop: -4,
  },
  block: {},
  mealsBlock: {
    gap: 10,
  },
});
