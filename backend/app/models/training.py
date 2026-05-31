"""
Marathon / training mode models (PRD Section 15).
"""

from __future__ import annotations

from enum import Enum
from typing import Optional

from app.models.base import CamelModel


class TrainingMode(str, Enum):
    muscle_gain = "muscle_gain"
    marathon = "marathon"
    both = "both"


class RaceStatus(str, Enum):
    """Race registration status — superset covering PRD Section 15.4 states."""
    planned = "planned"
    conditional = "conditional"
    lottery_entered = "lottery_entered"
    ballot = "ballot"
    registered = "registered"
    completed = "completed"


class Race(CamelModel):
    id: Optional[str] = None
    name: str                    # e.g. "Dubai Marathon"
    date: str                    # YYYY-MM-DD
    location: str = ""
    status: RaceStatus = RaceStatus.planned
    notes: str = ""
    race_week_active: bool = False  # set True when today is within 7 days of race
