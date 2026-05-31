# Fitness Tracker

A personal AI nutrition, exercise, and hydration tracker built around two parallel goals: gaining lean muscle mass and training for 6 marathons in 2027. The primary food input is a phone-camera photo: one photo, full nutritional breakdown, logged in seconds. Exercise flows in from Apple Watch via HealthKit; water is one tap.

This is a **surplus-first** app. The job is making sure enough calories and protein are eaten every day, not restricting them. The calorie ring is inverted from a weight-loss app: the center number is calories *still needed*, and red means *under*, not over.

The full product spec lives in [docs/PRD.md](docs/PRD.md). This repository is the project scaffold generated from that PRD.

## Repository layout

```
fitness-tracker/
├── backend/     FastAPI service (Python 3.11+)        PRD Sections 7, 8, 9, 16
├── mobile/      Expo + React Native app (TypeScript)  PRD Sections 4-15, 17
├── db/          Postgres + pgvector schema            PRD Section 16
├── docs/        The source PRD                         PRD (all)
├── watch/       watchOS companion design notes         PRD Sections 9.6, 9.9, 17
└── README.md
```

| Area | Maps to PRD |
|------|-------------|
| `backend/app/services/calories.py` | Section 2: BMR / TDEE / surplus target / macros / luteal adjustment / 3 kg recalculation |
| `backend/app/services/net_calories.py` | Section 9.7: fixed / eat-back / net calorie modes |
| `backend/app/services/water_goal.py` | Section 10.1: rest-day vs training-day hydration targets |
| `backend/app/services/met.py` | Section 9.5: MET-based manual workout estimate |
| `backend/app/services/supplements.py` | Section 12: supplement timing-conflict logic |
| `backend/app/services/cycle.py` | Section 11.3: cycle day, phase, luteal bonuses |
| `backend/app/services/vision_router.py` | Section 7.4: multi-model vision router (stub) |
| `backend/app/services/rag.py` | Section 7.6: USDA / IFCT RAG nutrition layer (stub) |
| `backend/app/routers/*` | Section 16: every API endpoint |
| `mobile/src/screens/*` | Sections 5, 6, 7, 12, 13, 14: dashboard, onboarding, scan, supplements, progress, settings |
| `mobile/src/health/*` | Section 9, 11: HealthKit sync and cycle reads (stubs) |
| `mobile/src/native/DepthCapture.ts` | Section 7.3: LiDAR / ARCore depth bridge (interface) |

## What works today vs. what is stubbed

This is a scaffold. The deterministic, no-dependency logic is implemented and unit-tested; everything that needs an external model, database, or native module is a clearly marked stub with a `TODO(Section X)` reference.

**Implemented for real (74 passing unit tests):**

- Calorie math: Mifflin-St Jeor BMR, TDEE, surplus target, macro split, luteal adjustment, 3 kg recalculation trigger
- Net-calorie modes (fixed / eat-back / net)
- Water-goal calculation (rest vs training day plus per-hour bonus)
- MET workout-calorie estimate
- Supplement timing-conflict detection (iron vs. D3 two-hour rule)
- Menstrual cycle day and phase calculation with luteal bonuses

**Stubbed (returns labeled placeholder data, no external calls):**

- AI photo scan, the GPT-4o / Claude vision router, and the USDA / IFCT RAG lookup
- Persistence: the backend uses an in-memory store; production uses Supabase (see `db/schema.sql`)
- HealthKit / Google Fit sync, LiDAR / ARCore depth capture, and the watchOS companion app

CRUD endpoints (log, water, supplements, measurements, bloodwork, exercise, races) round-trip through the in-memory store so the API is explorable end to end at `/docs`.

## Quickstart

### Backend

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -e ".[dev]"
.venv/bin/uvicorn app.main:app --reload    # http://localhost:8000/docs
.venv/bin/pytest -q                          # 74 passing tests
```

No environment variables are required to boot. Copy `backend/.env.example` to `backend/.env` and fill in keys only when wiring the real AI providers and Supabase.

### Mobile

```bash
cd mobile
npm install
npx expo start
```

Set `EXPO_PUBLIC_API_URL` (see `mobile/.env.example`) to point the app at the backend. LiDAR, HealthKit, and the watchOS companion require a bare native build (`npx expo run:ios` / `run:android`), not Expo Go.

## Tech stack

- **Backend:** FastAPI, Pydantic v2, Supabase (Postgres + pgvector) in production
- **Mobile:** Expo SDK 51, React Native 0.74, TypeScript, Zustand, TanStack Query
- **AI:** GPT-4o + Claude vision routing with a USDA / IFCT RAG layer over the model's portion estimates
- **Data:** USDA FoodData Central, Indian Food Composition Tables, Open Food Facts (all free)

## Build status note

The backend was installed and its test suite run in the environment that generated this scaffold (74 passing). The mobile app's manifests are valid JSON and internally consistent, but a full `npm install`, `tsc`, and native build were **not** run here. Treat the mobile side as compile-ready scaffold, not a verified build.

See [docs/PRD.md](docs/PRD.md) Section 19 for the four-phase implementation roadmap.
