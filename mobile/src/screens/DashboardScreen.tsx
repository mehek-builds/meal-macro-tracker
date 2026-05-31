// ============================================================
// DashboardScreen - Section 5
// Calorie ring + macro bars + micronutrient row + meal sections
// + water tracker + exercise log + scan FAB.
// ============================================================

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useAppStore } from '@/state/useAppStore';
import { CalorieRing } from '@/components/CalorieRing';
import { MacroBars } from '@/components/MacroBars';
import { MicronutrientRow } from '@/components/MicronutrientRow';
import { MealSection } from '@/components/MealSection';
import { WaterTracker } from '@/components/WaterTracker';
import { ExerciseLog } from '@/components/ExerciseLog';

interface DashboardScreenProps {
  /** Navigate to the scan screen from the FAB. */
  onPressScan?: () => void;
}

/** Group log entries by meal type. */
function groupByMeal(entries: ReturnType<typeof useAppStore>['todayLog']) {
  return {
    breakfast: entries.filter((e) => e.meal === 'breakfast'),
    lunch: entries.filter((e) => e.meal === 'lunch'),
    dinner: entries.filter((e) => e.meal === 'dinner'),
    snacks: entries.filter((e) => e.meal === 'snacks'),
  };
}

// Mock iron/calcium/magnesium/zinc consumed today (from food log items).
// TODO(Section 5) - sum micronutrients from todayLog[].item after types are populated from USDA.
const MOCK_MICROS = { iron_mg: 6, calcium_mg: 320, magnesium_mg: 110, zinc_mg: 4 };

// Mock exercise for stub mode.
const MOCK_EXERCISE = {
  activeCaloriesBurned: 380,
  workouts: [] as ReturnType<typeof useAppStore>['todayLog'],
};

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

  const meals = groupByMeal(todayLog);

  const isLuteal = cycleState.phase === 'luteal';
  const lutealLabel =
    isLuteal
      ? `+${cycleState.lutealCalorieBonus} cal, +${cycleState.lutealProteinBonus}g protein added`
      : undefined;

  const handleAddWater = (oz: number): void => {
    // TODO(Section 10) - call logWater() endpoint then sync store
    addWaterEntry({
      id: `stub-${Date.now()}`,
      oz,
      ml: oz * 29.5735,
      loggedAt: new Date().toISOString(),
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Date header */}
        <View style={styles.dateHeader}>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
          {/* TODO(Section 5) - date navigation arrows */}
        </View>

        {/* Luteal phase banner (Section 11.4) */}
        {isLuteal && (
          <View style={styles.lutealBanner}>
            <Text style={styles.lutealBannerText}>
              Luteal phase: targets adjusted. {lutealLabel}.
            </Text>
          </View>
        )}

        {/* Calorie Ring - Section 5 */}
        <CalorieRing
          target={targets.effectiveCalories}
          consumed={caloriesConsumed}
          isLuteal={isLuteal}
          lutealLabel={lutealLabel}
        />

        {/* Macro Bars - Section 5 */}
        <MacroBars
          protein={{ consumed: proteinConsumed, target: targets.effectiveProteinG }}
          carbs={{ consumed: carbsConsumed, target: targets.carbsG }}
          fat={{ consumed: fatConsumed, target: targets.fatG }}
        />

        {/* Micronutrient Row - Section 5 (always visible) */}
        <MicronutrientRow
          iron_mg={MOCK_MICROS.iron_mg}
          calcium_mg={MOCK_MICROS.calcium_mg}
          magnesium_mg={MOCK_MICROS.magnesium_mg}
          zinc_mg={MOCK_MICROS.zinc_mg}
        />

        {/* Meal Sections - Section 5 */}
        <MealSection
          meal="breakfast"
          entries={meals.breakfast}
          onAddFood={onPressScan}
        />
        <MealSection
          meal="lunch"
          entries={meals.lunch}
          onAddFood={onPressScan}
        />
        <MealSection
          meal="dinner"
          entries={meals.dinner}
          onAddFood={onPressScan}
        />
        <MealSection
          meal="snacks"
          entries={meals.snacks}
          onAddFood={onPressScan}
        />

        {/* Water Tracker - Section 5 / 10 */}
        <WaterTracker summary={waterSummary} onAddWater={handleAddWater} />

        {/* Exercise Log - Section 5 / 9 */}
        <ExerciseLog
          activeCaloriesBurned={MOCK_EXERCISE.activeCaloriesBurned}
          workouts={[]}
          // TODO(Section 9) - replace with HealthKit-synced workouts from store
        />

        {/* Bottom padding so FAB doesn't overlap last card */}
        <View style={styles.bottomPad} />
      </ScrollView>

      {/* Scan FAB - Section 5 */}
      <TouchableOpacity
        style={styles.fab}
        onPress={onPressScan}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>📷</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },
  scroll: { paddingTop: 8, paddingBottom: 100 },
  dateHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dateText: { fontSize: 15, fontWeight: '500', color: '#374151' },
  lutealBanner: {
    marginHorizontal: 16,
    marginBottom: 4,
    backgroundColor: '#FDF2F8',
    borderRadius: 8,
    padding: 10,
  },
  lutealBannerText: { fontSize: 13, color: '#BE185D' },
  fab: {
    position: 'absolute',
    bottom: 28,
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  fabIcon: { fontSize: 28 },
  bottomPad: { height: 32 },
});
