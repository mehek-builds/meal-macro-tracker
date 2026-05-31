"""
Race calendar endpoints (PRD Section 15.4 / 16).

POST /races/entry
GET  /races
"""

from __future__ import annotations

from datetime import date, timedelta

from fastapi import APIRouter

import app.store as store
from app.models.training import Race

router = APIRouter(prefix="/races", tags=["races"])

COLLECTION = "races"
RACE_WEEK_DAYS = 7


@router.post("/entry", response_model=Race, status_code=201)
def create_race(race: Race) -> Race:
    """Add a race to the calendar."""
    saved = store.insert(COLLECTION, race.model_dump())
    return Race(**saved)


@router.get("", response_model=list[Race])
def get_races() -> list[Race]:
    """
    All races sorted by date ascending, with race_week_active flag set
    when today is within 7 days of the race date (PRD Section 15.3).
    """
    today = date.today()
    records = sorted(store.list_all(COLLECTION), key=lambda r: r.get("date", ""))
    races: list[Race] = []
    for r in records:
        race = Race(**r)
        try:
            race_date = date.fromisoformat(race.date)
            race.race_week_active = (
                timedelta(0) <= (race_date - today) <= timedelta(days=RACE_WEEK_DAYS)
            )
        except ValueError:
            pass
        races.append(race)
    return races
