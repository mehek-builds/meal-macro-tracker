"""
MET-based calorie estimation for manual workout logging — REAL (PRD Section 9.5).
"""

from __future__ import annotations

# MET values from PRD Section 9.5
MET_TABLE: dict[str, float] = {
    "walking": 3.5,
    "running": 9.8,
    "cycling": 7.5,
    "weight_training": 5.0,
    "hiit": 8.0,
    "swimming": 7.0,
    "yoga": 2.5,
}


def calories_from_met(met: float, weight_kg: float, minutes: int) -> int:
    """
    Calories burned = MET x weight_kg x duration_hours (PRD Section 9.5).

    Returns rounded integer.
    """
    return round(met * weight_kg * minutes / 60)


def calories_for_exercise_type(
    exercise_type: str,
    weight_kg: float,
    minutes: int,
) -> int:
    """
    Look up MET by exercise_type key (case-insensitive) and compute calories.

    Raises ValueError for unknown exercise_type.
    """
    key = exercise_type.lower().replace(" ", "_")
    met = MET_TABLE.get(key)
    if met is None:
        raise ValueError(
            f"Unknown exercise_type {exercise_type!r}. "
            f"Valid: {list(MET_TABLE)}"
        )
    return calories_from_met(met, weight_kg, minutes)
