"""
Food log CRUD — POST/GET/PUT/DELETE /log/* (PRD Section 16).
Round-trips through app/store.py (in-memory, dev only).
"""

from __future__ import annotations

from datetime import date as date_type

from fastapi import APIRouter, HTTPException

import app.store as store
from app.models.nutrition import FoodLogEntry

router = APIRouter(prefix="/log", tags=["log"])

COLLECTION = "food_log"


@router.post("/entry", response_model=FoodLogEntry, status_code=201)
def create_entry(entry: FoodLogEntry) -> FoodLogEntry:
    """
    Save a food log entry (PRD Section 16: POST /log/entry).
    Accepts {date, meal, source, item} where item is a nested NutritionItem.
    """
    saved = store.insert(COLLECTION, entry.model_dump(mode="json"))
    return FoodLogEntry(**saved)


@router.get("/day/{date}", response_model=list[FoodLogEntry])
def get_day(date: str) -> list[FoodLogEntry]:
    """Get all food log entries for a given date (YYYY-MM-DD)."""
    records = store.query(COLLECTION, date=date)
    return [FoodLogEntry(**r) for r in records]


@router.put("/entry/{entry_id}", response_model=FoodLogEntry)
def update_entry(entry_id: str, entry: FoodLogEntry) -> FoodLogEntry:
    """Edit a food log entry (full replacement of {date, meal, source, item})."""
    updated = store.update(COLLECTION, entry_id, entry.model_dump(mode="json"))
    if updated is None:
        raise HTTPException(status_code=404, detail="Entry not found")
    return FoodLogEntry(**updated)


@router.delete("/entry/{entry_id}", status_code=204)
def delete_entry(entry_id: str) -> None:
    """Delete a food log entry."""
    if not store.delete(COLLECTION, entry_id):
        raise HTTPException(status_code=404, detail="Entry not found")
