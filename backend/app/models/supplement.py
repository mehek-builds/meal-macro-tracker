"""
Supplement tracker models (PRD Section 12).
"""

from __future__ import annotations

from typing import Optional

from app.models.base import CamelModel


class Supplement(CamelModel):
    id: Optional[str] = None
    name: str
    dose_display: str  # e.g. "10,000 IU", "60mg"
    timing: str        # e.g. "With fattiest meal"
    conflicts: list[str] = []  # names of conflicting supplements
    retest_date: Optional[str] = None  # YYYY-MM-DD
    retest_notes: str = ""
    active: bool = True


class SupplementEntry(CamelModel):
    id: Optional[str] = None
    supplement_id: str
    supplement_name: str
    dose_display: str
    taken_at: str  # ISO timestamp
    notes: Optional[str] = None


class SupplementStatus(CamelModel):
    id: str
    name: str
    dose: str
    taken_today: bool
    taken_at: Optional[str] = None
    next_safe_time: Optional[str] = None  # ISO if there is a conflict window
