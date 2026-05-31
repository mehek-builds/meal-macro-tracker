"""
Water goal calculator — REAL implementation (PRD Section 10.1).
"""

from __future__ import annotations

from app.models.water import WaterGoal

# Canonical defaults (PRD Section 10.1)
DEFAULT_WATER_GOAL = WaterGoal(
    rest_day_liters=2.5,
    training_day_liters=3.0,
    per_hour_training_bonus=0.5,
)

LITERS_TO_OZ: float = 33.814


def get_today_water_goal_liters(
    workout_duration_minutes: int,
    goal: WaterGoal = DEFAULT_WATER_GOAL,
) -> float:
    """
    Return the daily water target in liters, rounded to 1 decimal.

    PRD Section 10.1:
      - Rest day base: 2.5 L
      - Training day base: 3.0 L
      - Per-hour training bonus: +0.5 L
    """
    is_training_day = workout_duration_minutes > 0
    base = goal.training_day_liters if is_training_day else goal.rest_day_liters
    bonus = (workout_duration_minutes / 60) * goal.per_hour_training_bonus
    return round((base + bonus) * 10) / 10


def liters_to_oz(liters: float) -> float:
    """Convert liters to fluid ounces, rounded to 1 decimal."""
    return round(liters * LITERS_TO_OZ, 1)
