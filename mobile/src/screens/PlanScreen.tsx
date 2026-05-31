// ============================================================
// PlanScreen - "Plan" tab shell (PRD Section 4).
// Styled placeholder only: meal plan / marathon training / race
// calendar live here. This PRD styles the shell; the feature build
// is out of scope (PRD Section 11).
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { ClipboardList } from '@/theme/icons';
import { tokens, font, type, space, radius, shadow } from '@/theme/tokens';

export function PlanScreen(): React.ReactElement {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Plan</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.iconCircle}>
          <ClipboardList size={30} color={tokens.accent} strokeWidth={2} />
        </View>
        <Text style={styles.headline}>Your day, planned</Text>
        <Text style={styles.sub}>
          Today's meal plan, marathon training, and your race calendar will live
          here. Hang tight while we build it out.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg },
  header: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.sm,
  },
  title: {
    fontFamily: font.display,
    fontSize: type.screenTitle,
    color: tokens.ink,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
    gap: space.md,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.badge,
    backgroundColor: tokens.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  headline: {
    fontFamily: font.display,
    fontSize: type.sectionTitle,
    color: tokens.ink,
    textAlign: 'center',
  },
  sub: {
    fontFamily: font.body,
    fontSize: type.body,
    color: tokens.inkMuted,
    textAlign: 'center',
    lineHeight: 21,
  },
});
