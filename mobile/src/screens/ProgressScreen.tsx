// ============================================================
// ProgressScreen - Sections 13, 14, 10.7
// Body measurements + bloodwork log + weekly water view.
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

type ProgressTab = 'measurements' | 'bloodwork' | 'water';

// Mock measurements (Section 13)
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

// Mock bloodwork (Section 14)
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

// Mock weekly water data (Section 10.7)
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

// ---------- Sub-sections ----------

function MeasurementsSection(): React.ReactElement {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Body Measurements</Text>
      <Text style={styles.sectionHint}>
        Measured monthly. Rising arms/thighs + stable waist = lean gain. (Section 13)
      </Text>
      {/* TODO(Section 13.2) - chart view per measurement over time */}
      {MOCK_MEASUREMENTS.map((m) => (
        <View key={m.id} style={styles.measureCard}>
          <Text style={styles.measureDate}>{m.date}</Text>
          <View style={styles.measureGrid}>
            <MeasureItem label="Upper arm" value={m.upperArmCm} />
            <MeasureItem label="Chest" value={m.chestCm} />
            <MeasureItem label="Waist" value={m.waistCm} />
            <MeasureItem label="Hips" value={m.hipsCm} />
            <MeasureItem label="Thigh" value={m.thighCm} />
          </View>
          {m.notes && <Text style={styles.notes}>{m.notes}</Text>}
        </View>
      ))}
      {/* TODO(Section 13.2) - monthly reminder + add entry button */}
      <TouchableOpacity style={styles.addBtn}>
        <Text style={styles.addBtnText}>+ Log measurements</Text>
      </TouchableOpacity>
    </View>
  );
}

function MeasureItem({ label, value }: { label: string; value: number }): React.ReactElement {
  return (
    <View style={styles.measureItem}>
      <Text style={styles.measureLabel}>{label}</Text>
      <Text style={styles.measureValue}>{value} cm</Text>
    </View>
  );
}

function statusColor(status: BloodworkResult['status']): string {
  switch (status) {
    case 'low': return '#EF4444';
    case 'high': return '#F59E0B';
    case 'normal': return '#22C55E';
    case 'pending': return '#9CA3AF';
  }
}

function BloodworkSection(): React.ReactElement {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Bloodwork</Text>
      <Text style={styles.sectionHint}>
        Results and upcoming retests. (Section 14)
      </Text>
      {/* TODO(Section 14.2) - chart each marker over time with reference band */}
      {MOCK_BLOODWORK.map((b) => (
        <View key={b.id} style={styles.bloodCard}>
          <View style={styles.bloodHeader}>
            <Text style={styles.markerName}>{b.markerName}</Text>
            <Text style={[styles.statusBadge, { color: statusColor(b.status) }]}>
              {b.status.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.bloodValue}>
            {b.value} {b.unit} (ref: {b.refRangeLow}-{b.refRangeHigh} {b.unit})
          </Text>
          <Text style={styles.bloodDate}>Tested: {b.date}</Text>
          {b.retestDate && (
            <Text style={styles.retestDate}>Retest: {b.retestDate}</Text>
          )}
          {b.notes && <Text style={styles.notes}>{b.notes}</Text>}
        </View>
      ))}
      <TouchableOpacity style={styles.addBtn}>
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
      <Text style={styles.sectionTitle}>Weekly Water</Text>
      <Text style={styles.sectionHint}>Section 10.7 - goal line: {WATER_GOAL_OZ} oz/day</Text>

      {/* Bar chart stub */}
      <View style={styles.barChart}>
        {MOCK_WEEKLY_WATER.map((d) => {
          const height = Math.round((d.oz / maxOz) * 100);
          return (
            <View key={d.day} style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  { height: height, backgroundColor: d.goalMet ? '#22C55E' : '#D1D5DB' },
                ]}
              />
              <Text style={styles.barLabel}>{d.day}</Text>
              <Text style={styles.barOz}>{d.oz}</Text>
            </View>
          );
        })}
      </View>
      {/* TODO(Section 10.7) - draw goal line across chart at WATER_GOAL_OZ level */}
      <Text style={styles.waterStats}>
        Weekly avg: {weeklyAvg} oz - Hit goal {daysHitGoal} of 7 days
      </Text>
    </View>
  );
}

// ---------- Main screen ----------
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
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { padding: 16, paddingBottom: 32 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabText: { fontSize: 14, color: '#6B7280' },
  tabTextActive: { color: '#3B82F6', fontWeight: '600' },
  section: { gap: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  sectionHint: { fontSize: 13, color: '#9CA3AF' },
  measureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  measureDate: { fontSize: 13, color: '#6B7280', marginBottom: 8 },
  measureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  measureItem: { width: '45%' },
  measureLabel: { fontSize: 12, color: '#9CA3AF' },
  measureValue: { fontSize: 16, fontWeight: '600', color: '#111827', marginTop: 2 },
  notes: { fontSize: 12, color: '#9CA3AF', marginTop: 8 },
  addBtn: {
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
  },
  addBtnText: { color: '#3B82F6', fontSize: 14, fontWeight: '500' },
  bloodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  bloodHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  markerName: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1 },
  statusBadge: { fontSize: 11, fontWeight: '700' },
  bloodValue: { fontSize: 14, color: '#374151' },
  bloodDate: { fontSize: 12, color: '#9CA3AF' },
  retestDate: { fontSize: 12, color: '#F59E0B' },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: 6,
    paddingTop: 8,
  },
  barWrapper: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '80%', borderRadius: 3, minHeight: 4 },
  barLabel: { fontSize: 10, color: '#6B7280', marginTop: 4 },
  barOz: { fontSize: 9, color: '#9CA3AF' },
  waterStats: { fontSize: 13, color: '#374151', marginTop: 8 },
});
