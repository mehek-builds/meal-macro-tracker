// ============================================================
// ProgressScreen - measurements + bloodwork + weekly water.
// Nourish reskin with warm cards and empty states (PRD 6.4 / 7).
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import type { BodyMeasurement, BloodworkResult } from '@/types';
import { LineChart } from '@/theme/icons';
import { tokens, font, type, radius, space, shadow } from '@/theme/tokens';

type ProgressTab = 'measurements' | 'bloodwork' | 'water';

const MOCK_MEASUREMENTS: BodyMeasurement[] = [
  {
    id: 'meas-1',
    date: '2026-05-01',
    upperArmCm: 23,
    chestCm: 74,
    waistCm: 61,
    hipsCm: 80,
    thighCm: 44,
    notes: 'Start of tracking',
  },
];

const MOCK_BLOODWORK: BloodworkResult[] = [
  {
    id: 'bw-1',
    date: '2026-05-01',
    markerName: 'Vitamin D (25-OH)',
    value: 29.2,
    unit: 'ng/mL',
    refRangeLow: 40,
    refRangeHigh: 60,
    status: 'low',
    retestDate: '2026-07-15',
    notes: 'Target 40-60 ng/mL. Currently on 10,000 IU D3.',
  },
  {
    id: 'bw-2',
    date: '2026-05-01',
    markerName: 'Ferritin',
    value: 32,
    unit: 'ng/mL',
    refRangeLow: 40,
    refRangeHigh: 100,
    status: 'low',
    retestDate: '2026-08-01',
    notes: '~26 with lab calibration. Supplementing with Eiron CR.',
  },
  {
    id: 'bw-3',
    date: '2026-05-01',
    markerName: 'Hemoglobin',
    value: 13.0,
    unit: 'g/dL',
    refRangeLow: 11.1,
    refRangeHigh: 15.9,
    status: 'normal',
    retestDate: null,
    notes: null,
  },
];

const MOCK_WEEKLY_WATER = [
  { day: 'Mon', oz: 90, goalMet: true },
  { day: 'Tue', oz: 72, goalMet: false },
  { day: 'Wed', oz: 85, goalMet: true },
  { day: 'Thu', oz: 96, goalMet: true },
  { day: 'Fri', oz: 60, goalMet: false },
  { day: 'Sat', oz: 88, goalMet: true },
  { day: 'Sun', oz: 52, goalMet: false },
];
const WATER_GOAL_OZ = 85;

// ---------- shared ----------

function EmptyState({ title }: { title: string }): React.ReactElement {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <LineChart size={26} color={tokens.accent} strokeWidth={2} />
      </View>
      <Text style={styles.emptyText}>{title}</Text>
    </View>
  );
}

// ---------- sections ----------

function MeasurementsSection(): React.ReactElement {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Body measurements</Text>
      <Text style={styles.sectionHint}>
        Measured monthly. Rising arms and thighs with a stable waist = lean gain.
      </Text>
      {MOCK_MEASUREMENTS.length === 0 ? (
        <EmptyState title="Log a few months to see trends." />
      ) : (
        MOCK_MEASUREMENTS.map((m) => (
          <View key={m.id} style={styles.card}>
            <Text style={styles.cardDate}>{m.date}</Text>
            <View style={styles.measureGrid}>
              <MeasureItem label="Upper arm" value={m.upperArmCm} />
              <MeasureItem label="Chest" value={m.chestCm} />
              <MeasureItem label="Waist" value={m.waistCm} />
              <MeasureItem label="Hips" value={m.hipsCm} />
              <MeasureItem label="Thigh" value={m.thighCm} />
            </View>
            {m.notes && <Text style={styles.notes}>{m.notes}</Text>}
          </View>
        ))
      )}
      <TouchableOpacity style={styles.addBtn} accessibilityRole="button">
        <Text style={styles.addBtnText}>+ Log measurements</Text>
      </TouchableOpacity>
    </View>
  );
}

function MeasureItem({ label, value }: { label: string; value?: number | null }): React.ReactElement {
  return (
    <View style={styles.measureItem}>
      <Text style={styles.measureLabel}>{label}</Text>
      <Text style={styles.measureValue}>{value} cm</Text>
    </View>
  );
}

function statusColor(status: BloodworkResult['status']): string {
  switch (status) {
    case 'low': return tokens.stateUnder;
    case 'high': return tokens.stateClose;
    case 'normal': return tokens.stateOnTrack;
    case 'pending': return tokens.inkFaint;
  }
}

function BloodworkSection(): React.ReactElement {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Bloodwork</Text>
      <Text style={styles.sectionHint}>Results and upcoming retests.</Text>
      {MOCK_BLOODWORK.length === 0 ? (
        <EmptyState title="No results yet. Add your last panel." />
      ) : (
        MOCK_BLOODWORK.map((b) => (
          <View key={b.id} style={styles.card}>
            <View style={styles.bloodHeader}>
              <Text style={styles.markerName}>{b.markerName}</Text>
              <Text style={[styles.statusBadge, { color: statusColor(b.status) }]}>
                {b.status.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.bloodValue}>
              {b.value} {b.unit} (ref: {b.refRangeLow}-{b.refRangeHigh} {b.unit})
            </Text>
            <Text style={styles.cardDate}>Tested: {b.date}</Text>
            {b.retestDate && <Text style={styles.retestDate}>Retest: {b.retestDate}</Text>}
            {b.notes && <Text style={styles.notes}>{b.notes}</Text>}
          </View>
        ))
      )}
      <TouchableOpacity style={styles.addBtn} accessibilityRole="button">
        <Text style={styles.addBtnText}>+ Log bloodwork result</Text>
      </TouchableOpacity>
    </View>
  );
}

function WeeklyWaterSection(): React.ReactElement {
  const daysHitGoal = MOCK_WEEKLY_WATER.filter((d) => d.goalMet).length;
  const weeklyAvg = Math.round(
    MOCK_WEEKLY_WATER.reduce((s, d) => s + d.oz, 0) / MOCK_WEEKLY_WATER.length,
  );
  const maxOz = Math.max(...MOCK_WEEKLY_WATER.map((d) => d.oz), WATER_GOAL_OZ);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Weekly water</Text>
      <Text style={styles.sectionHint}>Goal line: {WATER_GOAL_OZ} oz/day</Text>

      <View style={styles.card}>
        <View style={styles.barChart}>
          {MOCK_WEEKLY_WATER.map((d) => {
            const height = Math.round((d.oz / maxOz) * 100);
            return (
              <View key={d.day} style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    { height, backgroundColor: d.goalMet ? tokens.stateOnTrack : tokens.track },
                  ]}
                />
                <Text style={styles.barLabel}>{d.day}</Text>
                <Text style={styles.barOz}>{d.oz}</Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.waterStats}>
          Weekly avg: {weeklyAvg} oz · Hit goal {daysHitGoal} of 7 days
        </Text>
      </View>
    </View>
  );
}

// ---------- main ----------
export function ProgressScreen(): React.ReactElement {
  const [tab, setTab] = useState<ProgressTab>('measurements');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.tabBar}>
        {(['measurements', 'bloodwork', 'water'] as ProgressTab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {tab === 'measurements' && <MeasurementsSection />}
        {tab === 'bloodwork' && <BloodworkSection />}
        {tab === 'water' && <WeeklyWaterSection />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg },
  scroll: { padding: space.lg, paddingBottom: space.xxl },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: tokens.surface,
    borderBottomWidth: 1,
    borderBottomColor: tokens.border,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: tokens.accent },
  tabText: { fontFamily: font.body, fontSize: type.body, color: tokens.inkMuted },
  tabTextActive: { fontFamily: font.bodyBold, color: tokens.accent },
  section: { gap: 12 },
  sectionTitle: { fontFamily: font.display, fontSize: type.sectionTitle, color: tokens.ink },
  sectionHint: { fontFamily: font.body, fontSize: 13, color: tokens.inkMuted },
  card: {
    backgroundColor: tokens.surface,
    borderRadius: radius.card,
    padding: space.md,
    gap: 4,
    ...shadow.card,
  },
  cardDate: { fontFamily: font.numeric, fontSize: 12, color: tokens.inkFaint },
  measureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  measureItem: { width: '45%' },
  measureLabel: { fontFamily: font.body, fontSize: 12, color: tokens.inkFaint },
  measureValue: { fontFamily: font.numeric, fontSize: type.statValue, color: tokens.ink, marginTop: 2 },
  notes: { fontFamily: font.body, fontSize: 12, color: tokens.inkMuted, marginTop: 8 },
  addBtn: {
    backgroundColor: tokens.accentSoft,
    borderRadius: radius.card,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  addBtnText: { fontFamily: font.bodyBold, color: tokens.accent, fontSize: type.body },
  bloodHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  markerName: { fontFamily: font.bodyBold, fontSize: type.body, color: tokens.ink, flex: 1 },
  statusBadge: { fontFamily: font.bodyBold, fontSize: type.caption },
  bloodValue: { fontFamily: font.numeric, fontSize: 13, color: tokens.ink },
  retestDate: { fontFamily: font.numeric, fontSize: 12, color: tokens.stateClose },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 6, paddingTop: 8 },
  barWrapper: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '80%', borderRadius: 3, minHeight: 4 },
  barLabel: { fontFamily: font.body, fontSize: 10, color: tokens.inkMuted, marginTop: 4 },
  barOz: { fontFamily: font.numeric, fontSize: 9, color: tokens.inkFaint },
  waterStats: { fontFamily: font.body, fontSize: 13, color: tokens.inkMuted, marginTop: 10 },
  emptyCard: {
    backgroundColor: tokens.surface,
    borderRadius: radius.card,
    padding: space.xl,
    alignItems: 'center',
    gap: 12,
    ...shadow.card,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.badge,
    backgroundColor: tokens.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { fontFamily: font.body, fontSize: type.body, color: tokens.inkMuted, textAlign: 'center' },
});
