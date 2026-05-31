// ============================================================
// SettingsScreen - the "Me" tab home (Sections 9.4, 15.2, 10, 11.5).
// Net-calorie mode, training mode, hydration, cycle, integrations,
// plus a link into Supplements & retests. Nourish reskin.
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
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '@/state/useAppStore';
import type { NetCalorieMode, TrainingMode } from '@/types';
import { setNetCalorieMode as persistNetCalorieMode } from '@/api/endpoints';
import { Pill } from '@/theme/icons';
import { tokens, font, type, radius, space, shadow } from '@/theme/tokens';

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
            style={[styles.segment, selected === opt.value && styles.segmentActive]}
            onPress={() => onSelect(opt.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.segmentText, selected === opt.value && styles.segmentTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const NET_CAL_DESCRIPTIONS: Record<NetCalorieMode, string> = {
  fixed: 'Target stays static. Burn data shown but does not affect budget.',
  eat_back: 'Burned calories are added back to your budget. Best for hard training days.',
  net: 'Tracks calories in minus calories out vs. your BMR floor.',
};

const TRAINING_MODE_DESCRIPTIONS: Record<TrainingMode, string> = {
  muscle_gain: 'Surplus calories, limit cardio, GZCLP strength log.',
  marathon: 'Higher carb days on long runs, Zone 2 HR ceiling, in-run fueling reminders.',
  both: 'Strength 2x/week + marathon training. Active during overlap period.',
};

export function SettingsScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const profile = useAppStore((s) => s.profile);
  const setNetCalorieMode = useAppStore((s) => s.setNetCalorieMode);
  const [trainingMode, setTrainingMode] = React.useState<TrainingMode>('muscle_gain');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.screenTitle}>Me</Text>

        {/* Supplements link */}
        <Text style={styles.groupHeader}>Supplements</Text>
        <TouchableOpacity
          style={styles.settingBlock}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Supplements')}
          accessibilityRole="button"
        >
          <View style={styles.linkRow}>
            <Pill size={18} color={tokens.accent} strokeWidth={2} />
            <View style={styles.flex}>
              <Text style={styles.settingLabel}>Supplements & retests</Text>
              <Text style={styles.settingDesc}>
                Today's protocol, timing conflicts, and upcoming bloodwork retests.
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        </TouchableOpacity>

        {/* Net Calorie Mode */}
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
            void persistNetCalorieMode(mode).catch((err) =>
              console.warn('Could not persist net-calorie mode to backend:', err),
            );
          }}
        />

        {/* Training Mode */}
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
          onSelect={(mode) => setTrainingMode(mode)}
        />

        <View style={styles.settingBlock}>
          <Text style={styles.settingLabel}>Race calendar</Text>
          <Text style={styles.settingDesc}>
            Race-week carb loading activates 7 days before each race.
          </Text>
          <TouchableOpacity style={styles.linkBtn} accessibilityRole="button">
            <Text style={styles.linkText}>Manage races</Text>
          </TouchableOpacity>
        </View>

        {/* Hydration */}
        <Text style={styles.groupHeader}>Hydration</Text>
        <View style={styles.settingBlock}>
          <Text style={styles.settingLabel}>Water goals</Text>
          <Text style={styles.settingDesc}>
            {profile.waterGoalOz != null
              ? `Override: ${profile.waterGoalOz} oz/day`
              : 'Auto-calculated from training duration.'}
          </Text>
          <TouchableOpacity style={styles.linkBtn} accessibilityRole="button">
            <Text style={styles.linkText}>Edit water goals</Text>
          </TouchableOpacity>
        </View>

        {/* Cycle */}
        <Text style={styles.groupHeader}>Cycle tracking</Text>
        <View style={styles.settingBlock}>
          <Text style={styles.settingLabel}>Manual cycle override</Text>
          <Text style={styles.settingDesc}>
            If Apple Health has no cycle data, enter your current cycle day here.
            The app calculates forward until Health data is available.
          </Text>
          <TouchableOpacity style={styles.linkBtn} accessibilityRole="button">
            <Text style={styles.linkText}>Set cycle day</Text>
          </TouchableOpacity>
        </View>

        {/* Integrations */}
        <Text style={styles.groupHeader}>Integrations</Text>
        <View style={styles.settingBlock}>
          <Text style={styles.settingLabel}>Apple Health</Text>
          <Text style={styles.settingDesc}>
            Requires a native build. Reads workouts, steps, active calories, body
            weight, and cycle data.
          </Text>
          <TouchableOpacity style={styles.linkBtn} accessibilityRole="button">
            <Text style={styles.linkText}>Request Health permissions</Text>
          </TouchableOpacity>
        </View>

        {/* Profile */}
        <Text style={styles.groupHeader}>Profile</Text>
        <View style={styles.settingBlock}>
          <Text style={styles.settingLabel}>Personal details</Text>
          <Text style={styles.settingDesc}>
            Height, weight, age, goal, activity level, dietary restrictions.
          </Text>
          <TouchableOpacity style={styles.linkBtn} accessibilityRole="button">
            <Text style={styles.linkText}>Edit profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg },
  scroll: { padding: space.lg, paddingBottom: 48 },
  flex: { flex: 1 },
  screenTitle: { fontFamily: font.display, fontSize: type.screenTitle, color: tokens.ink, marginBottom: 8 },
  groupHeader: {
    fontFamily: font.bodyBold,
    fontSize: type.caption,
    color: tokens.inkFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: space.lg,
    marginBottom: 8,
  },
  settingBlock: {
    backgroundColor: tokens.surface,
    borderRadius: radius.card,
    padding: space.md,
    marginBottom: 8,
    gap: 6,
    ...shadow.card,
  },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chevron: { fontFamily: font.body, fontSize: 22, color: tokens.inkFaint },
  settingLabel: { fontFamily: font.bodyBold, fontSize: type.body, color: tokens.ink },
  settingDesc: { fontFamily: font.body, fontSize: 13, color: tokens.inkMuted, lineHeight: 18 },
  segmentRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  segment: {
    flex: 1,
    borderWidth: 1,
    borderColor: tokens.border,
    borderRadius: radius.chip,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    backgroundColor: tokens.surface,
  },
  segmentActive: { backgroundColor: tokens.accent, borderColor: tokens.accent },
  segmentText: { fontFamily: font.body, fontSize: 13, color: tokens.inkMuted },
  segmentTextActive: { fontFamily: font.bodyBold, color: tokens.surface },
  linkBtn: { marginTop: 2, minHeight: 36, justifyContent: 'center' },
  linkText: { fontFamily: font.bodyBold, fontSize: type.body, color: tokens.accent },
});
