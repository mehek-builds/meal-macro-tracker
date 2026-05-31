# PRD: AI Food Photo Nutrition Tracker (Personal)
**Based on Cal AI (calai.app) architecture and product research**
**Version 2.0 | May 2026**

---

## 1. Product Vision

A personal nutrition, exercise, and hydration tracking app built around two parallel goals: **gaining lean muscle mass** (42 kg → 57-60 kg over 18-30 months) and **training for 6 marathons in 2027**. The primary food input is a phone camera photo - one photo, under 10 seconds, full nutritional breakdown ready to log. Exercise data from Apple Watch flows in automatically. Water is logged manually with one tap.

This is a surplus-first app. The primary job is making sure enough calories and protein are eaten every day, not restricting them.

**North star:** Photo to completed log entry in under 10 seconds. End of day with calories still remaining = failure state, not success.

---

## 2. User Profile (Me)

**Current state (as of May 2026):** 20F, 5'4" (163 cm), 42 kg, BMI 15.8. Goal: 57-60 kg lean muscle. Training phase: Phase 1 (bodyweight only, pending electrolytes clearance).

Setup captures:
- Biological sex, age, height, current weight
- Goal: build muscle (surplus) / maintain / lose
- Target weight + near-term milestone weight
- Activity level
- Current training phase (Phase 1 / 2 / 3 - drives calorie and macro targets)
- Dietary restrictions / allergies
- Cycle tracking: first day of last period (used to calculate cycle day and phase)

### Calorie Target (Surplus Mode)

```
BMR = (10 x weight_kg) + (6.25 x height_cm) - (5 x age) - 161  [female]

TDEE = BMR x activity_factor
  sedentary: 1.2 | lightly active: 1.375 | moderately active: 1.55
  very active: 1.725 | athlete: 1.9

surplus = +300 to +500 cal (lean gain - going higher increases fat storage)
base_daily_target = TDEE + surplus
```

**Current targets at 42 kg, lightly active:**
- Calories: 1,850-1,950 cal/day
- Protein: 120-125g
- Carbs: 230-250g
- Fat: 55-65g

### Auto-Recalculation at Every 3 kg Gained

Macro targets scale with body weight. When the 7-day average weight crosses a 3 kg threshold, the app prompts a macro recalculation:

| Weight | Protein target | Calorie target (approx) |
|--------|---------------|------------------------|
| 42 kg | 120-125g | 1,850-1,950 |
| 45 kg | 126-130g | 1,920-2,020 |
| 48 kg | 134-140g | 1,990-2,090 |
| 50 kg | 145-152g | 2,040-2,140 |
| 57 kg | 158-168g | 2,200-2,350 |

### Luteal Phase Adjustment

When cycle phase = luteal (days 15-28), add to base targets:
- +10-15g protein/day
- +150-300 cal/day

The app applies this automatically when cycle data is available (see Section 12).

---

## 3. Success Criteria

| Criterion | Target |
|-----------|--------|
| Photo scan latency | < 5 seconds (p95) |
| Scan accuracy - single ingredient | Within 15% of actual |
| Scan accuracy - plated meal | Within 25% of actual |
| Scan accuracy - packaged food (barcode) | Near 100% |
| Dashboard load time | < 500ms |

---

## 4. Core Input Methods

Every method feeds the same daily log. Every logged item produces: food name, portion size, calories, protein (g), carbs (g), fat (g).

### 4.1 Photo Scan (Primary)
The core feature. See Section 7 for full technical spec.

### 4.2 Barcode Scan
- Camera-based UPC/EAN barcode reader
- Query USDA FoodData Central + Open Food Facts (both free)
- Near-100% accuracy on packaged foods
- Result returned in < 1 second

### 4.3 Nutrition Label Scan
- OCR on packaged food nutrition facts panel using device camera
- Extract: serving size, calories, total fat, saturated fat, carbs, fiber, sugars, protein, sodium
- Normalize to actual serving quantity consumed
- Google ML Kit on-device OCR for speed; fallback to cloud OCR

### 4.4 Voice Input
- Speak meal description: "two scrambled eggs with cheese and a slice of sourdough toast"
- NLP extracts food items and quantities (GPT-4o-mini - fast and cheap for text-only)
- Result presented as editable list before confirming log

### 4.5 Text Search
- Fuzzy search against USDA FoodData Central + local custom food database
- Recent and frequent foods surfaced first
- Autocomplete

### 4.6 Custom Recipe Builder
- Add ingredients one by one via any input method above
- App calculates aggregate nutrition per serving
- Recipe saved for future one-tap logging
- Portion scaler (0.5x, 1x, 2x, custom)

---

## 5. Daily Dashboard

Home screen. Must load in < 500ms.

### Calorie Ring (hero element) - Surplus Mode

The ring logic is inverted from a weight loss app. The goal is to hit the target, not stay under it.

- Large visual ring: calories consumed vs. daily target
- Center number: **calories still needed today** (how much left to eat, not how much is "allowed")
- Color:
  - Green: on track (within 200 cal of target)
  - Yellow: under by 200-500 cal (eat more)
  - Red: under by 500+ cal or end-of-day alert (haven't eaten enough)
  - Blue: target hit or slightly over (surplus achieved)
- End-of-day push notification at 8 PM if still more than 300 cal short: "You're 400 cal short - have a snack before bed"
- Luteal phase indicator: small badge on ring when cycle is in luteal phase, showing adjusted target

### Macro Bars

- Three primary progress bars: Protein / Carbs / Fat
- Color logic same as calorie ring - red means under, not over
- **Critical micronutrients row** (always visible, not collapsed - these matter):
  - Iron (target: 18mg/day) - flagged red below 15mg
  - Calcium (target: 1,000mg/day) - flagged red below 800mg
  - Magnesium (target: 310mg/day) - flagged red below 250mg
  - Zinc (target: 8mg/day) - flagged red below 6mg
- Secondary row (swipe or collapse): Fiber, Sodium, B12, Vitamin D

### Meal Sections
- Four collapsible sections: Breakfast, Lunch, Dinner, Snacks
- Each shows total calories for that meal
- Tap to expand and see logged items
- Tap any item to edit or delete
- Plus button in each section to add food

### Quick Scan FAB
- Floating action button (bottom-center): camera icon
- Single tap opens camera in scan mode
- Always visible on dashboard

### Exercise Log + Net Calories
- Apple Watch workout data auto-imported via HealthKit - no manual entry needed
- Active calories burned displayed below meals, subtracted from daily budget
- Net calorie mode selector (see Section 9): fixed target / eat-back / net calories
- Manual workout fallback: exercise type + duration → MET-based calorie estimate
- Workout type, duration, avg heart rate, and calories shown per session

### Water Tracker
- Tap-to-add: 8oz, 12oz, 16oz, custom
- Daily progress bar toward target

---

## 6. Onboarding Flow (One-Time Setup)

Simple 6-screen setup. No investment-building needed since this is personal use.

1. Welcome + brief explainer of how it works
2. Biological sex + age
3. Height + current weight
4. Goal selection (build muscle surplus mode) + target weight + near-term milestone
5. Activity level + current training phase (Phase 1 / 2 / 3)
6. Dietary restrictions / allergies
7. Cycle tracking: first day of last period (or "skip for now") - used to calculate cycle day and auto-adjust luteal phase targets
8. "Your plan is ready" - show daily calorie target + macro split + water target, then go to dashboard

All fields editable later in Settings. Cycle day updates automatically via HealthKit once permissions are granted - the setup entry is just a seed value for day 1.

---

## 7. AI Photo Scan - Full Technical Spec

### 7.1 End-to-End Pipeline

```
User taps scan FAB
    → Camera opens in live preview mode
    → User captures photo
    → [Device-level preprocessing - on-device]
    → [Depth data capture - if LiDAR available]
    → Image + depth data sent to backend
    → [Food complexity classifier - cheap model]
    → [Vision model identifies food items + estimates portions]
    → [RAG lookup: food names → verified nutrition data]
    → [Confidence scoring]
    → Structured JSON returned
    → Results displayed as editable list
    → User confirms or adjusts
    → Entry saved to daily log
```

Target latency: < 5 seconds end-to-end.

### 7.2 Device-Level Preprocessing (Client-Side)

Before upload:
- Resize to 800x800px (reduces token count ~60% vs. native resolution)
- JPEG compress at 85% quality
- Auto-enhance brightness/contrast if low-light detected (Core Image / Android CameraX)
- Basic food detection classifier - reject non-food images before hitting the API

### 7.3 Depth Sensor Integration (LiDAR - iOS Pro / ARCore - Android)

**Why it matters:** A shallow bowl of pasta and a piled-high bowl look similar from above but differ by 2x in calories. Depth resolves this. Cal AI's ~5-10% portion accuracy with LiDAR vs. ~20-35% without.

**Applicable devices:** iPhone 12 Pro and later (Pro/Pro Max), iPad Pro with LiDAR; Android: ARCore Depth API on Pixel 6+, Samsung S21+, and 200+ other devices.

**iOS implementation (ARKit):**

```swift
let session = ARSession()
let config = ARWorldTrackingConfiguration()
config.frameSemantics = .smoothedSceneDepth
session.run(config)

// On frame capture:
guard let depthMap = frame.smoothedSceneDepth?.depthMap else { return }
let confidenceMap = frame.smoothedSceneDepth?.confidenceMap

// Segment food region using bounding box from vision model output
// Extract depth values within bounding box
// Calculate volume: V = sum(pixel_area * depth_delta) over food region
```

**Volume to weight conversion:**
- Vision model identifies food type (e.g., "white rice")
- Density lookup table in app bundle: rice ~0.58 g/mL, chicken breast ~0.85 g/mL, etc.
- Weight (g) = Volume (mL) x Density (g/mL)
- No API call needed for this step

**Fallback (non-LiDAR devices):**
- Reference object detection: plate edge, fork, or hand for scale calibration
- Standard dinner plate = 26-28cm diameter as default reference
- Monocular depth estimation: MiDaS or Depth Pro on-device ML model generates pseudo-depth map from RGB
- Accuracy degrades to ~20-35% variance on portions

**React Native bridge:**

```
// Native Swift module: DepthCaptureModule.swift
// Exposes: captureWithDepth() → { imageBase64, depthData }
// On non-Pro devices: returns { imageBase64, depthData: null }
// Android: react-native-arcore wrapper, same interface
```

### 7.4 Vision Model - Multi-Model Router

No single model performs best across all food categories. Cal AI confirmed they route by food type. Implement:

**GPT-4o (OpenAI) - primary**
- Best on: Western foods, restaurant dishes, complex plated meals
- Cost: ~$0.01-0.02 per scan
- Use for: first-pass on all moderate/complex foods

**Claude claude-sonnet-4-6 (Anthropic) - secondary**
- Best on: Asian cuisines, packaged products, mixed dishes
- Use for: fallback when GPT-4o confidence < 0.7, second opinion on complex dishes

**GPT-4o-mini - cheap router for simple foods**
- Use when: single clearly-identifiable ingredient (banana, apple, plain chicken breast)
- Cost: ~$0.003 per scan
- Reduces overall AI spend by 40-50% on simple meal days

**Router logic:**

```python
async def route_food_scan(image_b64: str, depth_data: dict | None) -> NutritionResult:
    complexity = await classify_complexity(image_b64)  # simple | moderate | complex

    if complexity == "simple":
        result = await call_gpt4o_mini(image_b64, depth_data)
    elif complexity == "moderate":
        result = await call_gpt4o(image_b64, depth_data)
    else:  # complex
        result_a = await call_gpt4o(image_b64, depth_data)
        result_b = await call_claude(image_b64, depth_data)
        result = await merge_results(result_a, result_b)  # weighted average

    if result.confidence < 0.7:
        result = await run_second_opinion(image_b64, depth_data, result)

    return result
```

### 7.5 Prompt Architecture (Chain-of-Thought)

```python
SCAN_SYSTEM_PROMPT = """
You are a registered dietitian and professional food nutritionist.
When shown a photo of food, you:
1. Identify every distinct food item visible in the image
2. Estimate the portion weight in grams for each item, using any size reference
   objects visible (plates, utensils, hands) and any depth/volume data provided
3. Output structured data only - no conversational text

If depth volume data is provided, use it as the primary basis for portion estimation.
If no depth data is available, estimate portions from visual size cues and standard serving sizes.

Confidence guidelines:
- 0.9+: Single ingredient, clearly identifiable, good lighting
- 0.7-0.9: Standard meal, identifiable components, reasonable lighting
- 0.5-0.7: Mixed dish, some uncertainty
- <0.5: Very mixed or obscured dish

Always flag likely hidden fats/oils/sauces not directly visible.
"""

SCAN_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "items": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "food_name": {"type": "string"},
                    "portion_description": {"type": "string"},
                    "weight_grams": {"type": "number"},
                    "calories": {"type": "number"},
                    "protein_g": {"type": "number"},
                    "carbs_g": {"type": "number"},
                    "fat_g": {"type": "number"},
                    "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                    "hidden_calories_warning": {"type": "string"}
                },
                "required": ["food_name", "weight_grams", "calories",
                             "protein_g", "carbs_g", "fat_g", "confidence"]
            }
        },
        "overall_confidence": {"type": "number"},
        "scan_notes": {"type": "string"}
    }
}
```

### 7.6 RAG Nutrition Layer

The vision model identifies the food and estimates the portion. The RAG layer replaces the model's calorie estimates with verified database values - this is what gets Cal AI to ~90% accuracy rather than letting the LLM hallucinate numbers.

**Flow:**
1. Vision model returns `food_name: "brown rice, cooked"` + `weight_grams: 180`
2. Fuzzy search `"brown rice cooked"` against USDA FoodData Central
3. USDA returns: calories/100g, protein/100g, carbs/100g, fat/100g
4. Scale to portion: `(weight_grams / 100) * per_100g_value`
5. Final result uses database-sourced nutrition, not the model's raw numbers

**Indexing:**
- Pre-embed USDA FoodData Central (300K+ foods) using text-embedding-3-small
- Store in pgvector (Postgres extension)
- Cache frequent lookups (Redis, 24h TTL) - common foods like chicken breast, rice, banana never re-hit the API

### 7.7 Complex Dish Handling

Cal AI acknowledged 25-40% variance on mixed dishes. Mitigations:

**SAM (Segment Anything Model) for ingredient isolation:**
- Run Meta SAM on the image to segment individual food regions
- Send segmented regions individually to the vision model instead of the full plate
- Significantly improves accuracy on salads, stir-fry, mixed bowls where ingredients overlap
- SAM is open-source; runs on-device for small images or a cheap inference instance

**Liquid dish protocol:**
- Detected soups/stews/curries: prompt user to select bowl size (tap a size picker, not a form)
- Use depth data to estimate liquid volume directly
- Show confidence warning in UI: "Mixed dish - review and adjust"

**Hidden calorie prompting:**
- System prompt explicitly asks model to flag likely hidden oils, sauces, butter, dressings
- Appear as "estimated additions" the user can confirm or remove
- Example: "Cooked chicken breast - likely cooked with ~1 tsp oil (+40 cal)"

**Correction memory:**
- After 2+ corrections to the same identified meal, save user-adjusted values as a custom food
- Future scans of similar dishes pull from this personalized database first
- Compounds over time - the app gets more accurate the more you use it

### 7.8 Correction Interface

Shown after every scan, before confirming:

- List of identified items as editable rows
- Tap food name: swap to different food (fuzzy search)
- Tap portion: drag slider or type exact grams
- Swipe left: delete item
- Plus button: add missed item (text search or another scan)
- Corrections feed into personal correction history

---

## 8. Nutrition Data

### Primary: USDA FoodData Central (free)
- 300K+ foods including branded products and raw ingredients
- No rate limits at personal use scale
- Best for: raw ingredients, generic Western foods, branded packaged products

### Secondary: Indian Food Composition Tables - IFCT (free)
- Published by India's National Institute of Nutrition (NIN)
- 528 Indian foods with full macro and micronutrient data
- The South Asian equivalent of USDA - covers dal, biryani, roti, sabzi, paneer dishes, rice preparations, snacks, etc.
- Embedded alongside USDA as a second vector store; queried preferentially when vision model identifies an Indian or South Asian dish
- Source: [NIN IFCT](https://www.nin.res.in/ifct2017.html)

### Tertiary: Open Food Facts (free, open-source)
- 3M+ products globally
- Best for: barcode lookups on packaged foods, including Indian packaged products

### South Asian dish fallback - vision model direct estimate
USDA and IFCT cover ingredients and standard dishes, but home-cooked South Asian food varies significantly by preparation (amount of ghee, tadka composition, cream in a dal makhani, etc.). For dishes where the database lookup confidence is low:
- Use the vision model's direct nutritional estimate rather than forcing a weak database match
- GPT-4o and Claude have strong embedded knowledge of South Asian cuisine calorie ranges from training data
- Flag these entries in the log with a lower confidence indicator so they can be reviewed
- After 2+ manual corrections to the same dish, save as a custom food with the corrected values

### Personal Database
- Custom recipes built in the app
- Foods saved from corrected scans (especially important for frequently eaten home-cooked Indian dishes)
- Takes highest priority in all search results

Note: FatSecret Premier API (Cal AI's production choice) is a paid service designed for commercial apps at scale. USDA + IFCT + Open Food Facts covers personal use completely at zero cost.

---

## 9. Apple Watch & Exercise Tracking

### 9.1 Architecture Overview

Apple Watch does not communicate directly with third-party apps in real time. The correct pattern is:

```
Apple Watch
    → writes workout + health data to Apple Health (HealthKit) on iPhone
    → iPhone app reads from HealthKit via react-native-health
    → app processes + displays in dashboard
    → (optional) Watch companion app reads summary back from iPhone via WatchConnectivity
```

This means the core exercise integration is entirely HealthKit-based on the iPhone. The Apple Watch companion app is a separate native watchOS layer built on top.

### 9.2 HealthKit Permission Request

Call once on first launch. User approves per data type individually.

```typescript
import AppleHealthKit, {
  HealthKitPermissions,
  HealthValue,
} from 'react-native-health';

const HEALTHKIT_PERMISSIONS: HealthKitPermissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
      AppleHealthKit.Constants.Permissions.BasalEnergyBurned,
      AppleHealthKit.Constants.Permissions.Workout,
      AppleHealthKit.Constants.Permissions.HeartRate,
      AppleHealthKit.Constants.Permissions.StepCount,
      AppleHealthKit.Constants.Permissions.BodyMass,
      AppleHealthKit.Constants.Permissions.Vo2Max,
      AppleHealthKit.Constants.Permissions.AppleExerciseTime,
    ],
    write: [
      AppleHealthKit.Constants.Permissions.BodyMass,
      AppleHealthKit.Constants.Permissions.Water,
    ],
    // Cycle data - read only. Clue and Flo write these to HealthKit automatically.
    // No direct Clue/Flo API exists - HealthKit is the correct integration path.
    read: [
      ...existingReadPermissions,
      AppleHealthKit.Constants.Permissions.MenstrualFlow,
      AppleHealthKit.Constants.Permissions.OvulationTestResult,
    ],
  },
};

export function requestHealthKitPermissions(): Promise<void> {
  return new Promise((resolve, reject) => {
    AppleHealthKit.initHealthKit(HEALTHKIT_PERMISSIONS, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}
```

### 9.3 Reading Active Calories for a Day

```typescript
export function getActiveCaloriesForDay(date: Date): Promise<number> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return new Promise((resolve, reject) => {
    AppleHealthKit.getActiveEnergyBurned(
      {
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString(),
        ascending: false,
        includeManuallyAdded: true,
      },
      (error, results: HealthValue[]) => {
        if (error) reject(error);
        // Sum all active energy samples for the day
        const total = results.reduce((sum, r) => sum + r.value, 0);
        resolve(Math.round(total));
      }
    );
  });
}
```

### 9.4 Reading Workouts

```typescript
export interface WorkoutEntry {
  id: string;
  type: string;           // "Running", "Cycling", "Strength Training", etc.
  startDate: string;
  endDate: string;
  durationMinutes: number;
  caloriesBurned: number;
  avgHeartRate: number | null;
  source: 'apple_watch' | 'iphone' | 'manual';
}

const WORKOUT_TYPE_MAP: Record<number, string> = {
  37: 'Running',
  13: 'Cycling',
  20: 'Functional Strength Training',
  63: 'High Intensity Interval Training',
  46: 'Swimming',
  52: 'Walking',
  20: 'Weight Training',
  57: 'Yoga',
  // full list: HKWorkoutActivityType in Apple docs
};

export function getWorkoutsForDay(date: Date): Promise<WorkoutEntry[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return new Promise((resolve, reject) => {
    AppleHealthKit.getSamples(
      {
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString(),
        type: 'Workout',
      },
      (error, results) => {
        if (error) reject(error);
        const workouts: WorkoutEntry[] = results.map((w: any) => ({
          id: w.id,
          type: WORKOUT_TYPE_MAP[w.activityType] ?? 'Workout',
          startDate: w.startDate,
          endDate: w.endDate,
          durationMinutes: Math.round(w.duration / 60),
          caloriesBurned: Math.round(w.totalEnergyBurned ?? 0),
          avgHeartRate: w.averageHeartRate ?? null,
          source: w.sourceName?.includes('Watch') ? 'apple_watch' : 'iphone',
        }));
        resolve(workouts);
      }
    );
  });
}
```

### 9.5 Reading Steps and Body Weight

```typescript
export function getStepsForDay(date: Date): Promise<number> {
  return new Promise((resolve, reject) => {
    AppleHealthKit.getStepCount(
      { date: date.toISOString() },
      (error, result: HealthValue) => {
        if (error) reject(error);
        else resolve(Math.round(result.value));
      }
    );
  });
}

export function getMostRecentWeight(): Promise<number | null> {
  return new Promise((resolve) => {
    AppleHealthKit.getLatestWeight(
      { unit: AppleHealthKit.Constants.Units.pound },
      (error, result: HealthValue) => {
        if (error || !result) resolve(null);
        else resolve(result.value);
      }
    );
  });
}
```

### 9.6 Full Daily Sync Function

Called on app foreground and every 15 minutes via background fetch:

```typescript
export async function syncHealthKitForDay(date: Date) {
  const [activeCalories, workouts, steps, weight] = await Promise.all([
    getActiveCaloriesForDay(date),
    getWorkoutsForDay(date),
    getStepsForDay(date),
    getMostRecentWeight(),
  ]);

  // POST to backend to persist + calculate net calories
  await api.post('/exercise/sync', {
    date: date.toISOString().split('T')[0],
    activeCalories,
    workouts,
    steps,
    weightLbs: weight,
  });

  return { activeCalories, workouts, steps };
}
```

### 9.7 Net Calorie Calculation (Backend)

```python
def calculate_net_calories(
    food_calories: int,
    active_calories: int,
    base_target: int,
    mode: Literal["fixed", "eat_back", "net"]
) -> dict:

    if mode == "fixed":
        remaining = base_target - food_calories
        return {
            "target": base_target,
            "eaten": food_calories,
            "burned": active_calories,
            "remaining": remaining,
            "display_burned": True,  # show but don't affect budget
        }

    elif mode == "eat_back":
        adjusted_target = base_target + active_calories
        remaining = adjusted_target - food_calories
        return {
            "target": adjusted_target,
            "eaten": food_calories,
            "burned": active_calories,
            "remaining": remaining,
        }

    elif mode == "net":
        net = food_calories - active_calories
        # BMR floor pulled from user profile
        return {
            "net_calories": net,
            "bmr_floor": user.bmr,
            "should_eat_more": net < user.bmr,
            "eat_more_by": max(0, user.bmr - net),
        }
```

### 9.8 Android: Google Fit / Wear OS

Same data, different library. Use `react-native-google-fit`:

```typescript
import GoogleFit, { Scopes } from 'react-native-google-fit';

// Permission request
GoogleFit.authorize({
  scopes: [
    Scopes.FITNESS_ACTIVITY_READ,
    Scopes.FITNESS_BODY_READ,
    Scopes.FITNESS_BODY_WRITE,
  ],
});

// Active calories for a day
GoogleFit.getDailyCalorieSamples({
  startDate: startOfDay.toISOString(),
  endDate: endOfDay.toISOString(),
  basalCalculation: false, // active only, not resting
}).then((res) => {
  const activeCalories = res.reduce((sum, r) => sum + r.calorie, 0);
});

// Workouts
GoogleFit.getActivitySamples({
  startDate: startOfDay.toISOString(),
  endDate: endOfDay.toISOString(),
}).then((activities) => {
  // activities: [{ activityName, calories, duration, startDate, endDate }]
});
```

### 9.9 WatchConnectivity - iPhone to Watch Sync

After every food log or HealthKit sync, push updated summary to watch:

```swift
// iPhone side (called from React Native bridge after log update)
import WatchConnectivity

class WatchSyncManager: NSObject, WCSessionDelegate {
    static let shared = WatchSyncManager()

    func sendDailySummary(
        caloriesRemaining: Int,
        proteinRemaining: Int,
        carbsRemaining: Int,
        fatRemaining: Int,
        activeCalories: Int,
        steps: Int
    ) {
        guard WCSession.default.isPaired,
              WCSession.default.isWatchAppInstalled else { return }

        let context: [String: Any] = [
            "caloriesRemaining": caloriesRemaining,
            "proteinRemaining": proteinRemaining,
            "carbsRemaining": carbsRemaining,
            "fatRemaining": fatRemaining,
            "activeCalories": activeCalories,
            "steps": steps,
            "updatedAt": Date().timeIntervalSince1970,
        ]

        try? WCSession.default.updateApplicationContext(context)
        // updateApplicationContext is background delivery - fine for summary data
        // use sendMessage() only for real-time confirmations (quick-log from watch)
    }
}
```

```swift
// Watch side (SwiftUI view model)
class WatchViewModel: NSObject, ObservableObject, WCSessionDelegate {
    @Published var caloriesRemaining: Int = 0
    @Published var proteinRemaining: Int = 0
    @Published var activeCalories: Int = 0

    func session(_ session: WCSession,
                 didReceiveApplicationContext ctx: [String: Any]) {
        DispatchQueue.main.async {
            self.caloriesRemaining = ctx["caloriesRemaining"] as? Int ?? 0
            self.proteinRemaining  = ctx["proteinRemaining"] as? Int ?? 0
            self.activeCalories    = ctx["activeCalories"] as? Int ?? 0
        }
        // Reload complications
        CLKComplicationServer.sharedInstance()
            .activeComplications?
            .forEach { CLKComplicationServer.sharedInstance().reloadTimeline(for: $0) }
    }
}
```

### 9.4 Net Calorie Modes

How exercise calories interact with the food budget is a real fitness debate. Support three modes, selectable in settings:

**Mode 1: Fixed Target (default for weight loss)**
- Daily calorie target stays static regardless of exercise
- Exercise data is shown but does not change how many calories you can eat
- Best for: people who want a strict deficit, distrust "eating back" calories
- Display: "1,800 cal target | burned 400 cal | 1,200 eaten | 600 remaining"

**Mode 2: Eat-Back Mode (active days)**
- Active calories burned are added back to the daily budget
- Adjusted target = base_target + active_calories_burned
- Best for: people who train hard and need to fuel recovery
- Display: "1,800 base + 400 burned = 2,200 adjusted | 1,200 eaten | 1,000 remaining"

**Mode 3: Net Calories**
- Shows calories in minus calories out, compared to BMR floor
- Net = food_eaten - active_calories_burned
- Target: net should be above BMR (never eat less than BMR)
- Best for: people focused on body composition with variable training schedules
- Display: "1,200 eaten - 400 burned = 800 net | BMR floor: 1,500 | eat 700 more"

### 9.5 Manual Workout Logging (Fallback)

For workouts not automatically detected by Apple Watch, or for users without a watch:

- Exercise picker: select from list (Running, Cycling, Swimming, Weight Training, HIIT, Yoga, Walking, Other)
- Input: duration in minutes
- Calorie estimate via MET formula:

```
Calories = MET_value x weight_kg x duration_hours

MET values (approximate):
  Walking (moderate): 3.5
  Running (6 mph): 9.8
  Cycling (moderate): 7.5
  Weight training: 5.0
  HIIT: 8.0
  Swimming (moderate): 7.0
  Yoga: 2.5
```

- Result saved to exercise log same as HealthKit-sourced workouts
- Flagged as "manual entry" vs. "from Apple Watch" in the log

### 9.6 Apple Watch Companion App

A native watchOS app built in SwiftUI alongside the React Native iPhone app. React Native cannot build watchOS apps - this requires a separate native Xcode target.

**Architecture:**
```
iPhone app (React Native)
    ↕ WatchConnectivity framework (WCSession)
Apple Watch app (SwiftUI / watchOS)
```

**Watch app features:**

*Complications (watch face widgets):*
- Small: calories remaining number
- Medium: calorie ring mini + macros summary
- Updates every time iPhone syncs or user logs food

*Quick Log screen:*
- Shows last 5 logged foods as tappable buttons - one tap re-logs the same item
- "Scan" button: opens camera on paired iPhone (deep link via WatchConnectivity message)
- Water: +8oz tap button

*Today Summary screen:*
- Full day summary: calories in / burned / remaining, macro bars, workout logged today
- Readable at a glance without pulling out phone

*Workout integration:*
- Watch detects workouts natively via its own sensors
- Calories auto-flow to HealthKit - no extra work needed in the companion app for this
- Optionally: show a "Log this workout to your nutrition app?" notification after a workout ends

**WatchConnectivity data flow:**
```swift
// iPhone sends daily summary to watch after any log update
let context: [String: Any] = [
    "caloriesRemaining": 620,
    "proteinRemaining": 45,
    "carbsRemaining": 80,
    "fatRemaining": 22,
    "activeCalories": 380,
    "lastUpdated": Date()
]
try WCSession.default.updateApplicationContext(context)

// Watch reads on wake:
func session(_ session: WCSession, didReceiveApplicationContext context: [String: Any]) {
    caloriesRemaining = context["caloriesRemaining"] as? Int ?? 0
    // update complication
}
```

### 9.7 What Apple Watch Tracks Automatically (No Setup Needed)

Once HealthKit permissions are granted, the following flow in without any additional work:

- All workouts started from the Watch Workout app (running, cycling, strength, HIIT, etc.)
- Auto-detected workouts (Apple Watch detects walking, running, cycling without user starting a workout)
- Active calorie burn throughout the day (not just during workouts)
- Resting calories (BMR, estimated by the watch based on biometrics)
- Heart rate during workouts
- Step count
- Weight if the user logs it in the Health app or on a connected smart scale

---

## 10. Water Tracking

Water is logged manually - no sensor or API can measure it. The UI must make logging a single sip of effort, not a task.

### 10.1 Daily Water Goal

Two targets: rest days and training days. The app checks whether a workout was logged via HealthKit for today and sets the target accordingly. Per-hour-of-training bonus is added on top.

```typescript
interface WaterGoal {
  restDayLiters: number;       // default: 2.5
  trainingDayLiters: number;   // default: 3.0
  perHourTrainingBonus: number; // default: 0.5L per hour of training
}

function getTodayWaterGoalLiters(
  workoutDurationMinutes: number,
  goal: WaterGoal
): number {
  const isTrainingDay = workoutDurationMinutes > 0;
  const base = isTrainingDay ? goal.trainingDayLiters : goal.restDayLiters;
  const bonus = (workoutDurationMinutes / 60) * goal.perHourTrainingBonus;
  return Math.round((base + bonus) * 10) / 10; // round to 1 decimal
}

// Current targets from training protocol:
// Rest day:     2.5-3.0 L
// Training day: 3.0-3.5 L
// Per hour:     +0.5 L
```

Display in both liters and oz. User can switch units and override targets in settings.

**Pre/intra/post workout water reminders** (when a workout is starting or recently logged):
- 2-4 hrs before: 400-600ml with pre-workout meal
- During: 150-250ml every 15-20 min
- After: +500ml light sweat / +750-1,000ml heavy sweat

### 10.2 Quick-Add UI

The water card lives on the dashboard below the meal sections. Primary interaction is one tap - no forms.

**Preset buttons (covers ~90% of use cases):**
- 8 oz (1 cup / standard glass)
- 12 oz (can / small bottle)
- 16 oz (standard water bottle serving)
- 20 oz (large bottle)

**Custom amount:**
- Tap a numeric input field, type oz or ml
- Remembers last custom amount as a fifth quick-add option

**Visual display:**
- Horizontal progress bar: oz consumed / oz goal
- Large number center: "52 / 75 oz"
- Percentage fill: bar fills left to right, turns from blue-light to blue-full at goal
- Subtle "+" buttons next to each preset for fast repeat logging without confirmation dialogs

### 10.3 Water Log Detail

Tapping the water card expands to show the day's log:

```
8:12 AM   16 oz  (water bottle)       [delete]
10:45 AM   8 oz  (glass)              [delete]
12:30 PM  12 oz  (can)                [delete]
2:00 PM   16 oz  (water bottle)       [delete]
─────────────────────────────
Total: 52 oz  |  Goal: 75 oz  |  23 oz remaining
```

Each entry shows time logged and amount. Swipe to delete. No editing - delete and re-add is simpler.

### 10.4 Water Logging API Calls

```typescript
// Log a water entry
async function logWater(oz: number): Promise<WaterEntry> {
  return api.post('/water/entry', {
    oz,
    loggedAt: new Date().toISOString(),
  });
}

// Get all water entries for a day
async function getWaterForDay(date: string): Promise<WaterSummary> {
  return api.get(`/water/day/${date}`);
  // returns: { entries: [{ id, oz, loggedAt }], totalOz, goalOz, remainingOz }
}

// Delete an entry
async function deleteWaterEntry(id: string): Promise<void> {
  return api.delete(`/water/entry/${id}`);
}

// Update daily goal
async function setWaterGoal(oz: number): Promise<void> {
  return api.put('/user/water-goal', { oz });
}
```

**Backend response shapes:**

```typescript
interface WaterEntry {
  id: string;
  oz: number;
  ml: number;          // derived: oz * 29.5735
  loggedAt: string;    // ISO timestamp
}

interface WaterSummary {
  date: string;
  entries: WaterEntry[];
  totalOz: number;
  totalMl: number;
  goalOz: number;
  remainingOz: number;
  percentComplete: number;  // 0-100
}
```

### 10.5 HealthKit Water Sync (Write-Back)

Optionally write water entries back to Apple Health so the data appears in the Health app alongside other hydration sources:

```typescript
// Add to HealthKit permissions - write access for water
AppleHealthKit.Constants.Permissions.Water  // add to write[] array in initHealthKit

// Write a water entry to HealthKit after saving locally
function syncWaterToHealthKit(oz: number, loggedAt: Date): void {
  const ml = oz * 29.5735;

  AppleHealthKit.saveWater(
    {
      value: ml,
      unit: 'mL',
      startDate: loggedAt.toISOString(),
      endDate: loggedAt.toISOString(),
    },
    (error) => {
      if (error) console.warn('HealthKit water sync failed:', error);
      // non-blocking - app functions without HealthKit write
    }
  );
}
```

This is optional and non-blocking. The app's own Supabase log is the source of truth. HealthKit write just keeps the Health app dashboard consistent.

### 10.6 Reminders

Passive reminders to drink throughout the day - optional, off by default:

- Push notification schedule: configurable intervals (every 1h / 2h / custom) between wake and sleep times
- Smart suppression: if user has already hit goal for the day, stop sending reminders
- "Already drank" quick-action on the notification itself - taps log 8 oz without opening the app

```typescript
// Schedule water reminders using expo-notifications
import * as Notifications from 'expo-notifications';

async function scheduleWaterReminders(
  intervalHours: number,
  wakeTime: string,   // "07:00"
  sleepTime: string,  // "22:00"
) {
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Build notification times for the day
  const times = getIntervalTimes(wakeTime, sleepTime, intervalHours);

  for (const time of times) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time to hydrate',
        body: 'Tap to log a glass of water',
        data: { action: 'log_water', oz: 8 },
        categoryIdentifier: 'WATER_REMINDER',
      },
      trigger: { hour: time.hour, minute: time.minute, repeats: true },
    });
  }
}

// Register quick-action category so "Log 8oz" appears on the notification
Notifications.setNotificationCategoryAsync('WATER_REMINDER', [
  {
    identifier: 'log_water',
    buttonTitle: 'Log 8 oz',
    options: { opensAppToForeground: false },
  },
]);
```

### 10.7 Weekly Water View

In the progress/stats section:

- 7-day bar chart: each bar = total oz for that day, goal line drawn across
- Color: green bar if goal met, grey if not
- Weekly average displayed below chart
- Days goal was met shown as a streak count: "Hit goal 5 of last 7 days"

---

## 11. Menstrual Cycle Integration

### 11.1 Why HealthKit, Not Clue/Flo Directly

Neither Clue nor Flo have a public API. However, both apps write menstrual cycle data to Apple HealthKit automatically. Reading from HealthKit is the correct integration - it works regardless of which period app is used, or even if cycles are logged directly in the Health app.

### 11.2 HealthKit Cycle Data Types

```typescript
// Already included in HealthKit permission request (Section 9.2)
// Read: MenstrualFlow, OvulationTestResult

// HKCategoryValueMenstrualFlow values:
// 0 = unspecified, 1 = none, 2 = light, 3 = medium, 4 = heavy
// HKMetadataKeyMenstrualCycleStart = true on the first day of period
```

### 11.3 Reading Cycle Data and Calculating Phase

```typescript
interface CycleState {
  cycleDay: number;              // 1 = first day of period
  phase: 'follicular' | 'luteal' | 'unknown';
  lastPeriodStart: Date | null;
  estimatedCycleLength: number;  // default 28 if unknown
  nearOvulation: boolean;        // true on days 12-16 (ligament laxity warning)
  lutealCalorieBonus: number;    // 150-300 cal added to daily target
  lutealProteinBonus: number;    // 10-15g added to protein target
}

export async function getCycleState(): Promise<CycleState> {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  return new Promise((resolve) => {
    AppleHealthKit.getMenstrualFlowSamples(
      {
        startDate: ninetyDaysAgo.toISOString(),
        endDate: new Date().toISOString(),
      },
      (error, samples) => {
        if (error || !samples?.length) {
          resolve({ cycleDay: 0, phase: 'unknown', lastPeriodStart: null,
                    estimatedCycleLength: 28, nearOvulation: false,
                    lutealCalorieBonus: 0, lutealProteinBonus: 0 });
          return;
        }

        // Find most recent period start (HKMetadataKeyMenstrualCycleStart = true)
        const periodStarts = samples
          .filter((s: any) => s.metadata?.HKMenstrualCycleStart === true)
          .sort((a: any, b: any) =>
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
          );

        if (!periodStarts.length) {
          resolve({ cycleDay: 0, phase: 'unknown', lastPeriodStart: null,
                    estimatedCycleLength: 28, nearOvulation: false,
                    lutealCalorieBonus: 0, lutealProteinBonus: 0 });
          return;
        }

        const lastPeriodStart = new Date(periodStarts[0].startDate);
        const today = new Date();
        const cycleDay = Math.floor(
          (today.getTime() - lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;

        // Estimate cycle length from last two period starts if available
        let estimatedCycleLength = 28;
        if (periodStarts.length >= 2) {
          const prev = new Date(periodStarts[1].startDate);
          estimatedCycleLength = Math.round(
            (lastPeriodStart.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
          );
        }

        // Ovulation estimated at ~day 14 (range 12-16)
        const estimatedOvulationDay = Math.round(estimatedCycleLength / 2);
        const nearOvulation = cycleDay >= estimatedOvulationDay - 2
                           && cycleDay <= estimatedOvulationDay + 2;

        // Luteal phase = after ovulation to end of cycle
        const isLuteal = cycleDay > estimatedOvulationDay;
        const phase = isLuteal ? 'luteal' : 'follicular';

        resolve({
          cycleDay,
          phase,
          lastPeriodStart,
          estimatedCycleLength,
          nearOvulation,
          lutealCalorieBonus: isLuteal ? 200 : 0,   // midpoint of 150-300 range
          lutealProteinBonus: isLuteal ? 12 : 0,    // midpoint of 10-15g range
        });
      }
    );
  });
}
```

### 11.4 How Cycle State Affects the App

| Condition | Effect |
|-----------|--------|
| Luteal phase | Daily calorie target +200 cal, protein target +12g, shown as adjusted targets on dashboard |
| Near ovulation (days 12-16) | Warning badge on strength training log: "Ligament laxity peaks around ovulation - avoid maxing out compound lifts today" |
| Follicular phase | Standard targets, no adjustment |
| Unknown phase | Standard targets, no adjustment |

The luteal adjustment is shown as a separate line in the dashboard: "Luteal phase adjustment: +200 cal, +12g protein added to today's targets."

### 11.5 Manual Override

If HealthKit has no cycle data (e.g., user hasn't linked a period app), cycle day can be entered manually in Settings. The app remembers the entry date + cycle day and calculates forward from there until HealthKit data becomes available.

---

## 12. Supplement Tracker

Supplement timing matters - iron and D3 cannot be taken within 2 hours of each other, iron absorption drops 40% with food, D3 needs fat. A tracker with timing reminders prevents these conflicts.

### 12.1 Current Protocol

| Supplement | Dose | Timing | Conflicts |
|------------|------|--------|-----------|
| Vitamin D3 | 10,000 IU | With fattiest meal | 2+ hrs from iron |
| Vitamin K2 (MK-7) | 100-200 mcg | Same meal as D3 | - |
| Eiron CR (iron) | 60mg (2x30mg) | Empty stomach + vitamin C | 2+ hrs from D3, coffee, tea, calcium |
| Creatine monohydrate | 3-5g | Any time with food | None |
| Magnesium glycinate | 200-400mg | Before sleep | - |
| B12 | TBD after bloodwork | Morning | - |

Retest dates:
- Vitamin D: mid-July 2026 (drop to 2,000-4,000 IU once at 40-60 ng/mL)
- Ferritin: early August 2026

### 12.2 Supplement Log UI

- List of active supplements on a dedicated Supplements tab
- Each supplement shows: name, dose, last taken (time), today's status (taken / not yet / skip)
- Tap to log as taken - timestamp recorded
- Conflict warning: if you try to log iron within 2 hours of a logged D3 dose, show a warning: "Iron is most effective 2+ hours after Vitamin D3. You took D3 at 1:30 PM - wait until 3:30 PM."

### 12.3 Supplement API Calls

```typescript
interface SupplementEntry {
  id: string;
  name: string;
  doseDisplay: string;        // "10,000 IU", "60mg"
  takenAt: string;            // ISO timestamp
  notes: string | null;
}

// Log a supplement as taken
async function logSupplement(
  supplementId: string,
  takenAt?: Date
): Promise<{ entry: SupplementEntry; conflicts: string[] }> {
  return api.post('/supplements/log', {
    supplementId,
    takenAt: (takenAt ?? new Date()).toISOString(),
  });
  // Backend checks timing conflicts and returns them in the response
}

// Get today's supplement status
async function getTodaySupplements(): Promise<{
  supplements: Array<{
    id: string;
    name: string;
    dose: string;
    takenToday: boolean;
    takenAt: string | null;
    nextSafeTime: string | null;  // null if no conflict
  }>;
}> {
  return api.get('/supplements/today');
}

// Update retest date (when bloodwork results come in)
async function updateRetestDate(
  supplementId: string,
  retestDate: string,
  notes: string
): Promise<void> {
  return api.put(`/supplements/${supplementId}/retest`, { retestDate, notes });
}
```

### 12.4 Retest Reminders

Each supplement with a scheduled retest date triggers a push notification 3 days before and on the day:
- "Vitamin D retest due mid-July - book your bloodwork appointment"
- "Ferritin retest due early August - book your bloodwork appointment"

---

## 13. Body Measurements

Monthly tape measure readings tracked alongside weight to distinguish muscle gain from fat gain.

### 13.1 What to Track

| Measurement | Location | Healthy sign |
|-------------|----------|-------------|
| Upper arm (flexed) | Mid-point between shoulder and elbow, flexed | Rising = muscle gain |
| Chest | Widest point | Gradual rise |
| Waist | 2 cm above navel, narrowest point | Stable or very slow rise |
| Hips | Widest point | Gradual rise |
| Thigh | Mid-thigh | Rising = muscle gain |

**Fat gain warning signal:** waist rising faster than arm and thigh measurements.

### 13.2 Measurement Log UI

- Dedicated section within Progress tab
- Prompted monthly (app sends reminder every 4 weeks)
- Entry screen: 5 fields, units in cm or inches
- Chart view: each measurement plotted over time
- "Healthy sign" indicators: arm/thigh trend vs. waist trend, color-coded

### 13.3 Measurement API Calls

```typescript
interface BodyMeasurement {
  id: string;
  date: string;
  upperArmCm: number;
  chestCm: number;
  waistCm: number;
  hipsCm: number;
  thighCm: number;
  notes: string | null;
}

async function logMeasurements(data: Omit<BodyMeasurement, 'id'>): Promise<BodyMeasurement> {
  return api.post('/measurements/entry', data);
}

async function getMeasurementHistory(): Promise<BodyMeasurement[]> {
  return api.get('/measurements/history');
  // Returns all entries sorted by date ascending
}
```

---

## 14. Bloodwork Log

Bloodwork results and supplement retests tracked in-app so everything is in one place.

### 14.1 Tracked Markers

| Marker | Current result | Target | Retest |
|--------|---------------|--------|--------|
| Vitamin D (25-OH) | 29.2 ng/mL | 40-60 ng/mL | Mid-July 2026 |
| Ferritin | 32 ng/mL (~26 with calibration) | 40-100 ng/mL | Early August 2026 |
| Hemoglobin | 13.0 g/dL | 11.1-15.9 | Next panel |
| RDW | 11.6% (flagged low) | 12.3-15.4% | Next panel (thalassemia minor screen) |
| B12 | Pending | Normal range | Next appointment |
| TSH + free T3 | Pending | Normal range | Next appointment |
| Electrolytes (K, Mg, phosphate) | Pending | Normal range | URGENT |

### 14.2 Bloodwork Log UI

- Dedicated section within Progress tab
- Add result: marker name, date, value, unit, reference range, status (normal / flagged low / flagged high)
- History view: each marker plotted over time with reference range band shown
- Retest reminder: each marker with a scheduled retest date triggers a notification

### 14.3 Bloodwork API Calls

```typescript
interface BloodworkResult {
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

async function logBloodworkResult(data: Omit<BloodworkResult, 'id'>): Promise<BloodworkResult> {
  return api.post('/bloodwork/entry', data);
}

async function getBloodworkHistory(markerName?: string): Promise<BloodworkResult[]> {
  const params = markerName ? `?marker=${encodeURIComponent(markerName)}` : '';
  return api.get(`/bloodwork/history${params}`);
}

async function getUpcomingRetests(): Promise<BloodworkResult[]> {
  return api.get('/bloodwork/retests/upcoming');
  // Returns markers with retestDate within the next 30 days
}
```

---

## 15. Marathon Mode

### 15.1 Dual-Track Overview

Two simultaneous training goals run in parallel:

| Track | Phase | Start | Key dates |
|-------|-------|-------|-----------|
| Muscle gain | Phase 1 now → GZCLP by month 3 | May 2026 | Reach 57-60 kg by late 2027 |
| Marathon training | C25K gated on ferritin 40+ ng/mL | August-October 2026 | Dubai Jan 31 / Copenhagen May 9, 2027 |

The app needs to know which training mode is active on any given day to apply the right calorie targets and exercise expectations.

### 15.2 Mode Switching

A top-level setting: **Training Mode**
- `muscle_gain` - surplus calories, limit cardio, GZCLP strength log
- `marathon` - higher carb days on long runs, in-run fueling reminders, Zone 2 HR ceiling shown
- `both` - active during the overlap period (strength 2x/week + marathon training)

### 15.3 Marathon-Specific Nutrition Overlays

When training mode includes marathon:

**Long run days (runs > 10 miles):**
- Carb target increases: +50-80g carbs on long run day
- Pre-run reminder 2 hrs before logged run: "Pre-run meal: 40-60g carbs + moderate protein"
- In-run fueling prompt for runs > 75 min: "Fuel at mile 6, 12, 18 - gel every 45-60 min"
- Post-run recovery window alert: "Eat 20-30g protein + 60-80g carbs within 2 hrs"

**Race week (7 days before any logged race):**
- Carb loading mode activates: daily carb target increases to 8-12g/kg body weight
- Reduce fiber, fat, and novel foods (GI risk on race day)
- Notification on race eve: "Tomorrow is race day - stick to familiar foods, no fiber bombs"

**Zone 2 ceiling:** 155 bpm. During any logged run, if avg heart rate from HealthKit exceeds 155 bpm, flag it: "Today's run avg HR was 162 bpm - above Zone 2 ceiling of 155 bpm. Consider slowing down on easy runs."

### 15.4 Race Calendar

Races stored in the app as dated events. App automatically activates race-week protocols 7 days before each:

| Race | Date | Status |
|------|------|--------|
| Dubai Marathon | Jan 31, 2027 | Conditional on Gate 1 + Gate 2 clearance by Nov 2026 |
| Copenhagen Marathon | May 9, 2027 | Lottery entered May 31, 2026 |
| Tokyo Marathon | ~Mar 21, 2027 | Ballot Aug 14-28, 2026 |
| San Francisco Marathon | ~Jul 25, 2027 | Opens early 2027 |
| Berlin Marathon | ~Sep 28, 2027 | Ballot opens Oct 2026 |
| NYC Marathon | ~Nov 2027 | Ballot opens Feb 2027 |

---

## 16. Backend Architecture

### Stack

For personal use, keep it simple and cheap:

- **Backend:** Python FastAPI on a single Cloud Run instance (scales to zero, costs ~$0/month idle)
- **Database:** Supabase (Postgres + Auth + Realtime) - free tier easily covers one user
- **Vector store:** pgvector extension on the same Supabase Postgres instance
- **Cache:** In-memory cache (Redis not needed at one user - simple dict with TTL)
- **Object storage:** Supabase Storage for food photos (free tier: 1GB)
- **Auth:** Supabase Auth (single account)

### API Endpoints

```
POST /scan/photo              - Upload image + depth data, return nutrition result
POST /scan/barcode            - Query barcode, return product nutrition
POST /scan/label              - OCR nutrition label
POST /log/entry               - Save food log entry
GET  /log/day/:date           - Get all entries for a date
PUT  /log/entry/:id           - Edit an entry
DELETE /log/entry/:id         - Delete an entry
POST /exercise/entry          - Save a workout (manual or HealthKit-sourced)
GET  /exercise/day/:date      - Get workouts for a date
DELETE /exercise/entry/:id    - Delete a workout entry
GET  /exercise/summary/:date  - Active calories burned + net calorie calc for a date
GET  /user/profile            - Get profile + calorie target + net calorie mode
PUT  /user/profile            - Update profile, recalculate targets
PUT  /user/net-calorie-mode   - Switch between fixed/eat-back/net modes
GET  /user/stats              - Weekly/monthly progress (food + exercise combined)
POST /water/entry                  - Log a water entry (ml + timestamp)
GET  /water/day/:date              - Get all water entries + summary for a date
DELETE /water/entry/:id            - Delete a water entry
PUT  /user/water-goal              - Update training/rest day water targets
POST /supplements/log              - Log a supplement as taken (returns conflicts)
GET  /supplements/today            - Today's supplement status + next safe times
PUT  /supplements/:id/retest       - Update retest date and notes
POST /measurements/entry           - Log monthly body measurements
GET  /measurements/history         - All measurement entries over time
POST /bloodwork/entry              - Log a bloodwork result
GET  /bloodwork/history            - All results, optionally filtered by marker
GET  /bloodwork/retests/upcoming   - Markers with retest dates in next 30 days
GET  /cycle/state                  - Current cycle day, phase, luteal adjustments
POST /cycle/manual                 - Manually set cycle day (if no HealthKit data)
PUT  /training/mode                - Set training mode (muscle_gain/marathon/both)
POST /races/entry                  - Add a race to the calendar
GET  /races                        - All races with upcoming race-week flags
POST /foods/custom                 - Create custom food
GET  /foods/search                 - Search food database
```

### Scan Endpoint - Internal Flow

```
1. Receive image (base64 or multipart) + optional depth_data JSON
2. Validate: file size < 5MB, valid image format
3. Preprocess: resize to 800x800, compress
4. Run complexity classifier (GPT-4o-mini, < 1s)
5. Route to appropriate vision model
6. Parse structured JSON (enforce schema via function calling / response_format)
7. For each identified food item:
   a. Fuzzy match food_name against USDA embeddings (pgvector similarity search)
   b. Scale macros to identified portion weight
   c. Return database-sourced values, not model-generated numbers
8. Return: [{food_name, portion, calories, protein, carbs, fat, confidence}]
```

### Cost at Personal Use Scale

At 3 meals/day x 365 days = ~1,095 scans/year:
- ~70% simple foods via GPT-4o-mini: 766 scans x $0.003 = $2.30
- ~25% moderate via GPT-4o: 274 scans x $0.015 = $4.11
- ~5% complex dual-model: 55 scans x $0.035 = $1.93
- **Total annual AI cost: ~$8-12/year**

Infrastructure (Supabase free tier + Cloud Run): $0-2/month.

---

## 17. Mobile App Architecture

### Framework: React Native with Expo

- Matches Cal AI's confirmed stack
- Expo Camera for all camera features; raw frame access for depth processing
- Single codebase for iOS + Android

### iOS - LiDAR Native Module

LiDAR requires bridged native code:

```
Native Swift module: DepthCaptureModule.swift
Exposes: captureWithDepth() → { imageBase64, depthData }
Non-Pro iPhone returns: { imageBase64, depthData: null }
Backend handles fallback transparently
```

### Android - ARCore Depth

- Native module wrapping ARCore `DepthImage`, same JS interface as iOS module
- Fallback to `depthData: null` on unsupported devices

### State Management

- Zustand for app state
- TanStack Query for server state + caching
- MMKV for fast local storage (food log, user preferences)

### Offline Support

- Log entries created offline, synced when back online
- Last 200 food lookups cached locally
- Barcode results cached locally indefinitely (packaged food nutrition doesn't change)

### Key Libraries

```json
{
  "expo-camera": "latest",
  "expo-barcode-scanner": "latest",
  "react-native-vision-camera": "^4.x",
  "react-native-health": "latest",
  "react-native-google-fit": "latest",
  "zustand": "^4.x",
  "@tanstack/react-query": "^5.x",
  "react-native-mmkv": "^2.x",
  "react-native-reanimated": "^3.x",
  "react-native-skia": "latest"
}
```

### watchOS Companion App

Separate native Xcode target (cannot be built in React Native):

- **Language:** Swift + SwiftUI
- **Framework:** WatchKit + WatchConnectivity
- **Complications:** WidgetKit (ClockKit on older watchOS)
- **Data sync:** WCSession.updateApplicationContext from iPhone after every log update
- Communication is one-way push from iPhone to Watch for display; Watch sends log requests back via WCSession.sendMessage

---

## 18. Secondary Features (Phase 2+)

Ship after core scan + log is working:

### Streaks
- Daily logging streak counter
- Weekly goals (e.g., hit protein target 5 of 7 days)

### AI Nutrition Coach (Chat)
- Conversational interface: "What should I eat tonight to hit my protein goal?"
- Context-aware: knows my goals, today's log, recent history
- Backed by GPT-4o with nutrition data in system prompt

### Progress Tracking
- Weight log + progress graph over time
- Weekly macro adherence charts
- Calorie trend by week/month

### Progress Photos
- Weekly photo grid (body composition over time)
- Stored encrypted, private

### Apple Watch
- Calories remaining on watch face
- Quick log from watch: voice input or recent favorites
- Activity ring import for calorie burn

### Rollover Calories
- Unused calories from previous days roll forward (up to 500 cal buffer)
- Configurable on/off in settings

### Meal Plans
- AI-generated weekly meal plan based on calorie target and food preferences
- Each meal loggable with one tap

---

## 19. Implementation Phases

### Phase 1: Core Scan + Log + Water + Supplements (Weeks 1-6)
- [ ] React Native + Expo project setup with TypeScript
- [ ] Camera capture + on-device preprocessing
- [ ] FastAPI backend on Cloud Run
- [ ] GPT-4o Vision integration with structured output (function calling)
- [ ] USDA FoodData Central + IFCT integration + pgvector RAG
- [ ] Results display + correction interface
- [ ] Barcode scan (Open Food Facts)
- [ ] Manual text food search
- [ ] Daily log (list view by meal)
- [ ] Dashboard with surplus-mode calorie ring (red = under, not over)
- [ ] Critical micronutrients row (iron, calcium, magnesium, zinc) always visible
- [ ] Supabase auth + user profile (with training phase + target weight)
- [ ] Mifflin-St Jeor calorie calculator with surplus mode
- [ ] Auto macro recalculation prompt at every 3 kg weight gain
- [ ] 8-screen setup onboarding including cycle day seed + training phase
- [ ] Water tracking: training vs. rest day targets (2.5L / 3.0L base)
- [ ] Water quick-add presets + custom input
- [ ] Supplement tracker: log taken, timing conflict warnings
- [ ] Supplement retest date reminders
- [ ] End-of-day calorie alert at 8 PM if 300+ cal short
- [ ] Water API + Supplement API endpoints

### Phase 2: Accuracy + Depth + Cycle Integration (Weeks 7-12)
- [ ] Native iOS LiDAR module (Swift + React Native bridge)
- [ ] ARCore depth module for Android
- [ ] Monocular depth fallback (MiDaS on-device)
- [ ] Multi-model router (GPT-4o + Claude + GPT-4o-mini)
- [ ] SAM-based ingredient segmentation for complex dishes
- [ ] Hidden calorie prompting
- [ ] Correction memory + custom food from corrections
- [ ] Nutrition label OCR
- [ ] Voice input (Whisper + GPT-4o-mini)
- [ ] HealthKit cycle data permissions + `getMenstrualFlowSamples` reading
- [ ] Cycle phase detection (follicular vs. luteal) + cycle day calculation
- [ ] Luteal phase macro/calorie adjustment applied to daily targets
- [ ] Ovulation window ligament laxity warning on strength log
- [ ] Manual cycle day override in Settings
- [ ] Cycle state shown on dashboard (small badge + adjusted targets)

### Phase 3: Exercise + Apple Watch + Strength Log (Weeks 13-18)
- [ ] HealthKit permission request flow on first launch
- [ ] HealthKit workout sync (workouts, active calories, heart rate, steps)
- [ ] Strength training log: sets / reps / weight per exercise (not just cardio)
- [ ] GZCLP exercise templates (Phase 1, 2, 3 progressions)
- [ ] Progressive overload tracker (flag when to add weight)
- [ ] Deload signal detection (weekly check)
- [ ] Net calorie mode selector (fixed / eat-back / net)
- [ ] Training day vs. rest day water target auto-switch
- [ ] Body weight auto-sync from HealthKit
- [ ] Google Fit sync for Android parity
- [ ] watchOS companion app - Xcode target setup
- [ ] Watch complications (calories remaining, macro summary)
- [ ] Watch quick-log screen (recent foods, water)
- [ ] WatchConnectivity sync from iPhone after every log update
- [ ] Marathon mode toggle + race calendar entry
- [ ] Zone 2 HR ceiling alert (155 bpm)

### Phase 4: Measurements + Bloodwork + Progress (Weeks 19-24)
- [ ] Body measurements log (monthly: arm, chest, waist, hips, thigh)
- [ ] Measurement trend charts with fat gain warning indicator
- [ ] Monthly measurement reminder notification
- [ ] Bloodwork log: enter results, reference ranges, status
- [ ] Bloodwork history charts per marker (with reference range band)
- [ ] Upcoming retest reminders
- [ ] Progress charts (weight, macros, active calories, water, measurements over time)
- [ ] Weekly water view (7-day bar chart, goal hit streak)
- [ ] Water reminder notifications with "Log 8oz" quick-action
- [ ] AI nutrition coaching chat (context-aware: knows goals, log, cycle phase)
- [ ] Progress photos (monthly grid)
- [ ] Marathon race-week nutrition overlays (carb loading, fueling prompts)
- [ ] Rollover calories
- [ ] Offline sync

---

## 20. Key Technical Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Vision model accuracy insufficient for complex dishes | High | SAM segmentation + dual-model routing + correction interface |
| LiDAR only on ~30% of iOS devices | Certain | Monocular depth fallback; communicate accuracy difference in UI |
| OpenAI/Anthropic API outage blocks core feature | Medium | Dual-provider routing; graceful degradation to barcode/manual |
| Food database gaps for specific cuisines | Medium | USDA + Open Food Facts multi-source fallback + custom food creation |
| LLM hallucinating calorie values | Medium-High | RAG layer overwrites model estimates with database values |
| LiDAR native module complexity | Medium | Use existing react-native-arkit community module first; custom bridge only if needed |
| HealthKit permission denied by user | Medium | App still fully functional without it; manual workout logging as fallback |
| watchOS app requires separate Xcode target | Certain | Plan for this from project setup; not doable in Expo managed workflow - requires bare workflow or Expo modules |
| Apple Watch active calorie data double-counting | Medium | HealthKit deduplicates by source; read from `activeEnergyBurned` aggregate, not individual workout samples |
| WatchConnectivity sync delay | Low | Use `updateApplicationContext` (background) for summary data; `sendMessage` only for immediate actions like quick-log confirmations |

---

## Sources

- [TechCrunch - Cal AI origin story](https://techcrunch.com/2025/03/16/photo-calorie-app-cal-ai-downloaded-over-a-million-times-was-built-by-two-teenagers/)
- [TechCrunch - MyFitnessPal acquisition](https://techcrunch.com/2026/03/02/myfitnesspal-has-acquired-cal-ai-the-viral-calorie-app-built-by-tens/)
- [CNBC - $1.4M/month profile](https://www.cnbc.com/2025/09/06/cal-ai-how-a-teenage-ceo-built-a-fast-growing-calorie-tracking-app.html)
- [Inc. Magazine - $40M exit profile](https://www.inc.com/ben-sherry/he-built-an-ai-app-in-high-school-made-40m-and-sold-to-myfitnesspal-now-hes-aiming-even-bigger/91307748)
- [FatSecret Platform API](https://platform.fatsecret.com/platform-api)
- [DEV.to - FastAPI + GPT-4o implementation](https://dev.to/wellallytech/from-pixels-to-calories-building-a-high-precision-meal-tracker-with-gpt-4o-vision-5018)
- [DEV.to - SAM + GPT-4o ingredient segmentation](https://dev.to/wellallytech/beyond-simple-image-recognition-building-a-precise-ai-nutritionist-with-gpt-4o-and-segment-29ml)
- [Screensdesign UI breakdown](https://screensdesign.com/showcase/cal-ai-calorie-tracker)
- [Healthcare.digital acquisition analysis](https://www.healthcare.digital/single-post/strategic-consolidation-of-digital-nutrition-analysis-of-the-myfitnesspal-acquisition-of-cal-ai)
- [iOS Swift clone - GitHub](https://github.com/pushpenko996/apps-click-cal-ai-ios)
