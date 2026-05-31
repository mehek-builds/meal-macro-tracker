"""
Marathon / training mode models (PRD Section 15).
"""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel


class TrainingMode(str, Enum):
    muscle_gain = "muscle_gain"
    marathon = "marathon"
    both = "both"


class Race(BaseModel):
    id: Optional[str] = None
    name: str                    # e.g. "Dubai Marathon"
    date: str                    # YYYY-MM-DD
    location: str = ""
    status: str = "registered"   # registered | conditional | ballot | completed
    notes: str = ""
    race_week_active: bool = False  # set True when today is within 7 days of race
