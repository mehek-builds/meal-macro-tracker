"""
Exercise endpoints (PRD Section 9 / 16).

POST /exercise/entry  - save a workout (manual or HealthKit-sourced)
GET  /exercise/day/:date  - workouts for a date
DELETE /exercise/entry/:id
GET  /exercise/summary/:date  - active calories + net calorie calculation
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

import app.store as store
from app.models.exercise import ExerciseSummary, NetCalorieResult, WorkoutEntry
from app.routers.user import _derive_targets
from app.services.met import MET_TABLE, calories_from_met
from app.services.net_calories import calculate_net_calories

router = APIRouter(prefix="/exercise", tags=["exercise"])

COLLECTION = "exercise"
USER_COLLECTION = "user"
LOG_COLLECTION = "food_log"


@router.post("/entry", response_model=WorkoutEntry, status_code=201)
def create_entry(entry: WorkoutEntry) -> WorkoutEntry:
    """
    Save a workout entry.
    If calories_burned is None and the exercise type is in the MET table,
    auto-estimates calories using the user's stored weight.
    TODO(Section 9.1): HealthKit-sourced workouts arrive via /exercise/sync (not yet wired).
    """
    data = entry.model_dump()

    if data.get("calories_burned") is None:
        exercise_type = (data.get("type") or "").lower().replace(" ", "_")
        met = MET_TABLE.get(exercise_type)
        if met:
            # Try to pull user weight from store for MET calc
            users = store.list_all(USER_COLLECTION)
            weight_kg = users[0].get("weight_kg", 60.0) if users else 60.0
            data["calories_burned"] = calories_from_met(
                met, weight_kg, data.get("duration_minutes", 0)
            )

    saved = store.insert(COLLECTION, data)
    return WorkoutEntry(**saved)


@router.get("/day/{date}", response_model=list[WorkoutEntry])
def get_day(date: str) -> list[WorkoutEntry]:
    """Get all workouts for a date."""
    records = store.query(COLLECTION, date=date)
    return [WorkoutEntry(**r) for r in records]


@router.delete("/entry/{entry_id}", status_code=204)
def delete_entry(entry_id: str) -> None:
    """Delete a workout entry."""
    if not store.delete(COLLECTION, entry_id):
        raise HTTPException(status_code=404, detail="Entry not found")


@router.get("/summary/{date}", response_model=ExerciseSummary)
def get_summary(date: str) -> ExerciseSummary:
    """
    Active calories burned + net calorie calculation for a date.
    Reads food log totals and user profile to run net_calories service.
    """
    workouts = [WorkoutEntry(**r) for r in store.query(COLLECTION, date=date)]
    total_active = sum(w.calories_burned or 0 for w in workouts)
    total_duration = sum(w.duration_minutes for w in workouts)

    # Gather food calories for the day
    food_entries = store.query(LOG_COLLECTION, date=date)
    food_calories = sum(e.get("calories", 0) for e in food_entries)

    # The stored profile has no calorie_target/bmr fields (those are derived onto the
    # Targets model, not persisted), so reuse the dashboard's _derive_targets to get the
    # real luteal-adjusted target and BMR. Keeps the exercise budget in sync with /user/profile.
    users = store.list_all(USER_COLLECTION)
    if users:
        user = users[0]
        targets = _derive_targets(user)
        base_target = targets.effective_calories
        mode = user.get("net_calorie_mode", "fixed")
        bmr_floor = int(round(targets.bmr))
    else:
        base_target = 2000
        mode = "fixed"
        bmr_floor = 1500

    net_result = NetCalorieResult(
        **calculate_net_calories(
            food_calories=int(food_calories),
            active_calories=total_active,
            base_target=base_target,
            mode=mode,  # type: ignore[arg-type]
            bmr_floor=bmr_floor,
        )
    )

    return ExerciseSummary(
        date=date,
        total_active_calories=total_active,
        total_duration_minutes=total_duration,
        workouts=workouts,
        net_calorie_result=net_result,
    )
