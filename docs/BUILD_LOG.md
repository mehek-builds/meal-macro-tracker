# Fitness Tracker - Build Process & Decision Log

**Project:** Personal AI nutrition / exercise / hydration tracker (surplus-first; muscle-gain + 2027 marathon goals), scaffolded from a 1,748-line PRD.
**Repo:** https://github.com/mehek-builds/fitness-tracker
**Last updated:** 2026-06-01 (main @ `d1ae86c`)

> Living document, mirrored in the repo (docs/BUILD_LOG.md) and the notes vault. Append a dated entry to the Change Log and update the commit-arc table on each significant build change.

---

## 1. How it was built (methodology)

- **Scope clarified before building** via targeted questions (full scaffold, commit directly to main).
- **Parallel agents for independent tracks.** Three `general-purpose` agents built `backend/`, `mobile/`, and `db/`+`docs/` concurrently, each given a precise file-by-file spec and the exact PRD formulas so they were not guessing.
- **Trust but verify.** Every agent's output was independently checked (ran tests, grepped symbols, read diffs) rather than trusting its summary.
- **Tester + reviewer pipeline.** A tester agent added 159 endpoint tests and caught a real `store.py` id-collision bug; a read-only reviewer agent found 2 critical issues plus mobile/backend contract mismatches.
- **Fix loop.** A backend agent fixed the logic bugs and established the camelCase wire contract; a mobile agent then aligned the TypeScript types by reading the finalized backend as ground truth, which eliminated drift.
- **Autonomous concurrent sessions.** Later, separate sessions trickled work into the shared working tree (design system, iOS prebuild, assets). Each wave was watched for stability, characterized, verified clean (no build junk), and committed after confirmation.
- **Git discipline.** Direct-to-main per preference; inline commit identity (global git config never altered); every push verified to exclude artifacts and secrets (`.venv`, `node_modules`, `Pods/`, binaries).

## 2. Architecture & key decisions

- **Monorepo:** `backend/` (FastAPI), `mobile/` (Expo React Native + TypeScript), `db/schema.sql` (Postgres + pgvector), `docs/`, `watch/`.
- **Backend philosophy:** pure deterministic calculators implemented for real and unit-tested (calorie targets, net-calorie modes, water goal, MET, supplement timing conflicts, cycle phase); anything needing a model, database, or native module is a clearly marked stub (`TODO(Section X)`). In-memory store for now, Supabase in production.
- **Wire contract:** camelCase JSON via a `CamelModel` base (`alias_generator=to_camel`, `populate_by_name`); snake_case Python field names internally. Backend is the source of truth; mobile mirrors it.
- **Design system ("Nourish"):** centralized tokens, no raw hex in components (a `withAlpha` helper covers translucency), an animated Skia calorie ring, a 5-tab bottom navigator with a raised scan FAB.
- **Native:** iOS moved to the bare / prebuild workflow (`expo-dev-client`, `expo run:ios`); the Expo-generated `ios/.gitignore` keeps `Pods/`, `build/`, and Hermes binaries out of git.

## 3. Conventions established

- Surplus-mode inverted logic: red = under target, blue = target hit; the ring center shows calories still needed (not "allowed").
- Mobile mirrors backend wire shapes exactly; the backend is canonical for contracts.
- Generated native artifacts are never committed; only native source is tracked.

## 4. Commit arc

```
d1ae86c  Compute cycle day + period-start dates in local time
266a977  Read menstrual-flow (cycle) from Apple Health (patch react-native-health)
a267957  Wire real Apple HealthKit reads into the dashboard
cbb7df5  Make food scans real: GPT-4o vision + USDA FoodData Central
ff2ce0b  Log first successful Simulator build + camera wave
5dd65a9  Wire live camera into scan screen (simulator fallback)
139e07c  Bring BUILD_LOG current (chase + surplus/entitlement)
e875f55  Wire confirmed scan items into the food log
454ebd2  HealthKit entitlement + write usage string
394c95e  Lower default calorie surplus to 300 (match PRD table)
f77c98d  Persist Zustand store to MMKV
c3170b8  Drop expo-dev-client; redesign onboarding; ring autosize
63411ee  Log the re-review round in BUILD_LOG
c1e6bf6  Fix re-review: camelCase net-cal result + LOW polish
ec5168f  Add build-process and decision log (this file)
a120eec  App icon/splash assets (resolve app.json refs)
42a013d  iOS native project (expo prebuild); run:ios/run:android
abc417a  expo-dev-client + sorted deps
eb407cd  HealthKit mock aligned to WorkoutEntry type
1293ff7  withAlpha token cleanup (zero raw hex in components)
5424ad7  Wire in the "Nourish" design system
d019023  Design-system foundation (tokens/icons/fonts)
065c7ce  Fix exercise summary to use derived targets
7480857  Add target + milestone weight to profile
d8d1b56  Align mobile types/client to backend contract
875d32b  Fix review findings (luteal, recalc, harden, camelCase)
6d356a9  Backend API tests (159) + store id-collision fix
2beff40  Scaffold monorepo from PRD
```

## 5. Current state

Repo clean, local = remote (main @ `d1ae86c`, pushed). Backend tests green; mobile `tsc --noEmit` clean. **Running on the physical iPhone 17 Pro Max** with three formerly-stubbed systems now real and verified on-device:
- **Food scan:** photo → GPT-4o vision (food + portion) → USDA FoodData Central authoritative macros/micros scaled to portion. Real macros confirmed on a live scan.
- **Apple HealthKit:** real reads of active energy, steps, weight, workouts; dashboard shows live data (e.g. "Apple Health · 201 steps · 99.2 lb"). Signed and installed on a **free** personal Apple team.
- **Cycle (Apple Health menstrual flow, incl. Clue):** patched `react-native-health` to read menstrual flow; derives cycle day / phase / luteal adjustment; verified reading real Clue data ("Cycle day 2 · follicular").

## 6. Standing caveats

1. **HealthKit works on a FREE Apple account** - this disproves the earlier "paid-only" assumption. The `com.apple.developer.healthkit` entitlement signs and runs on a free personal team (verified, Xcode 26.5 / iOS 26.5, on a physical iPhone). BUT: free-account builds **expire after ~7 days** and must be re-signed/reinstalled, and **Push notifications remain paid-only**.
2. **Clue → Apple Health sync is partial and non-retroactive** - Clue only writes period data tracked *after* its Apple Health permission is enabled; it does not backfill historical days. So the app's cycle day can lag by any un-synced first day(s). This is documented Clue behavior, not an app bug; re-logging the missing day in Clue fixes it.
3. **Persistence still in-memory** - Supabase is not wired (backend uses an in-memory store). Food photo scan, HealthKit reads, and cycle are now REAL (not stubs); the barcode and nutrition-label-OCR scan paths remain stubs.
4. **iOS-only** - `android/` was not generated (run `expo prebuild -p android` for parity).
5. Design files cite PRD section numbers that do not exist in the 20-section PRD (cosmetic).

## 7. Next steps

- ~~Build on a Mac to verify it runs~~ DONE - built, signed, and running on the physical iPhone 17 Pro Max.
- ~~Wire real AI providers for the photo scan~~ DONE - GPT-4o vision + USDA FoodData Central.
- Wire real **Supabase** persistence (still in-memory).
- Add real macros for the **barcode** and **label-OCR** scan paths (still stubs); USDA + Open Food Facts.
- Surface HealthKit **steps + weight** as first-class dashboard cards (currently a one-line readout); pull cycle micros into the macro/micros view.
- Generate `android/` for platform parity.
- Implement deferred PRD features: voice input, recipe builder, marathon nutrition overlays, strength / GZCLP log, notifications.

## 8. Change log

- **2026-05-31** - Initial scaffold through iOS prebuild and the "Nourish" design system. Backend at 252 passing tests; main at `a120eec`. See the commit arc above for the full sequence.
- **2026-05-31** - Re-ran tester + reviewer. Tester confirmed mobile `tsc --noEmit` is clean (first compile-verification of the design-system + contract types). Reviewer found 0 criticals; 1 HIGH (the exercise net-calorie result leaked snake_case keys) fixed by modeling it as a `NetCalorieResult` CamelModel; plus LOW polish (CalorieRing morning-rule threshold, a `needs_recalc` wiring note, Settings now persists net-calorie-mode to the backend). Commit `c1e6bf6`.
- **2026-05-31** - Chased the autonomous design/native session to completion, committing each settled wave after a tsc / JSON / no-junk check: MMKV store persistence, expo-dev-client removed, onboarding redesign, ring autosize, and scan-to-log wiring. Then the agreed follow-ups: lowered the default calorie surplus to 300 so targets match the PRD table (`394c95e`), added the HealthKit entitlement + write usage string for App Store compliance (`454ebd2`), and brought this log current. Backend 252 green and mobile tsc clean throughout. main at `e875f55`.
- **2026-05-31** - First successful build + launch: ran the app on the **iPhone 17 Pro iOS Simulator** (Build Succeeded, 0 errors) via `DEVELOPER_DIR` against the installed Xcode 26.5, with Metro serving the bundle. This render-verifies the design system, navigation, and screens. Also wired live `expo-camera` into ScanScreen with a simulator fallback (`5dd65a9`). The physical-device build is blocked only on signing: a free Apple ID cannot provision the HealthKit/push entitlements, so on-device requires a paid Apple Developer Program enrollment. main at `5dd65a9`.

- **2026-06-01** - **On physical device + free-account signing (caveat #1 disproved).** Built, signed, and installed on the physical **iPhone 17 Pro Max** using a **free** personal Apple team. The `com.apple.developer.healthkit` entitlement signs fine on a free account (contrary to the prior "paid-only" assumption) on Xcode 26.5 / iOS 26.5. Trade-offs: the build expires after ~7 days; Push remains paid-only (entitlement stripped). Automatic signing + `DEVELOPMENT_TEAM` set in the pbxproj.

- **2026-06-01** - **Food scan is real (`cbb7df5`).** Photo → GPT-4o vision identifies food + portion → **USDA FoodData Central** supplies authoritative per-100g macros + micronutrients scaled to the portion (`backend/app/services/usda.py`, wired into `vision_router.py`). Each item tagged `usda:<fdcId>` or `model_estimate`. Match selection prefers canonical Foundation/SR Legacy entries over FNDDS prepared dishes (so "broccoli" → "Broccoli, raw" not "Fried broccoli"). Needs `USDA_API_KEY` in `backend/.env` (free key; DEMO_KEY throttles at 30/hr). Verified end-to-end: a live scan returned real USDA-backed macros.

- **2026-06-01** - **Apple HealthKit is real (`a267957`).** Replaced the HealthKit stubs with real `react-native-health` reads (active energy, steps, body weight, workouts incl. Apple Watch source detection); dashboard requests permission on load, shows live data ("Apple Health · 201 steps · 99.2 lb"), and "Connect Apple Watch" re-syncs. Restored the HealthKit entitlement + added the `react-native-health` config plugin. Verified reading real on-device data (steps/weight confirmed not mocks).

- **2026-06-01** - **Cycle / menstrual flow from Apple Health, incl. Clue (`266a977`).** Stock `react-native-health` (v1.19, latest) has no menstrual-flow API, so **patched the native module** (patch-package: `patches/react-native-health+1.19.0.patch` + a `postinstall` hook) to add `getMenstrualFlowSamples` + the `MenstrualFlow` read scope, modeled on its Sleep category reader. `cycle.ts` derives cycle day / phase / luteal bonus from the period data (matching `backend/app/services/cycle.py`), guards samples >45 days old as stale, and the dashboard shows "Cycle day N · phase" + drives the luteal calorie/protein badge. **Diagnosed the Clue gotcha:** Clue's Apple Health sync is non-retroactive (only writes period data logged after the integration is enabled). After re-logging in Clue, real data synced (May 31 heavy, Jun 1 light) and the app derived "Cycle day 2 · follicular," matching Clue's phase. Also fixed a local-vs-UTC date bug in the cycle math (`d1ae86c`). main at `d1ae86c`, pushed to origin.

- **2026-06-01** - **Micronutrients are real now.** The dashboard had been showing hardcoded `MOCK_MICROS` (iron 6 / calcium 320 / magnesium 110 / zinc 4) with bars filled even when nothing was logged. Replaced with a real sum over today's logged items (`ironMg`/`calciumMg`/`magnesiumMg`/`zincMg`, which USDA fills on each scan), so micros read 0 when nothing is tracked and accumulate as food is logged. Last of the dashboard mock-value leftovers removed; calories/macros were already real.

- **2026-06-01** - **Supplement tracker replaces the dashboard micronutrient strip.** Per Mehek's request, that dashboard slot now shows her real supplement protocol, sourced from the vault (`fitness/bloodwork/2026-05-29-results.md` + muscle-gain/marathon supplement docs): Iron (Eiron CR 60mg + vit C) in the morning on an empty stomach; Vitamin D3+K2, Omega-3, and creatine with the main meal; magnesium glycinate before bed. Built `src/data/supplements.ts` (schedule + doses + timing notes, incl. the iron <-> D3/calcium/coffee 2h-separation guidance), a one-tap daily `SupplementChecklist` grouped by time of day (state in Zustand, MMKV-persisted, auto-resets each calendar day), and **local notification reminders** via `expo-notifications` (`src/notifications/supplementReminders.ts`) — one daily repeating reminder per time slot, no push entitlement needed so it works on the free account. Verified on device: tap-to-mark updates the "N of 5 taken" count and persists; "Turn on daily reminders" granted + scheduled (`scheduled -> true`).

- **2026-06-01** - **Mock/hardcoded audit: real data only + supplement tweaks.** Per Mehek: removed the daily-reminders button from the supplement card (reminders stay scheduled; the dashboard re-syncs the OS schedule on mount via a `supplementRemindersOn` effect, which also clears the dropped magnesium reminder) and removed **Magnesium glycinate** from the schedule (now iron, D3+K2, omega-3, creatine). Then swept the whole app for fabricated data and fixed every source:
  - **ScanScreen** no longer falls back to `MOCK_SCAN_RESULT`; a failed/empty scan shows an alert and returns to the viewfinder, so fake food is never logged.
  - **ProgressScreen** hardcoded `MOCK_MEASUREMENTS` / `MOCK_BLOODWORK` / `MOCK_WEEKLY_WATER` removed; the screen now renders honest empty states until real entries exist.
  - **SupplementsScreen** (the "Me" tab) was a separate mock list — now reuses the shared `SupplementChecklist` + store state, so it stays in sync with the dashboard.
  - **Water goal** now derives from the user's onboarding-computed `targets.waterGoalOz` instead of a seeded 85.
  - **Store seeds** `MOCK_*` renamed `DEFAULT_*` (bootstrap-only; overwritten by onboarding + persisted state, never shown as real).
  - **PlanScreen** is an explicit "coming soon" placeholder (no fabricated data).
  Result: **zero `MOCK_` references remain in `src`**; tsc clean. Every displayed value traces to real input — onboarding, logged food (GPT-4o + USDA), HealthKit, cycle, and supplements.

- **2026-06-01** - **Real bloodwork deficiencies logged.** At Mehek's request, seeded the persisted `bloodwork` store with her actual 29 May 2026 panel (King's College Hospital Dubai): Vitamin D 29.2 ng/mL (insufficient; target 40-60; retest mid-July), Ferritin 32 ng/mL (Stage 1 iron depletion, ~26 with lab calibration, athlete target >40; retest early August), and RDW 11.6% (flagged low) — each with reference range, test/retest dates, and the protocol note (10,000 IU D3 / Eiron CR 60mg). The Progress -> Bloodwork tab reads from the store (was an empty state) and flags each LOW; `addBloodworkResult` / `removeBloodworkResult` let the panel grow as new labs come in. This is real, user-directed data (not mock), so the app now has her deficiencies to reference.

- **2026-06-01** - **Brand: app named "Nourish" + Bloom app icon.** Ideated logo directions (segmented Facet Ring / Bloom / Ring+N); Mehek chose the **Bloom** — five warm petals (fuel, movement, body·cycle, hydration, recovery) opening from one center, the multi-faceted-health story in the Nourish palette. Source SVG lives at `mobile/assets/logo/nourish-icon.svg`; rendered to a 1024 PNG via macOS Quick Look and swapped into `AppIcon.appiconset/App-Icon-1024x1024@1x.png` + `assets/icon.png`. Renamed the app to **Nourish** via `CFBundleDisplayName` (Info.plist) + `app.json` `name` — bundle id (`com.mehek.fitnesstracker`) and Xcode scheme/target left unchanged so free-account signing keeps working. Rebuilt + installed on device; the built app's `CFBundleDisplayName` confirms "Nourish". (iOS may cache the old home-screen icon briefly after reinstall.) Verified on device: the Bloom icon labeled "Nourish" shows in the App Library.

- **2026-06-01** - **Launch/splash restyled to Nourish.** Replaced the white launch screen with the Bloom centered on Nourish cream (`#FBF7F1`): set `ios/.../SplashScreen.imageset/image.png` to a rendered cream+Bloom PNG (source `mobile/assets/logo/nourish-splash.svg`) and the stretched 1x1 `SplashScreenBackground` pixel to cream; updated `app.json` splash.backgroundColor and `assets/splash.png`. The native launch storyboard (aspect-fit, edge-pinned) now flows seamlessly into the cream app UI. Rebuilt + installed on device. (Live splash not screenshot-verified — iPhone Mirroring re-locked mid-check — but the asset + build are confirmed; visible on any cold launch.)
