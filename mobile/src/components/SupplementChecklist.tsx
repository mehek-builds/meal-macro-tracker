// ============================================================
// SupplementChecklist - daily supplement tracker (Section 12).
// Replaces the food-derived micronutrient strip on the dashboard. Shows the
// user's real protocol (from the vault) grouped by time of day; one tap marks
// a supplement taken for the day. Includes a daily-reminders toggle.
// ============================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Pill, Check, Bell, BellOff } from '@/theme/icons';
import { tokens, font, type, radius, space, shadow } from '@/theme/tokens';
import { SUPPLEMENT_SCHEDULE, TIME_ORDER, TIME_LABEL } from '@/data/supplements';

interface SupplementChecklistProps {
  takenIds: string[];
  onToggle: (id: string) => void;
  remindersOn: boolean;
  onToggleReminders: () => void;
}

export function SupplementChecklist({
  takenIds,
  onToggle,
  remindersOn,
  onToggleReminders,
}: SupplementChecklistProps): React.ReactElement {
  const total = SUPPLEMENT_SCHEDULE.length;
  const takenCount = SUPPLEMENT_SCHEDULE.filter((s) => takenIds.includes(s.id)).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Pill size={16} color={tokens.accent} strokeWidth={2} />
          <Text style={styles.title}>Supplements</Text>
        </View>
        <Text style={styles.count}>
          {takenCount} of {total} taken
        </Text>
      </View>

      {TIME_ORDER.map((time) => {
        const items = SUPPLEMENT_SCHEDULE.filter((s) => s.time === time);
        if (items.length === 0) return null;
        return (
          <View key={time} style={styles.group}>
            <Text style={styles.groupLabel}>{TIME_LABEL[time]}</Text>
            {items.map((s) => {
              const taken = takenIds.includes(s.id);
              return (
                <TouchableOpacity
                  key={s.id}
                  style={styles.row}
                  activeOpacity={0.7}
                  onPress={() => onToggle(s.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: taken }}
                  accessibilityLabel={`${s.name}, ${s.dose}, ${taken ? 'taken' : 'not taken'}`}
                >
                  <View style={[styles.checkbox, taken && styles.checkboxOn]}>
                    {taken ? <Check size={14} color={tokens.surface} strokeWidth={3} /> : null}
                  </View>
                  <View style={styles.info}>
                    <Text style={[styles.name, taken && styles.nameTaken]}>
                      {s.name} <Text style={styles.dose}>· {s.dose}</Text>
                    </Text>
                    <Text style={styles.note}>{s.note}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      })}

      <TouchableOpacity
        style={styles.reminderBtn}
        activeOpacity={0.7}
        onPress={onToggleReminders}
        accessibilityRole="button"
      >
        {remindersOn ? (
          <Bell size={15} color={tokens.accent} strokeWidth={2} />
        ) : (
          <BellOff size={15} color={tokens.accent} strokeWidth={2} />
        )}
        <Text style={styles.reminderText}>
          {remindersOn ? 'Daily reminders on' : 'Turn on daily reminders'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.surface,
    borderRadius: radius.card,
    padding: space.md,
    ...shadow.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontFamily: font.bodyBold, fontSize: type.body, color: tokens.ink },
  count: { fontFamily: font.numeric, fontSize: 13, color: tokens.inkMuted },
  group: { marginBottom: 6 },
  groupLabel: {
    fontFamily: font.bodyBold,
    fontSize: type.caption,
    color: tokens.inkFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 6,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 8,
    minHeight: 44,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: tokens.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxOn: {
    backgroundColor: tokens.accent,
    borderColor: tokens.accent,
  },
  info: { flex: 1 },
  name: { fontFamily: font.bodyBold, fontSize: type.body, color: tokens.ink },
  nameTaken: { color: tokens.inkFaint, textDecorationLine: 'line-through' },
  dose: { fontFamily: font.body, color: tokens.inkMuted },
  note: {
    fontFamily: font.body,
    fontSize: 12,
    color: tokens.inkFaint,
    marginTop: 2,
    lineHeight: 16,
  },
  reminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: tokens.accentSoft,
    borderRadius: radius.chip,
    paddingHorizontal: 14,
    minHeight: 44,
    marginTop: 8,
  },
  reminderText: { fontFamily: font.bodyBold, fontSize: 13, color: tokens.accent },
});
