// ============================================================
// SettingsScreen - Sections 9.4, 15.2, 10, 11.5
// Net-calorie mode, training mode, water goal, cycle override.
// ============================================================

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useAppStore } from '@/state/useAppStore';
import type { NetCalorieMode, TrainingMode } from '@/types';

// TrainingMode is used for the settings UI but is no longer stored on UserProfile
// (profile.goal / training phase are separate backend fields). The segmented control
// below drives a local UI state only until a /training/mode endpoint is wired up.

// ---- Generic SegmentedRow ----
interface SegmentedRowProps<T extends string> {
  label: string;
  description?: string;
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (v: T) => void;
}

function SegmentedRow<T extends string>({
  label,
  description,
  options,
  selected,
  onSelect,
}: SegmentedRowProps<T>): React.ReactElement {
  return (
    <View style={styles.settingBlock}>
      <Text style={styles.settingLabel}>{label}</Text>
      {description && <Text style={styles.settingDesc}>{description}</Text>}
      <View style={styles.segmentRow}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.segment,
              selected === opt.value && styles.segmentActive,
            ]}
            onPress={() => onSelect(opt.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.segmentText,
                selected === opt.value && styles.segmentTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ---- Net calorie mode descriptions (Section 9.4) ----
const NET_CAL_DESCRIPTIONS: Record<NetCalorieMode, string> = {
  fixed: 'Target stays static. Burn data shown but does not affect budget.',
  eat_back: 'Burned calories are added back to your budget. Best for hard training days.',
  net: 'Tracks calories in - calories out vs. your BMR floor.',
};

// ---- Training mode descriptions (Section 15.2) ----
const TRAINING_MODE_DESCRIPTIONS: Record<TrainingMode, string> = {
  muscle_gain: 'Surplus calories, limit cardio, GZCLP strength log.',
  marathon: 'Higher carb days on long runs, Zone 2 HR ceiling, in-run fueling reminders.',
  both: 'Strength 2x/week + marathon training. Active during overlap period.',
};

export function SettingsScreen(): React.ReactElement {
  const profile = useAppStore((s) => s.profile);
  const setNetCalorieMode = useAppStore((s) => s.setNetCalorieMode);
  // trainingMode is local UI state only — no longer a UserProfile field
  const [trainingMode, setTrainingMode] = React.useState<TrainingMode>('muscle_gain');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.screenTitle}>Settings</Text>

        {/* Net Calorie Mode - Section 9.4 */}
        <Text style={styles.groupHeader}>Calorie tracking</Text>
        <SegmentedRow<NetCalorieMode>
          label="Net calorie mode"
          description={NET_CAL_DESCRIPTIONS[profile.netCalorieMode]}
          options={[
            { value: 'fixed', label: 'Fixed' },
            { value: 'eat_back', label: 'Eat-back' },
            { value: 'net', label: 'Net' },
          ]}
          selected={profile.netCalorieMode}
          onSelect={(mode) => {
            setNetCalorieMode(mode);
            // TODO(Section 9.4) - call setNetCalorieMode() API endpoint
          }}
        />

        {/* Training Mode - Section 15.2 */}
        <Text style={styles.groupHeader}>Training</Text>
        <SegmentedRow<TrainingMode>
          label="Training mode"
          description={TRAINING_MODE_DESCRIPTIONS[trainingMode]}
          options={[
            { value: 'muscle_gain', label: 'Muscle' },
            { value: 'marathon', label: 'Marathon' },
            { value: 'both', label: 'Both' },
          ]}
          selected={trainingMode}
          onSelect={(mode) => {
            setTrainingMode(mode);
            // TODO(Section 15.2) - call setTrainingMode() API endpoint
          }}
        />

        {/* Race Calendar stub - Section 15.4 */}
        <View style={styles.settingBlock}>
          <Text style={styles.settingLabel}>Race calendar</Text>
          <Text style={styles.settingDesc}>
            Race-week carb loading activates 7 days before each race. (Section 15.4)
          </Text>
          <TouchableOpacity style={styles.linkBtn}>
            <Text style={styles.linkText}>Manage races - TODO(Section 15.4)</Text>
          </TouchableOpacity>
        </View>

        {/* Water Goal - Section 10 */}
        <Text style={styles.groupHeader}>Hydration</Text>
        <View style={styles.settingBlock}>
          <Text style={styles.settingLabel}>Water goals</Text>
          <Text style={styles.settingDesc}>
            {profile.waterGoalOz != null
              ? `Override: ${profile.waterGoalOz} oz/day`
              : 'Auto-calculated from training duration (Section 10)'}
          </Text>
          {/* TODO(Section 10) - editable numeric inputs + setWaterGoal() API call */}
          <TouchableOpacity style={styles.linkBtn}>
            <Text style={styles.linkText}>Edit water goals - TODO(Section 10)</Text>
          </TouchableOpacity>
        </View>

        {/* Cycle Override - Section 11.5 */}
        <Text style={styles.groupHeader}>Cycle tracking</Text>
        <View style={styles.settingBlock}>
          <Text style={styles.settingLabel}>Manual cycle override</Text>
          <Text style={styles.settingDesc}>
            If HealthKit has no cycle data, enter your current cycle day here.
            The app calculates forward until HealthKit data is available. (Section 11.5)
          </Text>
          {/* TODO(Section 11.5) - date picker for last period start + setManualCycle() API call */}
          <TouchableOpacity style={styles.linkBtn}>
            <Text style={styles.linkText}>Set cycle day - TODO(Section 11.5)</Text>
          </TouchableOpacity>
        </View>

        {/* HealthKit - Section 9 */}
        <Text style={styles.groupHeader}>Integrations</Text>
        <View style={styles.settingBlock}>
          <Text style={styles.settingLabel}>Apple Health</Text>
          <Text style={styles.settingDesc}>
            Requires a native build (not Expo Go). Reads workouts, steps, active
            calories, body weight, and cycle data. (Section 9.2)
          </Text>
          <TouchableOpacity style={styles.linkBtn}>
            <Text style={styles.linkText}>Request HealthKit permissions - TODO(Section 9.2)</Text>
          </TouchableOpacity>
        </View>

        {/* Profile edit stub */}
        <Text style={styles.groupHeader}>Profile</Text>
        <View style={styles.settingBlock}>
          <Text style={styles.settingLabel}>Personal details</Text>
          <Text style={styles.settingDesc}>
            Height, weight, age, goal, activity level, dietary restrictions.
            Editable here after onboarding. (Section 6)
          </Text>
          <TouchableOpacity style={styles.linkBtn}>
            <Text style={styles.linkText}>Edit profile - TODO(Section 6)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { padding: 16, paddingBottom: 48 },
  screenTitle: { fontSize: 28, fontWeight: '700', color: '#111827', marginBottom: 16 },
  groupHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 8,
  },
  settingBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  settingLabel: { fontSize: 16, fontWeight: '600', color: '#111827' },
  settingDesc: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  segmentRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  segment: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  segmentActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  segmentText: { fontSize: 13, color: '#6B7280' },
  segmentTextActive: { color: '#FFFFFF', fontWeight: '600' },
  linkBtn: { marginTop: 2 },
  linkText: { fontSize: 14, color: '#3B82F6' },
});
