// ============================================================
// ScanScreen - Section 7.1 (camera scan pipeline) + Section 7.8 (correction interface)
// Camera preview is a placeholder View (no real expo-camera integration here).
// Correction interface lists identified items as editable rows.
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
import type { NutritionItem } from '@/types';

// Mock scan result for UI development.
const MOCK_SCAN_RESULT: NutritionItem[] = [
  {
    foodName: 'Brown rice, cooked',
    portionDescription: '1 cup (~180g)',
    weightGrams: 180,
    calories: 216,
    proteinG: 5,
    carbsG: 45,
    fatG: 2,
    confidence: 0.88,
  },
  {
    foodName: 'Chicken breast, grilled',
    portionDescription: '~120g',
    weightGrams: 120,
    calories: 198,
    proteinG: 37,
    carbsG: 0,
    fatG: 4,
    confidence: 0.91,
    hiddenCaloriesWarning: 'Likely cooked with ~1 tsp oil (+40 cal)',
  },
];

type ScanPhase = 'preview' | 'processing' | 'results';

interface ScanScreenProps {
  onClose?: () => void;
  onConfirm?: (items: NutritionItem[], meal: string) => void;
}

export function ScanScreen({ onClose, onConfirm }: ScanScreenProps): React.ReactElement {
  const [phase, setPhase] = useState<ScanPhase>('preview');
  const [items, setItems] = useState<NutritionItem[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<string>('lunch');

  // Simulate a scan (TODO(Section 7.1) - replace with real camera + API call)
  const handleCapture = (): void => {
    setPhase('processing');
    // TODO(Section 7.1) - captureWithDepth() + api.scanPhoto()
    setTimeout(() => {
      setItems(MOCK_SCAN_RESULT);
      setPhase('results');
    }, 1500);
  };

  const handleRemoveItem = (index: number): void => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = (): void => {
    // TODO(Section 7.8) - call createLogEntry() for each item
    onConfirm?.(items, selectedMeal);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.close}>Close</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan food</Text>
        <View style={{ width: 48 }} />
      </View>

      {/* ---- Phase: preview ---- */}
      {phase === 'preview' && (
        <View style={styles.flex}>
          {/* Camera preview placeholder */}
          <View style={styles.cameraPlaceholder}>
            <Text style={styles.cameraText}>Camera preview</Text>
            <Text style={styles.cameraHint}>
              (TODO(Section 7.1) - expo-camera / react-native-vision-camera live preview)
            </Text>
            <Text style={styles.cameraHint}>
              LiDAR depth capture: TODO(Section 7.3) - src/native/DepthCapture.ts
            </Text>
          </View>
          {/* Input method tabs */}
          <View style={styles.methodRow}>
            {['Photo', 'Barcode', 'Label', 'Voice', 'Search'].map((m) => (
              <TouchableOpacity key={m} style={styles.methodTab}>
                <Text style={styles.methodText}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.captureBtn} onPress={handleCapture}>
            <View style={styles.captureInner} />
          </TouchableOpacity>
        </View>
      )}

      {/* ---- Phase: processing ---- */}
      {phase === 'processing' && (
        <View style={[styles.flex, styles.centered]}>
          <Text style={styles.processingText}>Analyzing food...</Text>
          <Text style={styles.processingHint}>
            TODO(Section 7.4) - multi-model router (GPT-4o / Claude / GPT-4o-mini)
          </Text>
        </View>
      )}

      {/* ---- Phase: results (correction interface Section 7.8) ---- */}
      {phase === 'results' && (
        <View style={styles.flex}>
          <Text style={styles.sectionTitle}>Review and adjust</Text>

          {/* Meal selector */}
          <View style={styles.mealRow}>
            {['breakfast', 'lunch', 'dinner', 'snacks'].map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.mealBtn, selectedMeal === m && styles.mealBtnActive]}
                onPress={() => setSelectedMeal(m)}
              >
                <Text style={[styles.mealBtnText, selectedMeal === m && styles.mealBtnTextActive]}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FlatList
            data={items}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item, index }) => (
              <View style={styles.resultRow}>
                <View style={styles.resultInfo}>
                  {/* TODO(Section 7.8) - tap food name to fuzzy-search replacement */}
                  <Text style={styles.foodName}>{item.foodName}</Text>
                  {/* TODO(Section 7.8) - tap portion to drag slider or type grams */}
                  <Text style={styles.portion}>{item.portionDescription}</Text>
                  {item.hiddenCaloriesWarning && (
                    <Text style={styles.warning}>{item.hiddenCaloriesWarning}</Text>
                  )}
                  <Text style={styles.macroLine}>
                    {item.calories} cal · {item.proteinG}g P · {item.carbsG}g C · {item.fatG}g F
                  </Text>
                  <Text style={styles.confidence}>
                    Confidence: {Math.round(item.confidence * 100)}%
                  </Text>
                </View>
                {/* Swipe-left-to-delete stub */}
                <TouchableOpacity onPress={() => handleRemoveItem(index)} style={styles.deleteBtn}>
                  <Text style={styles.deleteText}>Remove</Text>
                </TouchableOpacity>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />

          {/* Add missed item */}
          <TouchableOpacity style={styles.addMissed}>
            <Text style={styles.addMissedText}>+ Add missed item (text search or another scan)</Text>
          </TouchableOpacity>

          {/* Confirm */}
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
            <Text style={styles.confirmText}>Log {items.length} item{items.length !== 1 ? 's' : ''} to {selectedMeal}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000000' },
  flex: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#111827',
  },
  close: { color: '#60A5FA', fontSize: 16 },
  headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  cameraText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  cameraHint: { color: '#9CA3AF', fontSize: 12, textAlign: 'center', marginTop: 4 },
  methodRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#111827',
    paddingVertical: 10,
  },
  methodTab: { paddingHorizontal: 8, paddingVertical: 6 },
  methodText: { color: '#9CA3AF', fontSize: 12 },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignSelf: 'center',
    marginVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
  },
  processingText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  processingHint: { color: '#9CA3AF', fontSize: 12, marginTop: 8, textAlign: 'center', paddingHorizontal: 32 },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: '#111827',
  },
  mealRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#111827',
  },
  mealBtn: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#374151',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  mealBtnActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  mealBtnText: { color: '#9CA3AF', fontSize: 13 },
  mealBtnTextActive: { color: '#FFFFFF' },
  resultRow: {
    flexDirection: 'row',
    padding: 14,
    backgroundColor: '#1F2937',
  },
  resultInfo: { flex: 1 },
  foodName: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  portion: { color: '#9CA3AF', fontSize: 13, marginTop: 2 },
  warning: { color: '#EAB308', fontSize: 12, marginTop: 4 },
  macroLine: { color: '#60A5FA', fontSize: 12, marginTop: 4 },
  confidence: { color: '#6B7280', fontSize: 11, marginTop: 2 },
  deleteBtn: { justifyContent: 'center', paddingLeft: 12 },
  deleteText: { color: '#EF4444', fontSize: 13 },
  separator: { height: 1, backgroundColor: '#374151' },
  addMissed: { padding: 14, backgroundColor: '#111827' },
  addMissedText: { color: '#3B82F6', fontSize: 14 },
  confirmBtn: {
    margin: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  confirmText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
