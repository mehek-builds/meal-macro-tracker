# Nourish

Logging nutrition by hand is slow and error-prone, so people stop doing it. Nourish turns a photo of a meal into its calories and macros in seconds and syncs them to Apple Health.

## System architecture

The photo flows down through the vision pipeline and back up as a grounded, portioned log entry. Health and cycle data flow in from the device, independently, on the client.

```
      ┌─────────────────────────────────────────────────────────────────┐
  On  │  Nourish app  (Expo SDK 51 / React Native 0.74, TypeScript)      │
device│  Dashboard · Scan (camera) · Plan · Progress · Settings          │
      │  Zustand + MMKV persistence · TanStack Query · Reanimated/Skia   │
      └───────▲───────────────────────────────┬─────────────────────────┘
              │ Apple HealthKit (on device)    │ base64 photo
              │ react-native-health + patch    │ POST /scan/photo
   ┌──────────┴───────────┐                    │
   │ healthkit.ts          │                   ▼
   │  active energy, steps,│   ┌────────────────────────────────────────┐
   │  weight, workouts     │   │  FastAPI service  (async, Pydantic v2) │
   │ cycle.ts              │   │  12 routers: scan · log · exercise ·   │
   │  menstrual-flow reads │   │  user · water · supplements · cycle ·  │
   └───────────────────────┘   │  measurements · bloodwork · training · │
                               │  races · foods                         │
                               └──────┬───────────────────────┬─────────┘
                                      │                        │
             ┌────────────────────────▼─────────┐   ┌──────────▼───────────────┐
             │ Vision router (services/          │   │ Deterministic calculators │
             │   vision_router.py)               │   │ services/calories.py      │
             │  1. GPT-4o (primary), Claude      │   │  BMR · TDEE · surplus ·   │
             │     (fallback): identify + portion│   │  macro split · luteal     │
             │  2. structured JSON parse         │   │ net_calories · met ·      │
             │  3. augment_with_usda: replace    │   │ supplements · cycle ·     │
             │     macros with USDA values       │   │ water_goal                │
             └────────────────┬──────────────────┘   └───────────────────────────┘
                              │ food name + grams
             ┌────────────────▼──────────────────┐
             │ USDA FoodData Central client       │
             │ services/usda.py                   │
             │  search · dataset ranking ·        │
             │  nutrient-number map · per-100g    │
             │  scaling · retry/backoff           │
             └────────────────────────────────────┘

   Persistence:  dev = in-memory store (app/store.py)
                 prod target = Supabase Postgres + pgvector  (db/schema.sql)
```

The backend is deliberately split into two kinds of code. The **deterministic calculators** (`backend/app/services/`) are pure Python with no I/O: given inputs they always return the same nutrition or training numbers, and they are exhaustively unit-tested. The **integration surfaces** (the vision router, the USDA client, the HealthKit bridge) touch the outside world, are gated on keys or native modules, and degrade to clearly labeled fallbacks when those are absent. The mobile app mirrors the backend's wire contract exactly (camelCase JSON via a `CamelModel` base), so the two halves cannot drift.

---

## The full stack

| Layer | Technologies |
|-------|--------------|
| **Mobile app** | Expo SDK 51, React Native 0.74.5, TypeScript 5.3, React Navigation (native-stack + bottom-tabs), Zustand + `persist` middleware, TanStack Query v5 |
| **On-device state / storage** | `react-native-mmkv` (MMKV 2.4.0) as the Zustand storage engine, persisted and rehydrated on launch |
| **Camera / scan** | `expo-camera` (`CameraView`, base64 capture), `expo-barcode-scanner`, `react-native-vision-camera` 4.7.3 |
| **Health integration** | `react-native-health` (RNAppleHealthKit pod 1.7.0) with a local `patch-package` patch adding `getMenstrualFlowSamples`; `react-native-google-fit` for Android |
| **UI / motion** | `react-native-reanimated` 3.10, `@shopify/react-native-skia`, `react-native-svg`, `lucide-react-native`; Fraunces / Hanken Grotesk / Space Grotesk via `@expo-google-fonts` |
| **Native iOS** | Expo prebuild bare workflow: Objective-C(++) `AppDelegate`, Swift bridging header, `Info.plist`, HealthKit entitlement, `PrivacyInfo.xcprivacy`, CocoaPods (Hermes engine 0.74.5), Xcode project + workspace |
| **Backend / API** | FastAPI (>=0.110), Uvicorn (standard), Pydantic v2 (>=2.6), pydantic-settings, python-multipart, httpx; CORS middleware, camelCase `CamelModel` wire contract |
| **AI / vision** | OpenAI `gpt-4o` (primary) via the `openai` async SDK, Anthropic `claude-sonnet-4-6` (fallback) via the `anthropic` async SDK, `gpt-4o-mini` configured as the cheap tier; structured JSON-schema output, Pillow / NumPy available |
| **Nutrition data** | USDA FoodData Central REST API (`api.nal.usda.gov/fdc/v1`) via httpx, `DEMO_KEY` default; Open Food Facts and IFCT planned |
| **Deterministic domain logic** | Pure-Python calculators: Mifflin-St Jeor BMR/TDEE, surplus + macro split, net-calorie modes, MET table, supplement conflict windows, menstrual-cycle phase, water goal |
| **Persistence** | Dev: in-memory dict store (`app/store.py`). Production target: Supabase Postgres + `pgvector` (`db/schema.sql`), `text-embedding-3-small` (1536-dim) `ivfflat` cosine index for food RAG |
| **Testing / tooling** | pytest (252 backend tests, `backend/tests/`), FastAPI `TestClient`, `tsc` typecheck, `patch-package` postinstall, Hermes JS engine |

---

## The vision pipeline (`backend/app/services/vision_router.py`)

The scan is a two-stage pipeline that treats the language model and the nutrition database as good at different things.

**Stage 1: identify and portion.** `route_food_scan()` sends the base64 photo to a vision model with the `SCAN_SYSTEM_PROMPT` (`backend/app/prompts/scan.py`), which casts the model as a registered dietitian and asks it to (a) name every distinct food item, (b) estimate each portion's weight in grams using visible size references, and (c) return structured data only. The prompt ships with a strict `SCAN_RESPONSE_SCHEMA`, and the OpenAI path pins `response_format={"type": "json_object"}`, so the result parses deterministically. If optional LiDAR depth data is supplied, the prompt instructs the model to use it as the *primary* basis for portion estimation.

- **Primary model:** OpenAI **GPT-4o** (`_call_openai`, model configurable via `vision_model_primary`).
- **Fallback model:** Anthropic **Claude** (`_call_claude`, `vision_model_secondary`, default `claude-sonnet-4-6`), used when no OpenAI key is present.
- **No-key fallback:** when neither key is configured, the endpoint returns a clearly flagged canned stub (`stub=True`) rather than failing, so the API stays explorable offline.

**Stage 2: re-ground the macros against USDA.** This is the core correctness move. `_augment_with_usda()` throws away the model's calorie and macro guesses and replaces them with authoritative USDA FoodData Central values, scaled to the model's gram estimate. The model keeps credit for what it is good at (the food name and the portion); USDA supplies the trustworthy calories, protein, carbs, fat, and micronutrients. Each item records its provenance in `data_source`: `usda:<fdcId>` when a match was found, `model_estimate` when it was not, and `scan_notes` reports how many items were verified.

The mobile client never fabricates food: in `mobile/src/screens/ScanScreen.tsx`, a failed or empty analysis returns the user to the viewfinder with an alert instead of logging a placeholder.

## The USDA FoodData Central client (`backend/app/services/usda.py`)

A real client against the official USDA API, not a canned table. Given a food name and a portion weight it returns per-100g macros and micros scaled to the portion, and it takes the messiness of the source data seriously:

- **Dataset selection.** It queries the `Foundation`, `SR Legacy`, and `Survey (FNDDS)` datasets and *excludes* `Branded` on purpose (branded entries are per-serving barcode products that pollute generic meal queries).
- **Result ranking.** Matches are ranked by dataset tier (`Foundation` > `SR Legacy` > `FNDDS`) before falling back to USDA's own relevance order, so "broccoli" resolves to "Broccoli, raw" rather than a fried preparation.
- **Nutrient mapping.** It reads nutrients by their stable USDA nutrient numbers (208 energy, 203 protein, 204 fat, 205 carbs, plus 303/301/304/309 for iron, calcium, magnesium, zinc) and takes only the `KCAL` energy row, never the kilojoule one.
- **Resilience.** An 8-second timeout, three attempts, and exponential backoff handle the `DEMO_KEY` throttle and transient 400/429/5xx responses; `lookup_macros_batch()` runs all of a meal's lookups concurrently with `asyncio.gather`.
- **Zero-setup.** It defaults to the public `DEMO_KEY`; set `USDA_API_KEY` for a real (free) key with higher limits.

The `pgvector` semantic-search layer over a pre-embedded USDA/IFCT/Open Food Facts corpus (`backend/app/services/rag.py`) is a deliberate stub: it returns canned per-100g values and is used *only* on the no-key path, so it can never clobber real model or USDA output. Its production design (embed with `text-embedding-3-small`, cosine search over the `foods_usda` table) is already expressed in `db/schema.sql`.

## The deterministic calculators (`backend/app/services/`)

Everything here is pure Python, no I/O, and unit-tested. This is the nutrition and training brain of the app.

- **`calories.py`** implements the surplus-first energy model: Mifflin-St Jeor **BMR**, **TDEE** via five activity factors, a `daily_calorie_target` (build-muscle surplus, default +300; maintain; lose at -500), a macro split (protein at 2.9 g/kg, fat at 25% of calories, carbs as the remainder), a luteal bonus (+200 cal / +12 g protein), and a `needs_recalc` trigger that fires when the 7-day average weight has gained 3 kg since the last recalculation.
- **`net_calories.py`** implements the three exercise-accounting modes from the spec: `fixed` (exercise is shown but does not change the budget), `eat_back` (active calories are added back), and `net` (compares food minus active against a BMR floor and tells you to eat more if you dip below it).
- **`met.py`** estimates manual-workout calories from a MET table (`MET x weight_kg x hours`).
- **`supplements.py`** encodes the supplement protocol and its timing conflicts: the iron-versus-vitamin-D3 two-hour rule is represented as a conflict-window map, and `check_conflicts` returns human-readable guidance plus the next safe time to take a dose.
- **`cycle.py`** computes cycle day, phase (follicular / luteal), estimated cycle length, ovulation proximity, and the luteal bonuses from a list of period start dates.
- **`water_goal.py`** computes the daily hydration target (2.5 L rest day, 3.0 L training day, +0.5 L per training hour) and converts to ounces.

These are not cosmetic. `backend/app/routers/exercise.py` shows them composed: the `/exercise/summary/{date}` endpoint pulls the day's workouts and food totals, re-derives the user's luteal-adjusted target and BMR, and runs `calculate_net_calories` so the exercise budget stays in lockstep with the profile.

## The API surface (`backend/app/main.py`, `backend/app/routers/`)

A FastAPI service mounting twelve routers, all documented at `/docs`:

`scan` (photo / barcode / label), `log` (food-log CRUD), `exercise` (workouts + net-calorie summary), `user` (profile + derived targets + net-calorie mode), `water`, `supplements` (log + conflict detection), `measurements` (body tape readings), `bloodwork` (lab markers + retest tracking), `cycle` (state + manual entry), `training` (marathon mode), `races` (race calendar), and `foods` (custom foods + search). The photo scan enforces a 5 MB upload ceiling (HTTP 413) before doing any work, and CORS is configured to safely downgrade credentials if a wildcard origin is set.

The wire contract is camelCase JSON produced by a shared `CamelModel` Pydantic base, while Python keeps snake_case internally. `mobile/src/api/endpoints.ts` is a typed function per endpoint written against that contract, so a backend field rename surfaces as a TypeScript error rather than a silent runtime mismatch.

Persistence today is an in-memory dict (`backend/app/store.py`), which every CRUD router round-trips through so the whole API is explorable end to end without a database. Production swaps this for Supabase; the full relational schema already exists.

## Apple HealthKit integration (`mobile/src/health/`)

The health reads are real, not mocked. `mobile/src/health/healthkit.ts` uses `react-native-health` to request read scopes (active and basal energy, steps, weight, workouts, heart rate, menstrual flow) and write scopes (weight, water), then `syncHealthKitForDay()` reads active calories, steps, latest body weight, and workouts in parallel for a given day. Apple Watch workouts are detected by inspecting the sample's `sourceName`. Every function rejects cleanly on non-iOS or unlinked builds, so the app degrades instead of crashing.

The cycle reader (`mobile/src/health/cycle.ts`) is the most involved piece. It reads menstrual-flow samples from Apple Health (including data written by third-party apps like Clue), derives period-start dates by preferring Apple's `HKMetadataKeyMenstrualCycleStart` metadata and falling back to the first bleeding day after a gap, and then computes the same cycle state the backend does, so HealthKit-derived and manually entered state agree. It handles timezones carefully: dates are keyed in local time to avoid the UTC shift that would otherwise move a local-midnight sample to the previous day for users east of UTC (for example UTC+4), and stale data older than ~45 days is guarded so the app never reports "cycle day 180."

## The native HealthKit patch (`mobile/patches/react-native-health+1.19.0.patch`)

`react-native-health` does not ship a menstrual-flow query, so the repo adds one. The `patch-package` patch (applied automatically via the `postinstall` script) writes real Objective-C into the library: a `fetchMenstrualFlowSamplesForPredicate:` method that runs an `HKSampleQuery` against `HKCategoryTypeIdentifierMenstrualFlow`, maps each sample's category value to `none`/`light`/`medium`/`heavy`, reads the cycle-start metadata flag, and exposes it to JavaScript as `getMenstrualFlowSamples`. It also registers the `MenstrualFlow` read permission and adds the matching TypeScript declarations. This is a genuine native-module extension, not a configuration tweak.

## The native iOS project (`mobile/ios/`)

Because HealthKit, the camera, and the menstrual-flow patch all require native modules, the app runs on Expo's bare / prebuild workflow, and the generated iOS project is checked in. It includes the Objective-C(++) `AppDelegate` (`.h` / `.mm`) and `main.m`, a Swift bridging header plus a `noop-file.swift` (which forces Xcode to wire up the Swift toolchain the pods need), the `Info.plist` carrying the camera and HealthKit usage descriptions, a `.entitlements` file enabling `com.apple.developer.healthkit`, a `PrivacyInfo.xcprivacy` manifest declaring required-reason API usage with no tracking and no collected data types, the asset catalogs and splash storyboard, and the CocoaPods setup (`Podfile`, `Podfile.lock`, `Podfile.properties.json`) running the Hermes engine. The linked pods include `ExpoCamera` 15.0.16, `EXBarCodeScanner` 13.0.1, `RNAppleHealthKit` 1.7.0, `VisionCamera` 4.7.3, `RNReanimated` 3.10.1, `RNSVG` 15.2.0, and `MMKV` 2.4.0. Generated build artifacts (`Pods/`, `build/`, Hermes binaries) are kept out of git.

## The mobile app (`mobile/`)

`mobile/App.tsx` builds a five-tab bottom navigator (Home, Plan, a raised terracotta **Scan** FAB, Progress, Me) with onboarding as a pre-tab gate and the camera scan presented as a full-screen modal. Screens live in `mobile/src/screens/` (Dashboard, Onboarding, Scan, Supplements, Progress, Settings, Plan) and reusable pieces in `mobile/src/components/` (`CalorieRing`, `MacroBars`, `MealSection`, `MicronutrientRow`, `SupplementChecklist`, `WaterTracker`, `ExerciseLog`).

Client state is a Zustand store (`mobile/src/state/useAppStore.ts`) persisted through MMKV, computing today's consumed and remaining calories and macros on the fly. Notably, it seeds the bloodwork log with a real lab panel rather than mock data, so the app has genuine deficiency context (vitamin D, ferritin, RDW) to reference and reason about.

The **"Nourish" design system** (`mobile/src/theme/tokens.ts`) is a single source of color, spacing, type, and shape, and it encodes the surplus-first inversion directly: a warm off-white canvas, a terracotta accent, and semantic state colors where red means "under target, eat more" and blue is reserved as the success color for hitting the surplus. No component is allowed a raw hex value; everything references a token.

## Production database schema (`db/schema.sql`)

The production target is Supabase Postgres with `pgvector`. The schema defines `profiles`, `food_log_entries`, `custom_foods`, an embedded-food RAG table `foods_usda` (with a `vector(1536)` column and an `ivfflat` cosine index), `exercise_workouts`, `water_entries`, `supplements` and `supplement_logs`, `body_measurements`, `bloodwork_results`, `cycle_overrides`, and `races`, with UUID primary keys, `timestamptz` timestamps, check constraints, and per-user date indexes throughout. The routers do not yet read from it (they use the in-memory store); wiring `backend/app/db.py` to this schema is the persistence swap.

---

## Running it

### Backend

```bash
git clone https://github.com/mehek-builds/meal-macro-tracker.git
cd meal-macro-tracker/backend

python3 -m venv .venv
.venv/bin/pip install -e ".[dev]"
.venv/bin/uvicorn app.main:app --reload      # http://localhost:8000/docs
```

No environment variables are required to boot: the API imports and serves cleanly with no `.env`. Copy `backend/.env.example` to `backend/.env` and fill in keys to switch integrations from fallback to live:

- `OPENAI_API_KEY` turns on the real GPT-4o vision path (`ANTHROPIC_API_KEY` enables the Claude fallback).
- `USDA_API_KEY` upgrades the USDA client from the shared `DEMO_KEY` to a real key.
- `SUPABASE_URL` / `SUPABASE_*_KEY` and `DATABASE_URL` are read for the production persistence swap.

To enable the real vision providers, install the AI extra: `.venv/bin/pip install -e ".[ai]"` (adds `openai`, `anthropic`, `pillow`, `numpy`). The Supabase client lives behind the `data` extra.

### Mobile

```bash
cd mobile
npm install                 # runs patch-package via postinstall
npx expo start
```

Set `EXPO_PUBLIC_API_URL` (see `mobile/.env.example`, default `http://localhost:8000`) to point the app at your backend. HealthKit, the camera, the menstrual-flow patch, and Android Google Fit are native modules and are **not** available in Expo Go; they require a bare native build:

```bash
npx expo run:ios            # or run:android
```

## Testing

The backend test suite is real and green (252 tests, ~1s):

```bash
cd backend
.venv/bin/pytest -q
```

It covers both the pure calculators (`test_calories`, `test_cycle`, `test_net_calories`, `test_supplements`, `test_water_goal`) and every API router through FastAPI's `TestClient` (`test_api_scan`, `test_api_exercise`, `test_api_user`, and the rest). The mobile app typechecks with `npm run typecheck` (`tsc --noEmit`).

---

## What is real vs. what is stubbed

The correctness discipline of this repo includes being honest about its own edges. Every stub is clearly labeled in code and returns flagged placeholder data rather than pretending.

| Capability | Status | Where |
|-----------|--------|-------|
| GPT-4o / Claude photo recognition | Real (key-gated; labeled stub with no key) | `services/vision_router.py` |
| USDA FoodData Central macro lookup | Real (defaults to `DEMO_KEY`) | `services/usda.py` |
| Calorie / macro / net-cal / MET / supplement / cycle / water math | Real, unit-tested | `services/*.py` |
| Apple HealthKit reads (energy, steps, weight, workouts, menstrual flow) | Real, native | `mobile/src/health/*.ts`, native patch |
| Client persistence (Zustand + MMKV) | Real | `mobile/src/state/useAppStore.ts` |
| Backend persistence | In-memory (dev); Supabase schema ready, not yet wired | `app/store.py`, `db/schema.sql` |
| pgvector RAG food search | Stub (used only on the no-key path) | `services/rag.py` |
| Barcode + nutrition-label OCR scan | Stub | `routers/scan.py` |
| LiDAR / ARCore depth capture | Stub interface | `mobile/src/native/DepthCapture.ts` |
| watchOS companion app | Design only (future) | `watch/README.md` |

The backend was installed and its full suite run in this environment (252 passing). The mobile manifests are valid and internally consistent, but a full `npm install`, native build, and on-device run were not performed here; treat the mobile side as compile-ready, not a verified device build.

## Scope

**In:** photo-first food logging with real AI recognition and USDA-grounded macros, surplus-first calorie and macro targeting, net-calorie exercise accounting, Apple HealthKit and Apple Watch sync, hydration and supplement tracking, menstrual-cycle-aware adjustments, body-measurement and bloodwork logs, and a marathon-training race calendar.

**Out (for now):** the pgvector RAG lookup, barcode and label OCR, LiDAR depth-based portioning, the watchOS companion, and the live Supabase persistence swap. The design and schema for each already exist; they are wiring, not redesign.
