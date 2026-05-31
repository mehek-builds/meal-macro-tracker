// ============================================================
// OnboardingScreen - Section 6 (8-step setup)
// Step 1: Welcome
// Step 2: Biological sex + age
// Step 3: Height + current weight
// Step 4: Goal + target weight + milestone weight
// Step 5: Activity level + training phase
// Step 6: Dietary restrictions / allergies
// Step 7: Cycle tracking (first day of last period or skip)
// Step 8: Plan ready - show calorie target + macros, go to dashboard
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useAppStore } from '@/state/useAppStore';
import { tokens, font, type, space, radius } from '@/theme/tokens';

const TOTAL_STEPS = 8;

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
}

// ---- Step 1: Welcome ----
function StepWelcome({ onNext }: StepProps): React.ReactElement {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Welcome to Fitness Tracker</Text>
      <Text style={styles.body}>
        This is a surplus-first nutrition app. Its job is to make sure you eat{' '}
        enough every day to build lean muscle and fuel marathon training.
      </Text>
      <Text style={styles.body}>
        Snap a photo of your meal and get a full nutritional breakdown in under
        10 seconds.
      </Text>
      {/* TODO(Section 6) - add illustration / animation */}
      <TouchableOpacity style={styles.primaryBtn} onPress={onNext}>
        <Text style={styles.primaryBtnText}>Get started</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---- Step 2: Biological sex + age ----
function StepSexAge({ onNext, onBack }: StepProps): React.ReactElement {
  // TODO(Section 6) - wire up form state to profile fields
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>About you</Text>
      <Text style={styles.fieldLabel}>Biological sex</Text>
      {/* TODO(Section 6) - segmented control Female / Male */}
      <View style={styles.mockInput}><Text style={styles.mockInputText}>Female (placeholder)</Text></View>
      <Text style={styles.fieldLabel}>Age</Text>
      <View style={styles.mockInput}><Text style={styles.mockInputText}>20 (placeholder)</Text></View>
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}><Text style={styles.backText}>Back</Text></TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={onNext}><Text style={styles.primaryBtnText}>Next</Text></TouchableOpacity>
      </View>
    </View>
  );
}

// ---- Step 3: Height + weight ----
function StepHeightWeight({ onNext, onBack }: StepProps): React.ReactElement {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Height & weight</Text>
      <Text style={styles.fieldLabel}>Height (cm)</Text>
      <View style={styles.mockInput}><Text style={styles.mockInputText}>163 cm (placeholder)</Text></View>
      <Text style={styles.fieldLabel}>Current weight (kg)</Text>
      <View style={styles.mockInput}><Text style={styles.mockInputText}>42 kg (placeholder)</Text></View>
      {/* TODO(Section 6) - TextInput with numeric keyboard */}
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}><Text style={styles.backText}>Back</Text></TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={onNext}><Text style={styles.primaryBtnText}>Next</Text></TouchableOpacity>
      </View>
    </View>
  );
}

// ---- Step 4: Goal + target weight ----
function StepGoal({ onNext, onBack }: StepProps): React.ReactElement {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Your goal</Text>
      {/* TODO(Section 6) - segmented control: Build muscle / Maintain / Lose */}
      <View style={styles.mockInput}><Text style={styles.mockInputText}>Build muscle (surplus) - placeholder</Text></View>
      <Text style={styles.fieldLabel}>Target weight (kg)</Text>
      <View style={styles.mockInput}><Text style={styles.mockInputText}>57-60 kg (placeholder)</Text></View>
      <Text style={styles.fieldLabel}>Near-term milestone weight (kg)</Text>
      <View style={styles.mockInput}><Text style={styles.mockInputText}>45 kg (placeholder)</Text></View>
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}><Text style={styles.backText}>Back</Text></TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={onNext}><Text style={styles.primaryBtnText}>Next</Text></TouchableOpacity>
      </View>
    </View>
  );
}

// ---- Step 5: Activity level + training phase ----
function StepActivity({ onNext, onBack }: StepProps): React.ReactElement {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Activity & training</Text>
      <Text style={styles.fieldLabel}>Activity level</Text>
      {/* TODO(Section 6) - picker: sedentary / lightly active / moderately active / very active / athlete */}
      <View style={styles.mockInput}><Text style={styles.mockInputText}>Lightly active (placeholder)</Text></View>
      <Text style={styles.fieldLabel}>Current training phase</Text>
      {/* TODO(Section 6) - Phase 1 / 2 / 3 explanation inline */}
      <View style={styles.mockInput}><Text style={styles.mockInputText}>Phase 1 - Bodyweight (placeholder)</Text></View>
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}><Text style={styles.backText}>Back</Text></TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={onNext}><Text style={styles.primaryBtnText}>Next</Text></TouchableOpacity>
      </View>
    </View>
  );
}

// ---- Step 6: Dietary restrictions ----
function StepDietary({ onNext, onBack }: StepProps): React.ReactElement {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Dietary restrictions</Text>
      <Text style={styles.body}>Any foods to avoid or allergies?</Text>
      {/* TODO(Section 6) - multi-select chips: Vegetarian, Vegan, Gluten-free, Dairy-free, Nut allergy, None */}
      <View style={styles.mockInput}><Text style={styles.mockInputText}>None (placeholder)</Text></View>
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}><Text style={styles.backText}>Back</Text></TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={onNext}><Text style={styles.primaryBtnText}>Next</Text></TouchableOpacity>
      </View>
    </View>
  );
}

// ---- Step 7: Cycle tracking ----
function StepCycle({ onNext, onBack }: StepProps): React.ReactElement {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Cycle tracking</Text>
      <Text style={styles.body}>
        The app adjusts calorie and protein targets during your luteal phase
        (+200 cal, +12g protein). HealthKit updates this automatically - this
        is just a starting seed value.
      </Text>
      <Text style={styles.fieldLabel}>First day of last period</Text>
      {/* TODO(Section 6) - date picker */}
      <View style={styles.mockInput}><Text style={styles.mockInputText}>Date picker placeholder</Text></View>
      <TouchableOpacity style={styles.skipBtn} onPress={onNext}>
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}><Text style={styles.backText}>Back</Text></TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={onNext}><Text style={styles.primaryBtnText}>Next</Text></TouchableOpacity>
      </View>
    </View>
  );
}

// ---- Step 8: Plan ready ----
function StepPlanReady({ onNext }: StepProps): React.ReactElement {
  // TODO(Section 6) - pull computed targets from store / backend and display them
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Your plan is ready</Text>
      <View style={styles.planCard}>
        <Text style={styles.planRow}>Daily calories: <Text style={styles.planValue}>1,900 cal</Text></Text>
        <Text style={styles.planRow}>Protein: <Text style={styles.planValue}>122g</Text></Text>
        <Text style={styles.planRow}>Carbs: <Text style={styles.planValue}>240g</Text></Text>
        <Text style={styles.planRow}>Fat: <Text style={styles.planValue}>60g</Text></Text>
        <Text style={styles.planRow}>Water (rest day): <Text style={styles.planValue}>85 oz (2.5L)</Text></Text>
        <Text style={styles.planRow}>Water (training day): <Text style={styles.planValue}>101 oz (3.0L)</Text></Text>
      </View>
      <Text style={styles.hint}>Targets auto-recalculate every 3 kg gained (Section 2).</Text>
      <TouchableOpacity style={styles.primaryBtn} onPress={onNext}>
        <Text style={styles.primaryBtnText}>Go to dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---- Main OnboardingScreen ----
const STEPS = [
  StepWelcome,
  StepSexAge,
  StepHeightWeight,
  StepGoal,
  StepActivity,
  StepDietary,
  StepCycle,
  StepPlanReady,
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps): React.ReactElement {
  const [currentStep, setCurrentStep] = useState(0);
  const setOnboardingComplete = useAppStore((s) => s.setOnboardingComplete);

  const handleNext = (): void => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      setOnboardingComplete(true);
      onComplete();
    }
  };

  const handleBack = (): void => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const StepComponent = STEPS[currentStep];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Progress indicator */}
      <View style={styles.progressBar}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              i <= currentStep ? styles.progressDotActive : styles.progressDotInactive,
            ]}
          />
        ))}
      </View>
      <Text style={styles.stepCounter}>Step {currentStep + 1} of {TOTAL_STEPS}</Text>

      <ScrollView contentContainerStyle={styles.scroll}>
        <StepComponent onNext={handleNext} onBack={currentStep > 0 ? handleBack : undefined} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg },
  scroll: { flexGrow: 1, padding: space.lg },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 12,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressDotActive: { backgroundColor: tokens.accent },
  progressDotInactive: { backgroundColor: tokens.track },
  stepCounter: {
    textAlign: 'center',
    fontFamily: font.numeric,
    fontSize: type.caption,
    color: tokens.inkFaint,
    marginBottom: 4,
  },
  stepContainer: { flex: 1, gap: 12 },
  title: {
    fontFamily: font.display,
    fontSize: type.screenTitle,
    color: tokens.ink,
    marginBottom: 8,
  },
  body: { fontFamily: font.body, fontSize: 15, color: tokens.inkMuted, lineHeight: 22 },
  fieldLabel: { fontFamily: font.body, fontSize: type.body, color: tokens.ink, marginTop: 8 },
  mockInput: {
    borderWidth: 1,
    borderColor: tokens.border,
    borderRadius: radius.card,
    padding: 12,
    backgroundColor: tokens.surface,
  },
  mockInputText: { fontFamily: font.body, color: tokens.inkFaint, fontSize: type.body },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  primaryBtn: {
    backgroundColor: tokens.accent,
    borderRadius: radius.card,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  primaryBtnText: { fontFamily: font.bodyBold, color: tokens.surface, fontSize: type.statValue },
  backBtn: { justifyContent: 'center', paddingHorizontal: 12, minHeight: 44 },
  backText: { fontFamily: font.body, color: tokens.inkMuted, fontSize: 15 },
  skipBtn: { alignSelf: 'flex-start', justifyContent: 'center', minHeight: 44 },
  skipText: { fontFamily: font.body, color: tokens.inkFaint, fontSize: type.body },
  planCard: {
    backgroundColor: tokens.surfaceWarm,
    borderRadius: radius.card,
    padding: 16,
    gap: 8,
  },
  planRow: { fontFamily: font.body, fontSize: 15, color: tokens.ink },
  planValue: { fontFamily: font.bodyBold, color: tokens.ink },
  hint: { fontFamily: font.body, fontSize: type.caption, color: tokens.inkFaint },
});
