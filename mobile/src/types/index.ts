// ============================================================
// Shared TypeScript interfaces mirroring PRD Sections 7,9,10,11,12,13,14,15
// Wire shapes match backend camelCase aliases (pydantic alias_generator=to_camel).
// ============================================================

// --------------- Section 7 - Nutrition / Food -----------------

/** A single identified food item from the scan pipeline (Section 7.5). */
export interface NutritionItem {
  foodName: string;
  portionDescription: string;
  weightGrams: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  /** 0-1 confidence score from the vision model. */
  confidence: number;
  hiddenCaloriesWarning?: string | null;
  // Extended micronutrients (populated from USDA/IFCT RAG layer)
  ironMg?: number | null;
  calciumMg?: number | null;
  magnesiumMg?: number | null;
  zincMg?: number | null;
}

/** A persisted food log entry (Section 7, Section 16). */
export interface FoodLogEntry {
  id?: string | null;
  date: string;                 // YYYY-MM-DD
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  source: 'photo_scan' | 'barcode' | 'label_ocr' | 'voice' | 'text_search' | 'custom' | 'manual';
  item: NutritionItem;          // nested nutrition detail
}

/** A user-created custom food / recipe (Section 4.6). */
export interface CustomFood {
  id?: string | null;
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  notes: string;
}

/** Food search result (Section 4.5). */
export interface FoodSearchResult {
  id: string;
  name: string;
  source: string;               // "usda" | "custom" | "open_food_facts"
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

// --------------- Section 9 - Exercise -----------------

/** A workout entry from HealthKit or manual log (Section 9.4). */
export interface WorkoutEntry {
  id?: string | null;
  date: string;                 // YYYY-MM-DD
  type: string;                 // "Running" | "Cycling" | "Weight Training" | etc.
  durationMinutes: number;
  caloriesBurned?: number | null;
  avgHeartRate?: number | null;
  source: 'manual' | 'apple_watch' | 'iphone';
  notes: string;
}

/** Net-calorie summary returned by /exercise/summary/:date (Section 9.7). */
export interface ExerciseSummary {
  date: string;
  totalActiveCalories: number;
  totalDurationMinutes: number;
  workouts: WorkoutEntry[];
  netCalorieResult?: Record<string, unknown> | null;
}

/** Modes controlling how burned calories interact with the daily budget (Section 9.4). */
export type NetCalorieMode = 'fixed' | 'eat_back' | 'net';

// --------------- Section 10 - Water -----------------

/** A single water log entry (Section 10.4). */
export interface WaterEntry {
  id?: string | null;
  date: string;           // YYYY-MM-DD
  oz: number;
  loggedAt: string;       // ISO timestamp
  ml: number;             // derived: oz * 29.5735
}

/** Daily water summary returned by /water/day/:date (Section 10.4). */
export interface WaterSummary {
  date: string;
  entries: WaterEntry[];
  totalOz: number;
  totalMl: number;
  goalOz: number;
  remainingOz: number;
  percentComplete: number; // 0-100
}

// --------------- Section 12 - Supplements -----------------

/** A single supplement definition (Section 12). */
export interface Supplement {
  id?: string | null;
  name: string;
  doseDisplay: string;        // "10,000 IU", "60mg"
  timing: string;
  conflicts: string[];
  retestDate?: string | null;
  retestNotes: string;
  active: boolean;
}

/** A logged supplement entry (Section 12.3). */
export interface SupplementEntry {
  id?: string | null;
  supplementId: string;
  supplementName: string;
  doseDisplay: string;
  takenAt: string;            // ISO timestamp
  notes?: string | null;
}

/** Today's supplement status row (Section 12.3). */
export interface SupplementStatus {
  id: string;
  name: string;
  dose: string;
  takenToday: boolean;
  takenAt: string | null;
  nextSafeTime: string | null;  // null if no timing conflict
}

// --------------- Section 13 - Body Measurements -----------------

/** Monthly tape measure entry (Section 13.3). */
export interface BodyMeasurement {
  id?: string | null;
  date: string;
  upperArmCm?: number | null;
  chestCm?: number | null;
  waistCm?: number | null;
  hipsCm?: number | null;
  thighCm?: number | null;
  notes?: string | null;
}

// --------------- Section 14 - Bloodwork -----------------

/** A bloodwork result entry (Section 14.3). */
export interface BloodworkResult {
  id?: string | null;
  date: string;
  markerName: string;         // "Vitamin D (25-OH)", "Ferritin", etc.
  value: number;
  unit: string;               // "ng/mL", "g/dL", "%"
  refRangeLow?: number | null;
  refRangeHigh?: number | null;
  status: 'normal' | 'low' | 'high' | 'pending';
  retestDate?: string | null;
  notes?: string | null;
}

// --------------- Section 11 - Cycle -----------------

/** Cycle state derived from HealthKit menstrual data (Section 11.3). */
export interface CycleState {
  cycleDay: number;                              // 1 = first day of period; 0 = unknown
  phase: 'follicular' | 'luteal' | 'unknown';
  lastPeriodStart: string | null;               // ISO date string
  estimatedCycleLength: number;                  // default 28 if unknown
  nearOvulation: boolean;                        // true on days 12-16
  lutealCalorieBonus: number;                    // added to daily target when luteal
  lutealProteinBonus: number;                    // added to protein target when luteal
}

// --------------- Section 2 / 6 - User Profile & Targets -----------------

/** Training mode (Section 15.2). */
export type TrainingMode = 'muscle_gain' | 'marathon' | 'both';

/** Race status values (Section 15.4). */
export type RaceStatus = 'planned' | 'conditional' | 'lottery_entered' | 'ballot' | 'registered' | 'completed';

/** A race in the race calendar (Section 15.4). */
export interface Race {
  id?: string | null;
  name: string;
  date: string;               // ISO date YYYY-MM-DD
  location: string;
  status: RaceStatus;
  notes: string;
  raceWeekActive: boolean;
}

/** User profile stored in backend (Sections 2, 6).
 *  Wire fields are camelCase aliases of backend snake_case names.
 */
export interface UserProfile {
  id?: string | null;
  sex: 'female' | 'male';
  age: number;
  heightCm: number;
  weightKg: number;
  goal: 'build_muscle' | 'maintain' | 'lose';
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'athlete';
  netCalorieMode: NetCalorieMode;
  calorieSurplus: number;
  waterGoalOz?: number | null;     // user override in oz; null = auto from service
  dietaryRestrictions: string[];
  allergies: string[];
  trainingPhase: string;           // "phase_1" | "phase_2" | "phase_3"
  lastPeriodStart?: string | null; // YYYY-MM-DD seed value
}

/** Computed daily macro/calorie targets (Section 2).
 *  Mirrors backend Targets model wire shape exactly.
 */
export interface Targets {
  bmr: number;
  tdee: number;
  calories: number;             // base calorie target before luteal adjustment
  proteinG: number;             // base protein target before luteal adjustment
  carbsG: number;
  fatG: number;
  isLuteal: boolean;
  lutealCalorieBonus: number;
  lutealProteinBonus: number;
  effectiveCalories: number;    // calories after luteal adjustment (what dashboard shows)
  effectiveProteinG: number;    // proteinG after luteal adjustment
  waterGoalOz: number;
}
