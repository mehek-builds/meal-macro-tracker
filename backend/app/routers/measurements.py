"""
Body measurement endpoints (PRD Section 13 / 16).

POST /measurements/entry
GET  /measurements/history
"""

from __future__ import annotations

from fastapi import APIRouter

import app.store as store
from app.models.health import BodyMeasurement

router = APIRouter(prefix="/measurements", tags=["measurements"])

COLLECTION = "measurements"


@router.post("/entry", response_model=BodyMeasurement, status_code=201)
def create_entry(entry: BodyMeasurement) -> BodyMeasurement:
    """Log monthly body measurements."""
    saved = store.insert(COLLECTION, entry.model_dump())
    return BodyMeasurement(**saved)


@router.get("/history", response_model=list[BodyMeasurement])
def get_history() -> list[BodyMeasurement]:
    """All measurement entries sorted by date ascending."""
    records = sorted(store.list_all(COLLECTION), key=lambda r: r.get("date", ""))
    return [BodyMeasurement(**r) for r in records]
