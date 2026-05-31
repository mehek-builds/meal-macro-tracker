"""
Supplement tracker endpoints (PRD Section 12 / 16).

POST /supplements/log
GET  /supplements/today
PUT  /supplements/:id/retest
"""

from __future__ import annotations

from datetime import datetime, date as date_type, timezone

from fastapi import APIRouter, HTTPException

import app.store as store
from app.models.base import CamelModel
from app.models.supplement import Supplement, SupplementEntry, SupplementStatus
from app.services.supplements import PROTOCOL, check_conflicts

router = APIRouter(prefix="/supplements", tags=["supplements"])

COLLECTION = "supplement_log"
DEF_COLLECTION = "supplement_defs"


def _ensure_defaults() -> None:
    """Seed the supplement definitions from PROTOCOL if store is empty."""
    if not store.list_all(DEF_COLLECTION):
        for item in PROTOCOL:
            store.insert(DEF_COLLECTION, {
                "name": item["name"],
                "dose_display": item["dose"],
                "timing": item["timing"],
                "conflicts": item["conflicts"],
                "active": True,
            })


class LogSupplementRequest(CamelModel):
    supplement_id: str  # camel supplementId on wire
    taken_at: str = ""  # ISO; camel takenAt; defaults to now


class RetestRequest(CamelModel):
    retest_date: str  # YYYY-MM-DD; camel retestDate on wire
    notes: str = ""


class LogSupplementResponse(CamelModel):
    entry: SupplementEntry
    conflicts: list[str]
    next_safe_time: str | None = None  # camel nextSafeTime on wire


@router.post("/log", response_model=LogSupplementResponse, status_code=201)
def log_supplement(payload: LogSupplementRequest) -> LogSupplementResponse:
    """Log a supplement as taken; returns any timing conflicts."""
    _ensure_defaults()
    sup_def = store.get(DEF_COLLECTION, payload.supplement_id)
    if sup_def is None:
        raise HTTPException(status_code=404, detail="Supplement definition not found")

    taken_at = payload.taken_at or datetime.now(timezone.utc).isoformat()
    taken_dt = datetime.fromisoformat(taken_at)
    today_str = taken_dt.date().isoformat()

    # Fetch today's logs for conflict checking
    todays_logs = [
        {"supplement_name": r["supplement_name"], "taken_at": r["taken_at"]}
        for r in store.query(COLLECTION)
        if r.get("taken_at", "").startswith(today_str)
    ]

    conflicts, next_safe = check_conflicts(sup_def["name"], taken_dt, todays_logs)

    entry_data = {
        "supplement_id": payload.supplement_id,
        "supplement_name": sup_def["name"],
        "dose_display": sup_def["dose_display"],
        "taken_at": taken_at,
        "notes": None,
    }
    saved = store.insert(COLLECTION, entry_data)
    entry = SupplementEntry(**saved)

    return LogSupplementResponse(entry=entry, conflicts=conflicts, next_safe_time=next_safe)


@router.get("/today", response_model=list[SupplementStatus])
def get_today() -> list[SupplementStatus]:
    """Today's supplement status + next safe times."""
    _ensure_defaults()
    today_str = date_type.today().isoformat()
    todays_logs = [
        r for r in store.list_all(COLLECTION)
        if r.get("taken_at", "").startswith(today_str)
    ]
    taken_map: dict[str, str] = {
        r["supplement_id"]: r["taken_at"] for r in todays_logs
    }

    statuses: list[SupplementStatus] = []
    for sup in store.list_all(DEF_COLLECTION):
        sid = sup["id"]
        taken_at = taken_map.get(sid)
        taken_dt = datetime.fromisoformat(taken_at) if taken_at else None

        # Check next safe time for each un-taken supplement
        next_safe: str | None = None
        if not taken_at:
            _, next_safe = check_conflicts(
                sup["name"],
                datetime.now(timezone.utc),
                [{"supplement_name": r["supplement_name"], "taken_at": r["taken_at"]}
                 for r in todays_logs],
            )

        statuses.append(SupplementStatus(
            id=sid,
            name=sup["name"],
            dose=sup["dose_display"],
            taken_today=taken_at is not None,
            taken_at=taken_at,
            next_safe_time=next_safe,
        ))
    return statuses


@router.put("/{supplement_id}/retest", response_model=dict)
def update_retest(supplement_id: str, payload: RetestRequest) -> dict:
    """Update retest date and notes for a supplement definition."""
    _ensure_defaults()
    existing = store.get(DEF_COLLECTION, supplement_id)
    if existing is None:
        raise HTTPException(status_code=404, detail="Supplement not found")
    updated = store.update(
        DEF_COLLECTION,
        supplement_id,
        {"retest_date": payload.retest_date, "retest_notes": payload.notes},
    )
    return {"id": supplement_id, "retestDate": payload.retest_date, "notes": payload.notes}
