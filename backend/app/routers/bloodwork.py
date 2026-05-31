"""
Bloodwork log endpoints (PRD Section 14 / 16).

POST /bloodwork/entry
GET  /bloodwork/history
GET  /bloodwork/retests/upcoming
"""

from __future__ import annotations

from datetime import date, timedelta

from fastapi import APIRouter

import app.store as store
from app.models.health import BloodworkResult

router = APIRouter(prefix="/bloodwork", tags=["bloodwork"])

COLLECTION = "bloodwork"


@router.post("/entry", response_model=BloodworkResult, status_code=201)
def create_entry(entry: BloodworkResult) -> BloodworkResult:
    """Log a bloodwork result."""
    saved = store.insert(COLLECTION, entry.model_dump())
    return BloodworkResult(**saved)


@router.get("/history", response_model=list[BloodworkResult])
def get_history(marker: str | None = None) -> list[BloodworkResult]:
    """
    All bloodwork results, optionally filtered by marker_name.
    Sorted by date ascending.
    """
    if marker:
        records = store.query(COLLECTION, marker_name=marker)
    else:
        records = store.list_all(COLLECTION)
    sorted_records = sorted(records, key=lambda r: r.get("date", ""))
    return [BloodworkResult(**r) for r in sorted_records]


@router.get("/retests/upcoming", response_model=list[BloodworkResult])
def get_upcoming_retests() -> list[BloodworkResult]:
    """Return markers with retest_date within the next 30 days."""
    today = date.today()
    cutoff = today + timedelta(days=30)
    results = []
    for r in store.list_all(COLLECTION):
        rd = r.get("retest_date")
        if rd:
            try:
                retest = date.fromisoformat(rd)
                if today <= retest <= cutoff:
                    results.append(BloodworkResult(**r))
            except ValueError:
                pass
    results.sort(key=lambda x: x.retest_date or "")
    return results
