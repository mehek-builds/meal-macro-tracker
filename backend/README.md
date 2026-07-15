# Nourish Backend

FastAPI backend for a personal AI nutrition-tracking app (single user). Covers food photo
scanning, calorie/macro tracking, exercise logging, water tracking, supplements, body
measurements, bloodwork, cycle integration, and marathon training mode.

## Install

```bash
python -m venv .venv
.venv/bin/pip install -e ".[dev]"
```

## Run

```bash
.venv/bin/uvicorn app.main:app --reload
```

## Test

```bash
.venv/bin/pytest -q
```

## Data persistence

All CRUD endpoints currently use `app/store.py` (in-memory dict, dev only, not persistent
across restarts). Production wires `app/db.py` (Supabase) instead. See PRD Section 16.

## Router to PRD section map

| Router file       | PRD section |
|-------------------|-------------|
| scan.py           | 7 (AI photo scan pipeline) |
| log.py            | 4 / 16 (food log CRUD) |
| exercise.py       | 9 (Apple Watch / MET / net calories) |
| user.py           | 2 / 9.7 (profile, targets, net-cal mode) |
| water.py          | 10 (water tracking) |
| supplements.py    | 12 (supplement tracker) |
| measurements.py   | 13 (body measurements) |
| bloodwork.py      | 14 (bloodwork log) |
| cycle.py          | 11 (menstrual cycle integration) |
| training.py       | 15 (marathon mode) |
| races.py          | 15.4 (race calendar) |
| foods.py          | 8 / 4.5 (food search + custom foods) |
