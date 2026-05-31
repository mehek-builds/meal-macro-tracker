"""
Exercise / workout models (PRD Section 9).
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class WorkoutEntry(BaseModel):
    id: Optional[str] = None
    date: str  # YYYY-MM-DD
    type: str  # Running | Cycling | Weight Training | HIIT | Swimming | Yoga | Walking | Other
    duration_minutes: int
    calories_burned: Optional[int] = None  # None = calculated via MET if manual
    avg_heart_rate: Optional[int] = None
    source: str = "manual"  # manual | apple_watch | iphone
    notes: str = ""


class ExerciseSummary(BaseModel):
    date: str
    total_active_calories: int
    total_duration_minutes: int
    workouts: list[WorkoutEntry]
    # Net calorie calculation result (PRD Section 9.7)
    net_calorie_result: Optional[dict] = None
