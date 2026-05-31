// ============================================================
// Typed API functions - one per backend endpoint (Section 16)
// ============================================================

import { api } from './client';
import type {
  NutritionItem,
  FoodLogEntry,
  CustomFood,
  WorkoutEntry,
  ExerciseSummary,
  WaterEntry,
  WaterSummary,
  Supplement,
  SupplementStatus,
  BodyMeasurement,
  BloodworkResult,
  CycleState,
  UserProfile,
  NetCalorieMode,
  TrainingMode,
  Race,
  Targets,
} from '@/types';

// --------------- Scan (Section 7 / 16) -----------------

export interface ScanPhotoResult {
  items: NutritionItem[];
  overall_confidence: number;
  scan_notes: string;
}

/** POST /scan/photo - Upload image (and optional depth data) for AI nutrition analysis. */
export function scanPhoto(
  imageBase64: string,
  depthData: Record<string, unknown> | null,
): Promise<ScanPhotoResult> {
  // TODO(Section 7.1) - real call uses multipart or base64 body per backend spec
  return api.post<ScanPhotoResult>('/scan/photo', { imageBase64, depthData });
}

/** POST /scan/barcode - Query barcode for packaged food nutrition. */
export function scanBarcode(barcode: string): Promise<NutritionItem> {
  // TODO(Section 4.2)
  return api.post<NutritionItem>('/scan/barcode', { barcode });
}

/** POST /scan/label - OCR nutrition label and return parsed macros. */
export function scanLabel(imageBase64: string): Promise<NutritionItem> {
  // TODO(Section 4.3)
  return api.post<NutritionItem>('/scan/label', { imageBase64 });
}

// --------------- Food Log (Section 16) -----------------

export interface CreateLogEntryPayload {
  date: string;
  meal: FoodLogEntry['meal'];
  source: FoodLogEntry['source'];
  item: Omit<NutritionItem, 'confidence'> & { confidence?: number };
}

/** POST /log/entry - Save a food log entry. */
export function createLogEntry(payload: CreateLogEntryPayload): Promise<FoodLogEntry> {
  return api.post<FoodLogEntry>('/log/entry', payload);
}

/** GET /log/day/:date - Get all food log entries for a date (YYYY-MM-DD). */
export function getLogForDay(date: string): Promise<FoodLogEntry[]> {
  return api.get<FoodLogEntry[]>(`/log/day/${date}`);
}

/** PUT /log/entry/:id - Edit an existing log entry. */
export function updateLogEntry(
  id: string,
  payload: Partial<CreateLogEntryPayload>,
): Promise<FoodLogEntry> {
  return api.put<FoodLogEntry>(`/log/entry/${id}`, payload);
}

/** DELETE /log/entry/:id - Remove a log entry. */
export function deleteLogEntry(id: string): Promise<void> {
  return api.delete<void>(`/log/entry/${id}`);
}

// --------------- Exercise (Section 9 / 16) -----------------

export interface CreateExercisePayload {
  date: string;
  workout: Omit<WorkoutEntry, 'id'>;
}

/** POST /exercise/entry - Save a workout (manual or HealthKit-sourced). */
export function createExercise(payload: CreateExercisePayload): Promise<WorkoutEntry> {
  return api.post<WorkoutEntry>('/exercise/entry', payload);
}

/** GET /exercise/day/:date - Get workouts for a date. */
export function getExerciseForDay(date: string): Promise<WorkoutEntry[]> {
  return api.get<WorkoutEntry[]>(`/exercise/day/${date}`);
}

/** DELETE /exercise/entry/:id - Delete a workout entry. */
export function deleteExercise(id: string): Promise<void> {
  return api.delete<void>(`/exercise/entry/${id}`);
}

/** GET /exercise/summary/:date - Active calories burned + net calorie calculation. */
export function getExerciseSummary(date: string): Promise<ExerciseSummary> {
  return api.get<ExerciseSummary>(`/exercise/summary/${date}`);
}

// --------------- User Profile (Section 16) -----------------

/** GET /user/profile - Retrieve profile, calorie target, and net calorie mode. */
export function getProfile(): Promise<{ profile: UserProfile; targets: Targets }> {
  return api.get('/user/profile');
}

/** PUT /user/profile - Update profile and recalculate targets. */
export function updateProfile(
  payload: Partial<Omit<UserProfile, 'id'>>,
): Promise<{ profile: UserProfile; targets: Targets }> {
  return api.put('/user/profile', payload);
}

/** PUT /user/net-calorie-mode - Switch between fixed / eat-back / net modes. */
export function setNetCalorieMode(mode: NetCalorieMode): Promise<void> {
  return api.put<void>('/user/net-calorie-mode', { mode });
}

/** GET /user/stats - Weekly/monthly progress (food + exercise combined). */
export function getStats(
  period: 'weekly' | 'monthly',
): Promise<Record<string, unknown>> {
  // TODO(Section 18) - shape will be refined when stats screen is built
  return api.get<Record<string, unknown>>(`/user/stats?period=${period}`);
}

// --------------- Water (Section 10 / 16) -----------------

/** POST /water/entry - Log a water entry (oz + timestamp). */
export function logWater(oz: number, loggedAt?: string): Promise<WaterEntry> {
  return api.post<WaterEntry>('/water/entry', {
    oz,
    loggedAt: loggedAt ?? new Date().toISOString(),
  });
}

/** GET /water/day/:date - Get all water entries and summary for a date. */
export function getWaterForDay(date: string): Promise<WaterSummary> {
  return api.get<WaterSummary>(`/water/day/${date}`);
}

/** DELETE /water/entry/:id - Delete a water entry. */
export function deleteWaterEntry(id: string): Promise<void> {
  return api.delete<void>(`/water/entry/${id}`);
}

/** PUT /user/water-goal - Update training/rest day water targets (in oz). */
export function setWaterGoal(oz: number): Promise<void> {
  return api.put<void>('/user/water-goal', { oz });
}

// --------------- Supplements (Section 12 / 16) -----------------

export interface LogSupplementResponse {
  entry: Supplement;
  conflicts: string[];
}

/** POST /supplements/log - Log a supplement as taken (returns any timing conflicts). */
export function logSupplement(
  supplementId: string,
  takenAt?: string,
): Promise<LogSupplementResponse> {
  return api.post<LogSupplementResponse>('/supplements/log', {
    supplementId,
    takenAt: takenAt ?? new Date().toISOString(),
  });
}

/** GET /supplements/today - Today's supplement status and next safe timing windows. */
export function getTodaySupplements(): Promise<{ supplements: SupplementStatus[] }> {
  return api.get('/supplements/today');
}

/** PUT /supplements/:id/retest - Update retest date and notes for a supplement. */
export function updateRetestDate(
  supplementId: string,
  retestDate: string,
  notes: string,
): Promise<void> {
  return api.put<void>(`/supplements/${supplementId}/retest`, { retestDate, notes });
}

// --------------- Measurements (Section 13 / 16) -----------------

/** POST /measurements/entry - Log monthly body measurements. */
export function logMeasurements(
  data: Omit<BodyMeasurement, 'id'>,
): Promise<BodyMeasurement> {
  return api.post<BodyMeasurement>('/measurements/entry', data);
}

/** GET /measurements/history - All measurement entries sorted by date ascending. */
export function getMeasurementHistory(): Promise<BodyMeasurement[]> {
  return api.get<BodyMeasurement[]>('/measurements/history');
}

// --------------- Bloodwork (Section 14 / 16) -----------------

/** POST /bloodwork/entry - Log a bloodwork result. */
export function logBloodwork(
  data: Omit<BloodworkResult, 'id'>,
): Promise<BloodworkResult> {
  return api.post<BloodworkResult>('/bloodwork/entry', data);
}

/** GET /bloodwork/history - All results, optionally filtered by marker name. */
export function getBloodworkHistory(markerName?: string): Promise<BloodworkResult[]> {
  const params = markerName ? `?marker=${encodeURIComponent(markerName)}` : '';
  return api.get<BloodworkResult[]>(`/bloodwork/history${params}`);
}

/** GET /bloodwork/retests/upcoming - Markers with retest dates in the next 30 days. */
export function getUpcomingRetests(): Promise<BloodworkResult[]> {
  return api.get<BloodworkResult[]>('/bloodwork/retests/upcoming');
}

// --------------- Cycle (Section 11 / 16) -----------------

/** GET /cycle/state - Current cycle day, phase, and luteal adjustments. */
export function getCycleState(): Promise<CycleState> {
  return api.get<CycleState>('/cycle/state');
}

/** POST /cycle/manual - Manually set cycle day when no HealthKit data is present. */
export function setManualCycle(cycleDay: number, lastPeriodStart: string): Promise<void> {
  return api.post<void>('/cycle/manual', { cycleDay, lastPeriodStart });
}

// --------------- Training Mode / Races (Section 15 / 16) -----------------

/** PUT /training/mode - Set training mode (muscle_gain / marathon / both). */
export function setTrainingMode(mode: TrainingMode): Promise<void> {
  return api.put<void>('/training/mode', { mode });
}

/** POST /races/entry - Add a race to the calendar. */
export function addRace(race: Omit<Race, 'id'>): Promise<Race> {
  return api.post<Race>('/races/entry', race);
}

/** GET /races - All races with upcoming race-week flags. */
export function getRaces(): Promise<Race[]> {
  return api.get<Race[]>('/races');
}

// --------------- Custom Foods / Search (Section 4.5, 4.6 / 16) -----------------

/** POST /foods/custom - Create a custom food or recipe. */
export function createCustomFood(food: Omit<CustomFood, 'id' | 'createdAt'>): Promise<CustomFood> {
  return api.post<CustomFood>('/foods/custom', food);
}

/** GET /foods/search - Fuzzy search against USDA + IFCT + custom food database. */
export function searchFoods(query: string, limit = 20): Promise<CustomFood[]> {
  return api.get<CustomFood[]>(
    `/foods/search?q=${encodeURIComponent(query)}&limit=${limit}`,
  );
}
