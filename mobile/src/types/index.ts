// ============================================================
// Shared TypeScript interfaces mirroring PRD Sections 7,9,10,11,12,13,14,15
// ============================================================

// --------------- Section 7 - Nutrition / Food -----------------

/** A single identified food item from the scan pipeline (Section 7.5). */
export interface NutritionItem {
  food_name: string;
  portion_description: string;
  weight_grams: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  /** 0-1 confidence score from the vision model. */
  confidence: number;
  hidden_calories_warning?: string | null;
  // Extended micronutrients (populated from USDA/IFCT RAG layer)
  iron_mg?: number | null;
  calcium_mg?: number | null;
  magnesium_mg?: number | null;
  zinc_mg?: number | null;
}

/** A persisted food log entry (Section 7, Section 16). */
export interface FoodLogEntry {
  id: string;
  date: string;                 // YYYY-MM-DD
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  loggedAt: string;             // ISO timestamp
  source: 'photo_scan' | 'barcode' | 'label_ocr' | 'voice' | 'text_search' | 'custom';
  item: NutritionItem;
}

/** A user-created custom food / recipe (Section 4.6). */
export interface CustomFood {
  id: string;
  name: string;
  servingDescription: string;
  servingWeightGrams: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  iron_mg?: number | null;
  calcium_mg?: number | null;
  magnesium_mg?: number | null;
  zinc_mg?: number | null;
  createdAt: string;
}

// --------------- Section 9 - Exercise -----------------

/** A workout entry from HealthKit or manual log (Section 9.4). */
export interface WorkoutEntry {
  id: string;
  type: string;               // "Running", "Cycling", "Strength Training", etc.
  startDate: string;
  endDate: string;
  durationMinutes: number;
  caloriesBurned: number;
  avgHeartRate: number | null;
  source: 'apple_watch' | 'iphone' | 'manual';
}

/** Net-calorie summary returned by /exercise/summary/:date (Section 9.7). */
export interface ExerciseSummary {
  date: string;
  activeCaloriesBurned: number;
  steps: number;
  workouts: WorkoutEntry[];
  netCalorieMode: NetCalorieMode;
  baseTarget: number;
  adjustedTarget: number;
  caloriesEaten: number;
  caloriesRemaining: number;
}

/** Modes controlling how burned calories interact with the daily budget (Section 9.4). */
export type NetCalorieMode = 'fixed' | 'eat_back' | 'net';

// --------------- Section 10 - Water -----------------

/** A single water log entry (Section 10.4). */
export interface WaterEntry {
  id: string;
  oz: number;
  ml: number;           // derived: oz * 29.5735
  loggedAt: string;     // ISO timestamp
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

/** A single supplement log record (Section 12.3). */
export interface Supplement {
  id: string;
  name: string;
  doseDisplay: string;      // "10,000 IU", "60mg"
  takenAt: string;          // ISO timestamp
  notes: string | null;
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
  id: string;
  date: string;
  upperArmCm: number;
  chestCm: number;
  waistCm: number;
  hipsCm: number;
  thighCm: number;
  notes: string | null;
}

// --------------- Section 14 - Bloodwork -----------------

/** A bloodwork result entry (Section 14.3). */
export interface BloodworkResult {
  id: string;
  date: string;
  markerName: string;       // "Vitamin D (25-OH)", "Ferritin", etc.
  value: number;
  unit: string;             // "ng/mL", "g/dL", "%"
  refRangeLow: number;
  refRangeHigh: number;
  status: 'normal' | 'low' | 'high' | 'pending';
  retestDate: string | null;
  notes: string | null;
}

// --------------- Section 11 - Cycle -----------------

/** Cycle state derived from HealthKit menstrual data (Section 11.3). */
export interface CycleState {
  cycleDay: number;                              // 1 = first day of period
  phase: 'follicular' | 'luteal' | 'unknown';
  lastPeriodStart: string | null;               // ISO date string
  estimatedCycleLength: number;                  // default 28 if unknown
  nearOvulation: boolean;                        // true on days 12-16
  lutealCalorieBonus: number;                    // 150-300 cal added to daily target
  lutealProteinBonus: number;                    // 10-15g added to protein target
}

// --------------- Section 2 / 6 - User Profile & Targets -----------------

/** Training mode (Section 15.2). */
export type TrainingMode = 'muscle_gain' | 'marathon' | 'both';

/** A race in the race calendar (Section 15.4). */
export interface Race {
  id: string;
  name: string;
  date: string;         // ISO date
  location: string;
  status: 'confirmed' | 'conditional' | 'lottery_entered' | 'planned';
}

/** User profile stored in Supabase (Sections 2, 6). */
export interface UserProfile {
  id: string;
  biologicalSex: 'female' | 'male';
  ageYears: number;
  heightCm: number;
  weightKg: number;
  goalType: 'build_muscle' | 'maintain' | 'lose';
  targetWeightKg: number;
  milestoneWeightKg: number;
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'athlete';
  trainingPhase: 1 | 2 | 3;
  trainingMode: TrainingMode;
  dietaryRestrictions: string[];
  cycleFirstDayOfLastPeriod: string | null; // ISO date seed value from onboarding
  netCalorieMode: NetCalorieMode;
  waterGoalRestDayOz: number;
  waterGoalTrainingDayOz: number;
}

/** Computed daily macro/calorie targets (Section 2). */
export interface Targets {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  // Applied when in luteal phase (Section 11.4)
  lutealCalorieAdjustment: number;
  lutealProteinAdjustment: number;
  effectiveCalories: number;   // calories + lutealCalorieAdjustment
  effectiveProtein: number;    // protein_g + lutealProteinAdjustment
  waterGoalOz: number;
}
