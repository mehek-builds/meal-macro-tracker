// ============================================================
// ScanScreen - camera scan + correction interface ("Nourish").
// The camera viewport stays dark (a viewfinder should be), but the
// chrome, processing loader, and results move to warm-light Nourish.
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { NutritionItem } from '@/types';
import { scanPhoto } from '@/api/endpoints';
import { X } from '@/theme/icons';
import { tokens, font, type, radius, space, shadow } from '@/theme/tokens';

const METHODS = ['Photo', 'Barcode', 'Label', 'Voice', 'Search'];
const MEALS = ['breakfast', 'lunch', 'dinner', 'snacks'];

type ScanPhase = 'preview' | 'processing' | 'results';

interface ScanScreenProps {
  onClose?: () => void;
  onConfirm?: (items: NutritionItem[], meal: string) => void;
}

/** Pulsing ring shown while the photo is analyzed (PRD Section 21.9). */
function PulseRing(): React.ReactElement {
  const reduceMotion = useReducedMotion();
  const p = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) {
      p.value = 0.5;
    } else {
      p.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.out(Easing.ease) }), -1, false);
    }
  }, [reduceMotion, p]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 0.85 + p.value * 0.35 }],
    opacity: 0.6 - p.value * 0.45,
  }));
  return (
    <View style={styles.pulseWrap}>
      <Animated.View style={[styles.pulseRing, style]} />
      <View style={styles.pulseCore} />
    </View>
  );
}

export function ScanScreen({ onClose, onConfirm }: ScanScreenProps): React.ReactElement {
  const [phase, setPhase] = useState<ScanPhase>('preview');
  const [items, setItems] = useState<NutritionItem[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<string>('lunch');
  const [method, setMethod] = useState<string>('Photo');
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  const handleCapture = async (): Promise<void> => {
    setPhase('processing');
    try {
      const photo = await cameraRef.current?.takePictureAsync({ base64: true, quality: 0.5 });
      if (!photo?.base64) throw new Error('no-photo');
      // Real analysis only — the captured photo goes to the backend vision endpoint.
      const result = await scanPhoto(photo.base64);
      if (result.items && result.items.length > 0) {
        setItems(result.items);
        setPhase('results');
        return;
      }
      throw new Error('no-items');
    } catch {
      // Never log fabricated food: on any failure, return to the viewfinder.
      setPhase('preview');
      Alert.alert(
        "Couldn't analyze that photo",
        'No food was detected, or the analyzer is unreachable. Make sure the food is clearly visible and try again.',
      );
    }
  };

  const handleRemoveItem = (index: number): void => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = (): void => {
    onConfirm?.(items, selectedMeal);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
          <X size={22} color={tokens.inkMuted} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan food</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* ---- preview ---- */}
      {phase === 'preview' && (
        <View style={styles.cameraArea}>
          {permission?.granted && (
            <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
          )}
          {permission?.granted ? (
            <View style={styles.flex} />
          ) : (
            <View style={styles.cameraHintWrap}>
              <Text style={styles.cameraText}>Camera access needed</Text>
              <Text style={styles.cameraHint}>Allow camera access to scan your meals.</Text>
              <TouchableOpacity style={styles.permBtn} onPress={requestPermission} accessibilityRole="button">
                <Text style={styles.permBtnText}>Enable camera</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.methodRow}>
            {METHODS.map((m) => (
              <TouchableOpacity key={m} style={styles.methodTab} onPress={() => setMethod(m)}>
                <Text style={[styles.methodText, method === m && styles.methodTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.captureBtn} onPress={handleCapture} accessibilityRole="button" accessibilityLabel="Capture photo">
            <View style={styles.captureInner} />
          </TouchableOpacity>
        </View>
      )}

      {/* ---- processing ---- */}
      {phase === 'processing' && (
        <View style={[styles.flex, styles.centered]}>
          <PulseRing />
          <Text style={styles.processingText}>Analyzing…</Text>
        </View>
      )}

      {/* ---- results ---- */}
      {phase === 'results' && (
        <View style={styles.resultsArea}>
          <Text style={styles.sectionTitle}>Review and adjust</Text>

          <View style={styles.mealRow}>
            {MEALS.map((m) => (
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
            contentContainerStyle={styles.list}
            renderItem={({ item, index }) => (
              <View style={styles.resultRow}>
                <View style={styles.resultInfo}>
                  <Text style={styles.foodName}>{item.foodName}</Text>
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
                <TouchableOpacity onPress={() => handleRemoveItem(index)} style={styles.deleteBtn} accessibilityRole="button">
                  <Text style={styles.deleteText}>Remove</Text>
                </TouchableOpacity>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={{ height: space.sm }} />}
          />

          <TouchableOpacity style={styles.addMissed} accessibilityRole="button">
            <Text style={styles.addMissedText}>+ Add missed item</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} accessibilityRole="button">
            <Text style={styles.confirmText}>
              Log {items.length} item{items.length !== 1 ? 's' : ''} to {selectedMeal}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg },
  flex: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center', gap: space.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    backgroundColor: tokens.surface,
    borderBottomWidth: 1,
    borderBottomColor: tokens.border,
  },
  headerTitle: { fontFamily: font.bodyBold, fontSize: type.statValue, color: tokens.ink },

  // camera (intentionally dark)
  cameraArea: {
    flex: 1,
    backgroundColor: tokens.cameraBg,
    justifyContent: 'space-between',
    paddingBottom: space.lg,
  },
  cameraHintWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },
  cameraText: { fontFamily: font.bodyBold, fontSize: type.statValue, color: tokens.cameraInk, marginBottom: 6 },
  cameraHint: { fontFamily: font.body, fontSize: type.label, color: tokens.cameraInkMuted, textAlign: 'center' },
  permBtn: {
    marginTop: 16,
    backgroundColor: tokens.accent,
    borderRadius: radius.card,
    paddingHorizontal: 20,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permBtnText: { fontFamily: font.bodyBold, fontSize: type.body, color: tokens.surface },
  methodRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10 },
  methodTab: { paddingHorizontal: 8, paddingVertical: 6 },
  methodText: { fontFamily: font.body, fontSize: type.label, color: tokens.inkFaint },
  methodTextActive: { color: tokens.accent, fontFamily: font.bodyBold },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: tokens.surface,
    alignSelf: 'center',
    marginTop: space.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: tokens.surface },

  // processing
  pulseWrap: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  pulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: tokens.accent,
  },
  pulseCore: { width: 56, height: 56, borderRadius: 28, backgroundColor: tokens.accentSoft },
  processingText: { fontFamily: font.body, fontSize: type.statValue, color: tokens.ink },

  // results
  resultsArea: { flex: 1 },
  sectionTitle: {
    fontFamily: font.bodyBold,
    fontSize: type.statValue,
    color: tokens.ink,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: 4,
  },
  mealRow: { flexDirection: 'row', gap: 8, paddingHorizontal: space.lg, paddingVertical: space.sm },
  mealBtn: {
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: tokens.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  mealBtnActive: { backgroundColor: tokens.accent, borderColor: tokens.accent },
  mealBtnText: { fontFamily: font.body, fontSize: 13, color: tokens.inkMuted },
  mealBtnTextActive: { color: tokens.surface, fontFamily: font.bodyBold },
  list: { paddingHorizontal: space.lg, paddingTop: space.sm },
  resultRow: {
    flexDirection: 'row',
    padding: space.md,
    backgroundColor: tokens.surface,
    borderRadius: radius.card,
    ...shadow.card,
  },
  resultInfo: { flex: 1 },
  foodName: { fontFamily: font.bodyBold, fontSize: type.body, color: tokens.ink },
  portion: { fontFamily: font.body, fontSize: 13, color: tokens.inkFaint, marginTop: 2 },
  warning: { fontFamily: font.body, fontSize: 12, color: tokens.stateClose, marginTop: 4 },
  macroLine: { fontFamily: font.numeric, fontSize: 12, color: tokens.inkMuted, marginTop: 4 },
  confidence: { fontFamily: font.body, fontSize: type.caption, color: tokens.inkFaint, marginTop: 2 },
  deleteBtn: { justifyContent: 'center', paddingLeft: 12 },
  deleteText: { fontFamily: font.bodyBold, fontSize: 13, color: tokens.stateUnder },
  addMissed: { paddingHorizontal: space.lg, paddingVertical: space.md },
  addMissedText: { fontFamily: font.bodyBold, fontSize: type.body, color: tokens.accent },
  confirmBtn: {
    margin: space.lg,
    backgroundColor: tokens.accent,
    borderRadius: radius.card,
    padding: space.md,
    alignItems: 'center',
  },
  confirmText: { fontFamily: font.bodyBold, fontSize: type.statValue, color: tokens.surface },
});
