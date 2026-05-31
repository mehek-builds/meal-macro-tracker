// ============================================================
// SupplementsScreen - Section 12
// Lists active supplements, today's status, timing conflict warnings.
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
} from 'react-native';
import type { SupplementStatus } from '@/types';

// Mock data matching current protocol (Section 12.1)
const MOCK_SUPPLEMENTS: SupplementStatus[] = [
  {
    id: 'vitd3',
    name: 'Vitamin D3',
    dose: '10,000 IU',
    takenToday: false,
    takenAt: null,
    nextSafeTime: null,
  },
  {
    id: 'vitk2',
    name: 'Vitamin K2 (MK-7)',
    dose: '100-200 mcg',
    takenToday: false,
    takenAt: null,
    nextSafeTime: null,
  },
  {
    id: 'iron',
    name: 'Eiron CR (iron)',
    dose: '60mg (2x30mg)',
    takenToday: false,
    takenAt: null,
    nextSafeTime: null, // Calculated by backend when conflicts exist
  },
  {
    id: 'creatine',
    name: 'Creatine monohydrate',
    dose: '3-5g',
    takenToday: false,
    takenAt: null,
    nextSafeTime: null,
  },
  {
    id: 'magnesium',
    name: 'Magnesium glycinate',
    dose: '200-400mg',
    takenToday: false,
    takenAt: null,
    nextSafeTime: null,
  },
  {
    id: 'b12',
    name: 'B12',
    dose: 'TBD after bloodwork',
    takenToday: false,
    takenAt: null,
    nextSafeTime: null,
  },
];

// Retest reminders (Section 12.4)
const RETEST_DATES = [
  { supplement: 'Vitamin D', date: 'Mid-July 2026', notes: 'Drop to 2,000-4,000 IU once at 40-60 ng/mL' },
  { supplement: 'Ferritin', date: 'Early August 2026', notes: 'Iron absorption check' },
];

export function SupplementsScreen(): React.ReactElement {
  const [supplements, setSupplements] = useState<SupplementStatus[]>(MOCK_SUPPLEMENTS);

  const handleLog = (id: string): void => {
    // TODO(Section 12.2) - call logSupplement() endpoint, display conflict warnings from response
    setSupplements((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, takenToday: true, takenAt: new Date().toISOString() }
          : s,
      ),
    );
  };

  const renderItem = ({ item }: { item: SupplementStatus }): React.ReactElement => (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.supName}>{item.name}</Text>
        <Text style={styles.dose}>{item.dose}</Text>
        {item.takenAt && (
          <Text style={styles.takenAt}>
            Taken at {new Date(item.takenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
        {item.nextSafeTime && (
          <Text style={styles.conflict}>
            Wait until {item.nextSafeTime} to avoid conflict
          </Text>
        )}
      </View>
      {item.takenToday ? (
        <View style={styles.doneTag}>
          <Text style={styles.doneText}>Done</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.logBtn}
          onPress={() => handleLog(item.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.logBtnText}>Log taken</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={supplements}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.screenTitle}>Supplements</Text>
            <Text style={styles.screenSub}>
              Today's protocol. Tap to log each one.
            </Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <Text style={styles.footerTitle}>Upcoming retests</Text>
            {RETEST_DATES.map((r) => (
              <View key={r.supplement} style={styles.retestRow}>
                <Text style={styles.retestName}>{r.supplement}</Text>
                <Text style={styles.retestDate}>{r.date}</Text>
                <Text style={styles.retestNote}>{r.notes}</Text>
              </View>
            ))}
            {/* TODO(Section 12.4) - push notification scheduling for retest reminders */}
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  listContent: { paddingBottom: 32 },
  listHeader: { padding: 16, paddingBottom: 8 },
  screenTitle: { fontSize: 24, fontWeight: '700', color: '#111827' },
  screenSub: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  info: { flex: 1 },
  supName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  dose: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  takenAt: { fontSize: 12, color: '#22C55E', marginTop: 3 },
  conflict: { fontSize: 12, color: '#EF4444', marginTop: 3 },
  doneTag: {
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  doneText: { color: '#16A34A', fontSize: 13, fontWeight: '600' },
  logBtn: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  logBtnText: { color: '#3B82F6', fontSize: 13, fontWeight: '600' },
  separator: { height: 1, backgroundColor: '#F3F4F6' },
  footer: {
    margin: 16,
    padding: 14,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
  },
  footerTitle: { fontSize: 16, fontWeight: '600', color: '#92400E', marginBottom: 10 },
  retestRow: { marginBottom: 10 },
  retestName: { fontSize: 14, fontWeight: '500', color: '#78350F' },
  retestDate: { fontSize: 13, color: '#92400E', marginTop: 1 },
  retestNote: { fontSize: 12, color: '#B45309', marginTop: 1 },
});
