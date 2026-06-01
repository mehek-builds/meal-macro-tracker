// ============================================================
// SupplementsScreen - the "Me -> Supplements" screen (Section 12).
// Renders the same real daily checklist as the dashboard, backed by the shared
// store state, so logging a supplement here or on the dashboard stays in sync.
// No mock data: the list comes from the vault-sourced SUPPLEMENT_SCHEDULE and
// the taken state from the persisted store (resets daily).
// ============================================================

import React from 'react';
import { Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useAppStore } from '@/state/useAppStore';
import { SupplementChecklist } from '@/components/SupplementChecklist';
import { tokens, font, type, space } from '@/theme/tokens';

export function SupplementsScreen(): React.ReactElement {
  const supplementsTaken = useAppStore((s) => s.supplementsTaken);
  const toggleSupplementTaken = useAppStore((s) => s.toggleSupplementTaken);
  const today = new Date().toISOString().slice(0, 10);
  const takenIds = supplementsTaken.date === today ? supplementsTaken.ids : [];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sub}>Your daily protocol. Tap to log each one.</Text>
        <SupplementChecklist takenIds={takenIds} onToggle={toggleSupplementTaken} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg },
  scroll: { padding: space.lg, paddingBottom: space.xxl, gap: space.md },
  sub: { fontFamily: font.body, fontSize: type.body, color: tokens.inkMuted },
});
