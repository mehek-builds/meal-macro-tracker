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

// Real data only. These populate from what the user logs; measurement /
// bloodwork entry and persisted water history are not yet wired, so they start
// empty and the sections render honest empty states until real data exists.
const MEASUREMENTS: BodyMeasurement[] = [];
const BLOODWORK: BloodworkResult[] = [];
const WEEKLY_WATER: { day: string; oz: number; goalMet: boolean }[] = [];

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
      {MEASUREMENTS.length === 0 ? (
        <EmptyState title="Log a few months to see trends." />
      ) : (
        MEASUREMENTS.map((m) => (
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
      {BLOODWORK.length === 0 ? (
        <EmptyState title="No results yet. Add your last panel." />
      ) : (
        BLOODWORK.map((b) => (
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
  if (WEEKLY_WATER.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly water</Text>
        <Text style={styles.sectionHint}>
          Your daily water totals will chart here as you log water each day.
        </Text>
        <EmptyState title="No water history yet." />
      </View>
    );
  }

  const daysHitGoal = WEEKLY_WATER.filter((d) => d.goalMet).length;
  const weeklyAvg = Math.round(
    WEEKLY_WATER.reduce((s, d) => s + d.oz, 0) / WEEKLY_WATER.length,
  );
  const maxOz = Math.max(...WEEKLY_WATER.map((d) => d.oz));

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Weekly water</Text>

      <View style={styles.card}>
        <View style={styles.barChart}>
          {WEEKLY_WATER.map((d) => {
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
          Weekly avg: {weeklyAvg} oz · Hit goal {daysHitGoal} of {WEEKLY_WATER.length} days
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
