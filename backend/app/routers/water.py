"""
Water tracking endpoints (PRD Section 10 / 16).

POST   /water/entry
GET    /water/day/:date
DELETE /water/entry/:id
PUT    /user/water-goal  (handled in user router)
"""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

import app.store as store
from app.models.base import CamelModel
from app.models.water import WaterEntry, WaterSummary
from app.services.water_goal import DEFAULT_WATER_GOAL, get_today_water_goal_liters, liters_to_oz

router = APIRouter(prefix="/water", tags=["water"])

COLLECTION = "water"
USER_COLLECTION = "user"
EXERCISE_COLLECTION = "exercise"
SINGLETON_ID = "profile"


class WaterEntryRequest(CamelModel):
    oz: float
    date: str  # YYYY-MM-DD (required)
    logged_at: str = ""  # ISO; camel loggedAt on wire; defaults to now


@router.post("/entry", response_model=WaterEntry, status_code=201)
def log_water(payload: WaterEntryRequest) -> WaterEntry:
    """Log a water entry."""
    logged_at = payload.logged_at or datetime.now(timezone.utc).isoformat()
    data = {
        "date": payload.date,
        "oz": payload.oz,
        "logged_at": logged_at,
    }
    saved = store.insert(COLLECTION, data)
    return WaterEntry(**saved)


@router.get("/day/{date}", response_model=WaterSummary)
def get_day(date: str) -> WaterSummary:
    """Get all water entries + summary for a date."""
    records = store.query(COLLECTION, date=date)
    entries = [WaterEntry(**r) for r in records]
    total_oz = sum(e.oz for e in entries)

    # Determine goal: prefer user override, else compute from workout duration
    user = store.get(USER_COLLECTION, SINGLETON_ID)
    goal_oz: float
    if user and user.get("water_goal_oz"):
        goal_oz = float(user["water_goal_oz"])
    else:
        exercise_records = store.query(EXERCISE_COLLECTION, date=date)
        duration = sum(r.get("duration_minutes", 0) for r in exercise_records)
        goal_liters = get_today_water_goal_liters(duration, DEFAULT_WATER_GOAL)
        goal_oz = liters_to_oz(goal_liters)

    remaining = max(0.0, goal_oz - total_oz)
    percent = round(min(100.0, (total_oz / goal_oz * 100)) if goal_oz > 0 else 0.0, 1)

    return WaterSummary(
        date=date,
        entries=entries,
        total_oz=round(total_oz, 1),
        total_ml=round(total_oz * 29.5735, 1),
        goal_oz=round(goal_oz, 1),
        remaining_oz=round(remaining, 1),
        percent_complete=percent,
    )


@router.delete("/entry/{entry_id}", status_code=204)
def delete_entry(entry_id: str) -> None:
    """Delete a water entry."""
    if not store.delete(COLLECTION, entry_id):
        raise HTTPException(status_code=404, detail="Water entry not found")
