// ============================================================
// MealSection - collapsible meal card (PRD Section 5.4).
// White card, soft warm shadow, Lucide chevrons, terracotta add
// prompts. Empty state is a warm "+ Add [meal]", never a cold
// "no items" message.
// ============================================================

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { FoodLogEntry } from '@/types';
import { Plus, ChevronUp, ChevronDown } from '@/theme/icons';
import { tokens, font, type, radius, space, shadow } from '@/theme/tokens';

interface MealSectionProps {
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  entries: FoodLogEntry[];
  onPressEntry?: (entry: FoodLogEntry) => void;
  onAddFood?: () => void;
}

const MEAL_LABELS: Record<MealSectionProps['meal'], string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
};

export function MealSection({
  meal,
  entries,
  onPressEntry,
  onAddFood,
}: MealSectionProps): React.ReactElement {
  const [expanded, setExpanded] = useState(true);
  const totalCal = entries.reduce((sum, e) => sum + e.item.calories, 0);
  const label = MEAL_LABELS[meal];

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${totalCal} calories. ${expanded ? 'Collapse' : 'Expand'}.`}
      >
        <Text style={styles.mealLabel}>{label}</Text>
        <View style={styles.headerRight}>
          <Text style={styles.totalCal}>{totalCal} cal</Text>
          {expanded ? (
            <ChevronUp size={18} color={tokens.inkFaint} strokeWidth={2} />
          ) : (
            <ChevronDown size={18} color={tokens.inkFaint} strokeWidth={2} />
          )}
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>
          {entries.length === 0 ? (
            <TouchableOpacity
              style={styles.addPrompt}
              onPress={onAddFood}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Plus size={17} color={tokens.accent} strokeWidth={2} />
              <Text style={styles.addText}>Add {label.toLowerCase()}</Text>
            </TouchableOpacity>
          ) : (
            <>
              {entries.map((entry) => (
                <TouchableOpacity
                  key={entry.id}
                  style={styles.entryRow}
                  onPress={() => onPressEntry?.(entry)}
                  activeOpacity={0.7}
                >
                  <View style={styles.entryInfo}>
                    <Text style={styles.foodName}>{entry.item.foodName}</Text>
                    <Text style={styles.portion}>{entry.item.portionDescription}</Text>
                  </View>
                  <Text style={styles.entryCal}>{entry.item.calories} cal</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.addPrompt}
                onPress={onAddFood}
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <Plus size={17} color={tokens.accent} strokeWidth={2} />
                <Text style={styles.addText}>Add food</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.surface,
    borderRadius: radius.card,
    ...shadow.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: space.md,
  },
  mealLabel: {
    fontFamily: font.bodyBold,
    fontSize: type.body,
    color: tokens.ink,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalCal: {
    fontFamily: font.numeric,
    fontSize: 13,
    color: tokens.inkMuted,
  },
  body: {
    borderTopWidth: 1,
    borderTopColor: tokens.border,
    paddingBottom: 4,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: tokens.border,
  },
  entryInfo: {
    flex: 1,
  },
  foodName: {
    fontFamily: font.body,
    fontSize: type.body,
    color: tokens.ink,
  },
  portion: {
    fontFamily: font.body,
    fontSize: 12,
    color: tokens.inkFaint,
    marginTop: 1,
  },
  entryCal: {
    fontFamily: font.numeric,
    fontSize: 13,
    color: tokens.inkMuted,
  },
  addPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.md,
    paddingVertical: 12,
    minHeight: 44,
  },
  addText: {
    fontFamily: font.bodyBold,
    fontSize: type.body,
    color: tokens.accent,
  },
});
