"""
Water tracking models (PRD Section 10).
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, computed_field


class WaterEntry(BaseModel):
    id: Optional[str] = None
    date: str  # YYYY-MM-DD
    oz: float
    logged_at: str  # ISO timestamp

    @computed_field  # type: ignore[misc]
    @property
    def ml(self) -> float:
        return round(self.oz * 29.5735, 1)


class WaterSummary(BaseModel):
    date: str
    entries: list[WaterEntry]
    total_oz: float
    total_ml: float
    goal_oz: float
    remaining_oz: float
    percent_complete: float  # 0-100


class WaterGoal(BaseModel):
    rest_day_liters: float = 2.5
    training_day_liters: float = 3.0
    per_hour_training_bonus: float = 0.5
