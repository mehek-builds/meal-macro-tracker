"""
Menstrual cycle endpoints (PRD Section 11 / 16).

GET  /cycle/state   - current cycle state (HealthKit read stubbed)
POST /cycle/manual  - manually set cycle start dates
"""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter
from pydantic import BaseModel

import app.store as store
from app.models.health import CycleState
from app.services.cycle import compute_cycle_state

router = APIRouter(prefix="/cycle", tags=["cycle"])

COLLECTION = "cycle_starts"


class ManualCycleRequest(BaseModel):
    period_starts: list[str]  # list of YYYY-MM-DD strings


def _load_period_starts() -> list[date]:
    """Load stored period start dates from store."""
    records = store.list_all(COLLECTION)
    starts: list[date] = []
    for r in records:
        try:
            starts.append(date.fromisoformat(r["period_start"]))
        except (ValueError, KeyError):
            pass
    return starts


@router.get("/state", response_model=CycleState)
def get_cycle_state() -> CycleState:
    """
    Return current cycle state computed from stored period start dates.
    TODO(Section 11.2): read MenstrualFlow samples from HealthKit and merge with
    manually entered dates. HealthKit bridge is client-side (react-native-health).
    """
    period_starts = _load_period_starts()
    state_dict = compute_cycle_state(period_starts, date.today())
    return CycleState(
        cycle_day=state_dict["cycleDay"],
        phase=state_dict["phase"],
        last_period_start=state_dict["lastPeriodStart"],
        estimated_cycle_length=state_dict["estimatedCycleLength"],
        near_ovulation=state_dict["nearOvulation"],
        luteal_calorie_bonus=state_dict["lutealCalorieBonus"],
        luteal_protein_bonus=state_dict["lutealProteinBonus"],
    )


@router.post("/manual", response_model=CycleState)
def set_manual_cycle(payload: ManualCycleRequest) -> CycleState:
    """
    Manually record period start dates (used when no HealthKit data is available).
    Replaces any previously stored manual entries.
    """
    # Clear previous manual entries
    for r in store.list_all(COLLECTION):
        store.delete(COLLECTION, r["id"])

    for ds in payload.period_starts:
        store.insert(COLLECTION, {"period_start": ds})

    period_starts = [date.fromisoformat(ds) for ds in payload.period_starts]
    state_dict = compute_cycle_state(period_starts, date.today())
    return CycleState(
        cycle_day=state_dict["cycleDay"],
        phase=state_dict["phase"],
        last_period_start=state_dict["lastPeriodStart"],
        estimated_cycle_length=state_dict["estimatedCycleLength"],
        near_ovulation=state_dict["nearOvulation"],
        luteal_calorie_bonus=state_dict["lutealCalorieBonus"],
        luteal_protein_bonus=state_dict["lutealProteinBonus"],
    )
