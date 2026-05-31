// ============================================================
// MealSection - Section 5 (collapsible meal sections)
// Breakfast / Lunch / Dinner / Snacks with total cal + logged items.
// ============================================================

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { FoodLogEntry } from '@/types';

interface MealSectionProps {
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  entries: FoodLogEntry[];
  /** Called when user taps a log item to edit/delete. TODO(Section 7.8) */
  onPressEntry?: (entry: FoodLogEntry) => void;
  /** Called when user taps the + button to add food. TODO(Section 4) */
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

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.7}
      >
        <Text style={styles.mealLabel}>{MEAL_LABELS[meal]}</Text>
        <View style={styles.headerRight}>
          <Text style={styles.totalCal}>{totalCal} cal</Text>
          <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>
          {entries.length === 0 ? (
            <Text style={styles.empty}>No items logged</Text>
          ) : (
            entries.map((entry) => (
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
            ))
          )}

          {/* TODO(Section 4) - tapping + should open scan/search input methods */}
          <TouchableOpacity style={styles.addButton} onPress={onAddFood}>
            <Text style={styles.addText}>+ Add food</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  mealLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalCal: {
    fontSize: 14,
    color: '#6B7280',
  },
  chevron: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  body: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingBottom: 4,
  },
  empty: {
    fontSize: 13,
    color: '#9CA3AF',
    padding: 12,
    paddingTop: 8,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  entryInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 14,
    color: '#111827',
  },
  portion: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 1,
  },
  entryCal: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  addButton: {
    padding: 12,
    paddingLeft: 14,
  },
  addText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
});
