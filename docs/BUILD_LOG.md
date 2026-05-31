# Fitness Tracker - Build Process & Decision Log

**Project:** Personal AI nutrition / exercise / hydration tracker (surplus-first; muscle-gain + 2027 marathon goals), scaffolded from a 1,748-line PRD.
**Repo:** https://github.com/mehek-builds/fitness-tracker
**Last updated:** 2026-05-31 (main @ `e875f55`)

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

Repo clean, local = remote. Backend: 252 tests passing; mobile `tsc --noEmit` clean (type-verified). All requested work and reviewed autonomous-session output committed.

## 6. Standing caveats (cannot close from the build environment)

1. **Not build/render-verified** - no Xcode or simulator available here. Real check: `cd mobile && npx expo run:ios` on a Mac.
2. **iOS-only** - `android/` was not generated (run `expo prebuild -p android` for parity).
3. **Stubs are stubs** - AI photo scan / RAG, HealthKit sync, and Supabase persistence are placeholders.
4. Design files cite PRD section numbers that do not exist in the 20-section PRD (cosmetic).

## 7. Next steps

- Build on a Mac to verify it runs (`npx expo run:ios`).
- Generate `android/` for platform parity.
- Wire real Supabase + AI providers, replacing the stubs.
- Implement deferred PRD features: voice input, recipe builder, marathon nutrition overlays, strength / GZCLP log, notifications.

## 8. Change log

- **2026-05-31** - Initial scaffold through iOS prebuild and the "Nourish" design system. Backend at 252 passing tests; main at `a120eec`. See the commit arc above for the full sequence.
- **2026-05-31** - Re-ran tester + reviewer. Tester confirmed mobile `tsc --noEmit` is clean (first compile-verification of the design-system + contract types). Reviewer found 0 criticals; 1 HIGH (the exercise net-calorie result leaked snake_case keys) fixed by modeling it as a `NetCalorieResult` CamelModel; plus LOW polish (CalorieRing morning-rule threshold, a `needs_recalc` wiring note, Settings now persists net-calorie-mode to the backend). Commit `c1e6bf6`.
- **2026-05-31** - Chased the autonomous design/native session to completion, committing each settled wave after a tsc / JSON / no-junk check: MMKV store persistence, expo-dev-client removed, onboarding redesign, ring autosize, and scan-to-log wiring. Then the agreed follow-ups: lowered the default calorie surplus to 300 so targets match the PRD table (`394c95e`), added the HealthKit entitlement + write usage string for App Store compliance (`454ebd2`), and brought this log current. Backend 252 green and mobile tsc clean throughout. main at `e875f55`.
