"""
Exercise / workout models (PRD Section 9).
"""

from __future__ import annotations

from typing import Optional

from app.models.base import CamelModel


class WorkoutEntry(CamelModel):
    id: Optional[str] = None
    date: str  # YYYY-MM-DD
    type: str  # Running | Cycling | Weight Training | HIIT | Swimming | Yoga | Walking | Other
    duration_minutes: int
    calories_burned: Optional[int] = None  # None = calculated via MET if manual
    avg_heart_rate: Optional[int] = None
    source: str = "manual"  # manual | apple_watch | iphone
    notes: str = ""


class NetCalorieResult(CamelModel):
    """Net-calorie accounting (PRD Section 9.7). Fields are mode-dependent:
    fixed/eat_back populate target/eaten/burned/remaining (plus display_burned in
    fixed); net populates net_calories/bmr_floor/should_eat_more/eat_more_by.
    Modeled (not a raw dict) so it serializes camelCase like the rest of the wire."""
    target: Optional[int] = None
    eaten: Optional[int] = None
    burned: Optional[int] = None
    remaining: Optional[int] = None
    display_burned: Optional[bool] = None
    net_calories: Optional[int] = None
    bmr_floor: Optional[int] = None
    should_eat_more: Optional[bool] = None
    eat_more_by: Optional[int] = None


class ExerciseSummary(CamelModel):
    date: str
    total_active_calories: int
    total_duration_minutes: int
    workouts: list[WorkoutEntry]
    # Net-calorie result (PRD Section 9.7), modeled so it serializes camelCase.
    net_calorie_result: Optional[NetCalorieResult] = None
