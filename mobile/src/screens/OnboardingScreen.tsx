// ============================================================
// OnboardingScreen - Section 6 (8-step setup).
// Real, editable inputs that capture a profile, compute targets
// (Mifflin-St Jeor + surplus), and persist via the store so the
// dashboard reflects what the user entered.
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAppStore } from '@/state/useAppStore';
import type { UserProfile, Targets } from '@/types';
import { tokens, font, type, space, radius } from '@/theme/tokens';

const TOTAL_STEPS = 8;

// ---------------- form model ----------------

interface Form {
  sex: UserProfile['sex'];
  age: string;
  heightCm: string;
  weightKg: string;
  goal: UserProfile['goal'];
  targetWeightKg: string;
  milestoneWeightKg: string;
  activityLevel: UserProfile['activityLevel'];
  trainingPhase: string;
  restrictions: string[];
  lastPeriodStart: string;
}

const INITIAL_FORM: Form = {
  sex: 'female',
  age: '',
  heightCm: '',
  weightKg: '',
  goal: 'build_muscle',
  targetWeightKg: '',
  milestoneWeightKg: '',
  activityLevel: 'lightly_active',
  trainingPhase: 'phase_1',
  restrictions: [],
  lastPeriodStart: '',
};

const ACTIVITY_MULTIPLIER: Record<UserProfile['activityLevel'], number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  athlete: 1.9,
};

const num = (s: string): number => {
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

function parseProfile(form: Form): UserProfile {
  return {
    id: 'local-user',
    sex: form.sex,
    age: num(form.age),
    heightCm: num(form.heightCm),
    weightKg: num(form.weightKg),
    goal: form.goal,
    targetWeightKg: form.targetWeightKg ? num(form.targetWeightKg) : null,
    milestoneWeightKg: form.milestoneWeightKg ? num(form.milestoneWeightKg) : null,
    activityLevel: form.activityLevel,
    netCalorieMode: 'fixed',
    calorieSurplus: 400,
    waterGoalOz: null,
    dietaryRestrictions: form.restrictions,
    allergies: [],
    trainingPhase: form.trainingPhase,
    lastPeriodStart: form.lastPeriodStart || null,
  };
}

/** Mifflin-St Jeor BMR + activity + goal surplus, with a 24% protein / 25%
 *  fat / remainder-carb macro split. Mirrors the backend stub numbers. */
function computeTargets(p: UserProfile): Targets {
  const bmr = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === 'male' ? 5 : -161);
  const tdee = bmr * (ACTIVITY_MULTIPLIER[p.activityLevel] ?? 1.375);
  const surplus = p.goal === 'build_muscle' ? p.calorieSurplus : p.goal === 'lose' ? -400 : 0;
  const calories = Math.max(0, Math.round(tdee + surplus));
  const proteinG = Math.round((0.24 * calories) / 4);
  const fatG = Math.round((0.25 * calories) / 9);
  const carbsG = Math.max(0, Math.round((calories - proteinG * 4 - fatG * 9) / 4));
  const waterGoalOz = Math.round(p.weightKg * 2);
  return {
    bmr: Math.round(bmr * 10) / 10,
    tdee: Math.round(tdee * 10) / 10,
    calories,
    proteinG,
    carbsG,
    fatG,
    isLuteal: false,
    lutealCalorieBonus: 0,
    lutealProteinBonus: 0,
    effectiveCalories: calories,
    effectiveProteinG: proteinG,
    waterGoalOz,
  };
}

// ---------------- reusable inputs ----------------

interface Option<T extends string> {
  value: T;
  label: string;
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
}): React.ReactElement {
  return (
    <View style={styles.segmentRow}>
      {options.map((o) => (
        <TouchableOpacity
          key={o.value}
          style={[styles.segment, value === o.value && styles.segmentActive]}
          onPress={() => onChange(o.value)}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, value === o.value && styles.segmentTextActive]}>
            {o.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function SelectList<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
}): React.ReactElement {
  return (
    <View style={{ gap: 8 }}>
      {options.map((o) => (
        <TouchableOpacity
          key={o.value}
          style={[styles.selectRow, value === o.value && styles.selectRowActive]}
          onPress={() => onChange(o.value)}
          activeOpacity={0.8}
        >
          <Text style={[styles.selectRowText, value === o.value && styles.selectRowTextActive]}>
            {o.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function NumberField({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
}): React.ReactElement {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        placeholder={placeholder}
        placeholderTextColor={tokens.inkFaint}
      />
    </View>
  );
}

function Chips({
  options,
  values,
  onToggle,
}: {
  options: string[];
  values: string[];
  onToggle: (v: string) => void;
}): React.ReactElement {
  return (
    <View style={styles.chipsWrap}>
      {options.map((o) => {
        const on = values.includes(o);
        return (
          <TouchableOpacity
            key={o}
            style={[styles.selChip, on && styles.selChipActive]}
            onPress={() => onToggle(o)}
            activeOpacity={0.8}
          >
            <Text style={[styles.selChipText, on && styles.selChipTextActive]}>{o}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ---------------- steps ----------------

interface StepProps {
  form: Form;
  update: (patch: Partial<Form>) => void;
  onNext: () => void;
  onBack?: () => void;
}

function NavRow({ onNext, onBack, nextLabel = 'Next' }: { onNext: () => void; onBack?: () => void; nextLabel?: string }): React.ReactElement {
  return (
    <View style={styles.navRow}>
      {onBack ? (
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      ) : (
        <View />
      )}
      <TouchableOpacity style={styles.primaryBtn} onPress={onNext}>
        <Text style={styles.primaryBtnText}>{nextLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

function StepWelcome({ onNext }: StepProps): React.ReactElement {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Welcome to Fitness Tracker</Text>
      <Text style={styles.body}>
        This is a surplus-first nutrition app. Its job is to make sure you eat
        enough every day to build lean muscle and fuel marathon training.
      </Text>
      <Text style={styles.body}>
        Snap a photo of your meal and get a full nutritional breakdown in under
        10 seconds.
      </Text>
      <TouchableOpacity style={styles.primaryBtn} onPress={onNext}>
        <Text style={styles.primaryBtnText}>Get started</Text>
      </TouchableOpacity>
    </View>
  );
}

function StepSexAge({ form, update, onNext, onBack }: StepProps): React.ReactElement {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>About you</Text>
      <Text style={styles.fieldLabel}>Biological sex</Text>
      <Segmented
        options={[
          { value: 'female', label: 'Female' },
          { value: 'male', label: 'Male' },
        ]}
        value={form.sex}
        onChange={(sex) => update({ sex })}
      />
      <NumberField label="Age" value={form.age} onChangeText={(age) => update({ age })} placeholder="e.g. 20" />
      <NavRow onNext={onNext} onBack={onBack} />
    </View>
  );
}

function StepHeightWeight({ form, update, onNext, onBack }: StepProps): React.ReactElement {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Height & weight</Text>
      <NumberField label="Height (cm)" value={form.heightCm} onChangeText={(heightCm) => update({ heightCm })} placeholder="e.g. 163" />
      <NumberField label="Current weight (kg)" value={form.weightKg} onChangeText={(weightKg) => update({ weightKg })} placeholder="e.g. 42" />
      <NavRow onNext={onNext} onBack={onBack} />
    </View>
  );
}

function StepGoal({ form, update, onNext, onBack }: StepProps): React.ReactElement {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Your goal</Text>
      <Segmented
        options={[
          { value: 'build_muscle', label: 'Build muscle' },
          { value: 'maintain', label: 'Maintain' },
          { value: 'lose', label: 'Lose' },
        ]}
        value={form.goal}
        onChange={(goal) => update({ goal })}
      />
      <NumberField label="Target weight (kg)" value={form.targetWeightKg} onChangeText={(targetWeightKg) => update({ targetWeightKg })} placeholder="e.g. 57" />
      <NumberField label="Near-term milestone weight (kg)" value={form.milestoneWeightKg} onChangeText={(milestoneWeightKg) => update({ milestoneWeightKg })} placeholder="e.g. 45" />
      <NavRow onNext={onNext} onBack={onBack} />
    </View>
  );
}

function StepActivity({ form, update, onNext, onBack }: StepProps): React.ReactElement {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Activity & training</Text>
      <Text style={styles.fieldLabel}>Activity level</Text>
      <SelectList
        options={[
          { value: 'sedentary', label: 'Sedentary' },
          { value: 'lightly_active', label: 'Lightly active' },
          { value: 'moderately_active', label: 'Moderately active' },
          { value: 'very_active', label: 'Very active' },
          { value: 'athlete', label: 'Athlete' },
        ]}
        value={form.activityLevel}
        onChange={(activityLevel) => update({ activityLevel })}
      />
      <Text style={styles.fieldLabel}>Current training phase</Text>
      <Segmented
        options={[
          { value: 'phase_1', label: 'Phase 1' },
          { value: 'phase_2', label: 'Phase 2' },
          { value: 'phase_3', label: 'Phase 3' },
        ]}
        value={form.trainingPhase}
        onChange={(trainingPhase) => update({ trainingPhase })}
      />
      <NavRow onNext={onNext} onBack={onBack} />
    </View>
  );
}

const RESTRICTION_OPTIONS = ['Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 'Nut allergy'];

function StepDietary({ form, update, onNext, onBack }: StepProps): React.ReactElement {
  const toggle = (r: string): void =>
    update({
      restrictions: form.restrictions.includes(r)
        ? form.restrictions.filter((x) => x !== r)
        : [...form.restrictions, r],
    });
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Dietary restrictions</Text>
      <Text style={styles.body}>Any foods to avoid or allergies? Tap all that apply.</Text>
      <Chips options={RESTRICTION_OPTIONS} values={form.restrictions} onToggle={toggle} />
      <NavRow onNext={onNext} onBack={onBack} />
    </View>
  );
}

function StepCycle({ form, update, onNext, onBack }: StepProps): React.ReactElement {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Cycle tracking</Text>
      <Text style={styles.body}>
        The app adjusts calorie and protein targets during your luteal phase
        (+200 cal, +12g protein). Apple Health updates this automatically. This is
        just a starting seed value.
      </Text>
      <View style={{ gap: 6 }}>
        <Text style={styles.fieldLabel}>First day of last period</Text>
        <TextInput
          style={styles.input}
          value={form.lastPeriodStart}
          onChangeText={(lastPeriodStart) => update({ lastPeriodStart })}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={tokens.inkFaint}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      <TouchableOpacity style={styles.skipBtn} onPress={() => { update({ lastPeriodStart: '' }); onNext(); }}>
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
      <NavRow onNext={onNext} onBack={onBack} />
    </View>
  );
}

function StepPlanReady({ form, onNext, onBack }: StepProps): React.ReactElement {
  const t = computeTargets(parseProfile(form));
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Your plan is ready</Text>
      <View style={styles.planCard}>
        <PlanRow label="Daily calories" value={`${t.effectiveCalories.toLocaleString('en-US')} cal`} />
        <PlanRow label="Protein" value={`${t.effectiveProteinG}g`} />
        <PlanRow label="Carbs" value={`${t.carbsG}g`} />
        <PlanRow label="Fat" value={`${t.fatG}g`} />
        <PlanRow label="Water (rest day)" value={`${t.waterGoalOz} oz`} />
        <PlanRow label="Water (training day)" value={`${Math.round(t.waterGoalOz * 1.2)} oz`} />
      </View>
      <Text style={styles.hint}>Based on a Mifflin-St Jeor estimate. Targets recalculate as you log weight.</Text>
      <NavRow onNext={onNext} onBack={onBack} nextLabel="Go to dashboard" />
    </View>
  );
}

function PlanRow({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <View style={styles.planRowWrap}>
      <Text style={styles.planLabel}>{label}</Text>
      <Text style={styles.planValue}>{value}</Text>
    </View>
  );
}

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
  const [form, setForm] = useState<Form>(INITIAL_FORM);
  const setOnboardingComplete = useAppStore((s) => s.setOnboardingComplete);
  const setProfile = useAppStore((s) => s.setProfile);
  const setTargets = useAppStore((s) => s.setTargets);

  const update = (patch: Partial<Form>): void => setForm((f) => ({ ...f, ...patch }));

  const finish = (): void => {
    const profile = parseProfile(form);
    setProfile(profile);
    setTargets(computeTargets(profile));
    setOnboardingComplete(true);
    onComplete();
  };

  const handleNext = (): void => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      finish();
    }
  };

  const handleBack = (): void => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const StepComponent = STEPS[currentStep];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.progressBar}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[styles.progressDot, i <= currentStep ? styles.progressDotActive : styles.progressDotInactive]}
          />
        ))}
      </View>
      <Text style={styles.stepCounter}>Step {currentStep + 1} of {TOTAL_STEPS}</Text>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <StepComponent
            form={form}
            update={update}
            onNext={handleNext}
            onBack={currentStep > 0 ? handleBack : undefined}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: space.lg },
  progressBar: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingTop: 12 },
  progressDot: { width: 8, height: 8, borderRadius: 4 },
  progressDotActive: { backgroundColor: tokens.accent },
  progressDotInactive: { backgroundColor: tokens.track },
  stepCounter: {
    textAlign: 'center',
    fontFamily: font.numeric,
    fontSize: type.caption,
    color: tokens.inkFaint,
    marginBottom: 4,
  },
  stepContainer: { flex: 1, gap: 14 },
  title: { fontFamily: font.display, fontSize: type.screenTitle, color: tokens.ink, marginBottom: 4 },
  body: { fontFamily: font.body, fontSize: 15, color: tokens.inkMuted, lineHeight: 22 },
  fieldLabel: { fontFamily: font.body, fontSize: type.body, color: tokens.ink, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: tokens.border,
    borderRadius: radius.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: tokens.surface,
    fontFamily: font.body,
    fontSize: type.body,
    color: tokens.ink,
  },
  segmentRow: { flexDirection: 'row', gap: 8 },
  segment: {
    flex: 1,
    borderWidth: 1,
    borderColor: tokens.border,
    borderRadius: radius.chip,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    backgroundColor: tokens.surface,
  },
  segmentActive: { backgroundColor: tokens.accent, borderColor: tokens.accent },
  segmentText: { fontFamily: font.body, fontSize: 13, color: tokens.inkMuted },
  segmentTextActive: { fontFamily: font.bodyBold, color: tokens.surface },
  selectRow: {
    borderWidth: 1,
    borderColor: tokens.border,
    borderRadius: radius.card,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: tokens.surface,
    minHeight: 44,
    justifyContent: 'center',
  },
  selectRowActive: { borderColor: tokens.accent, backgroundColor: tokens.accentSoft },
  selectRowText: { fontFamily: font.body, fontSize: type.body, color: tokens.ink },
  selectRowTextActive: { fontFamily: font.bodyBold, color: tokens.accent },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selChip: {
    borderWidth: 1,
    borderColor: tokens.border,
    borderRadius: radius.badge,
    paddingHorizontal: 14,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.surface,
  },
  selChipActive: { borderColor: tokens.accent, backgroundColor: tokens.accentSoft },
  selChipText: { fontFamily: font.body, fontSize: 13, color: tokens.inkMuted },
  selChipTextActive: { fontFamily: font.bodyBold, color: tokens.accent },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
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
  planCard: { backgroundColor: tokens.surfaceWarm, borderRadius: radius.card, padding: 16, gap: 10 },
  planRowWrap: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planLabel: { fontFamily: font.body, fontSize: 15, color: tokens.ink },
  planValue: { fontFamily: font.numeric, fontSize: 15, color: tokens.accent },
  hint: { fontFamily: font.body, fontSize: type.caption, color: tokens.inkFaint },
});
