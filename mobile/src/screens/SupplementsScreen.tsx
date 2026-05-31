// ============================================================
// SupplementsScreen - protocol, today's status, retests (Section 12).
// Nourish reskin: white cards, terracotta log buttons, warm retest
// callout, Pill icon on timing conflicts.
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
import { Pill } from '@/theme/icons';
import { tokens, font, type, radius, space, shadow } from '@/theme/tokens';

const MOCK_SUPPLEMENTS: SupplementStatus[] = [
  { id: 'vitd3', name: 'Vitamin D3', dose: '10,000 IU', takenToday: false, takenAt: null, nextSafeTime: null },
  { id: 'vitk2', name: 'Vitamin K2 (MK-7)', dose: '100-200 mcg', takenToday: false, takenAt: null, nextSafeTime: null },
  { id: 'iron', name: 'Eiron CR (iron)', dose: '60mg (2x30mg)', takenToday: false, takenAt: null, nextSafeTime: null },
  { id: 'creatine', name: 'Creatine monohydrate', dose: '3-5g', takenToday: false, takenAt: null, nextSafeTime: null },
  { id: 'magnesium', name: 'Magnesium glycinate', dose: '200-400mg', takenToday: false, takenAt: null, nextSafeTime: null },
  { id: 'b12', name: 'B12', dose: 'TBD after bloodwork', takenToday: false, takenAt: null, nextSafeTime: null },
];

const RETEST_DATES = [
  { supplement: 'Vitamin D', date: 'Mid-July 2026', notes: 'Drop to 2,000-4,000 IU once at 40-60 ng/mL' },
  { supplement: 'Ferritin', date: 'Early August 2026', notes: 'Iron absorption check' },
];

export function SupplementsScreen(): React.ReactElement {
  const [supplements, setSupplements] = useState<SupplementStatus[]>(MOCK_SUPPLEMENTS);

  const handleLog = (id: string): void => {
    setSupplements((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, takenToday: true, takenAt: new Date().toISOString() } : s,
      ),
    );
  };

  const renderItem = ({ item }: { item: SupplementStatus }): React.ReactElement => (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.supName}>{item.name}</Text>
        <Text style={styles.dose}>{item.dose}</Text>
        {item.takenAt && (
          <Text style={styles.takenAt}>
            Taken at {new Date(item.takenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
        {item.nextSafeTime && (
          <View style={styles.conflictRow}>
            <Pill size={13} color={tokens.stateClose} strokeWidth={2} />
            <Text style={styles.conflict}>Wait until {item.nextSafeTime} to avoid conflict</Text>
          </View>
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
          activeOpacity={0.85}
          accessibilityRole="button"
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
        ItemSeparatorComponent={() => <View style={{ height: space.sm }} />}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.screenTitle}>Supplements</Text>
            <Text style={styles.screenSub}>Today's protocol. Tap to log each one.</Text>
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
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg },
  listContent: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  listHeader: { paddingTop: space.md, paddingBottom: space.md },
  screenTitle: { fontFamily: font.display, fontSize: type.screenTitle, color: tokens.ink },
  screenSub: { fontFamily: font.body, fontSize: type.body, color: tokens.inkMuted, marginTop: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.md,
    backgroundColor: tokens.surface,
    borderRadius: radius.card,
    ...shadow.card,
  },
  info: { flex: 1 },
  supName: { fontFamily: font.bodyBold, fontSize: type.body, color: tokens.ink },
  dose: { fontFamily: font.numeric, fontSize: 13, color: tokens.inkMuted, marginTop: 2 },
  takenAt: { fontFamily: font.numeric, fontSize: 12, color: tokens.stateOnTrack, marginTop: 4 },
  conflictRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  conflict: { fontFamily: font.body, fontSize: 12, color: tokens.stateClose },
  doneTag: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderRadius: radius.chip,
    paddingHorizontal: 12,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneText: { fontFamily: font.bodyBold, color: tokens.stateOnTrack, fontSize: 13 },
  logBtn: {
    backgroundColor: tokens.accent,
    borderRadius: radius.chip,
    paddingHorizontal: 14,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logBtnText: { fontFamily: font.bodyBold, color: tokens.surface, fontSize: 13 },
  footer: {
    marginTop: space.lg,
    padding: space.md,
    backgroundColor: tokens.surfaceWarm,
    borderRadius: radius.card,
  },
  footerTitle: { fontFamily: font.bodyBold, fontSize: type.body, color: tokens.ink, marginBottom: 10 },
  retestRow: { marginBottom: 10 },
  retestName: { fontFamily: font.bodyBold, fontSize: 13, color: tokens.ink },
  retestDate: { fontFamily: font.numeric, fontSize: 13, color: tokens.accent, marginTop: 1 },
  retestNote: { fontFamily: font.body, fontSize: 12, color: tokens.inkMuted, marginTop: 1 },
});
