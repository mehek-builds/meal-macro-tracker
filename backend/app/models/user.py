"""
User profile models (PRD Sections 2, 9.7, 16).
"""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel


class NetCalorieMode(str, Enum):
    fixed = "fixed"
    eat_back = "eat_back"
    net = "net"


class UserProfile(BaseModel):
    id: Optional[str] = None
    sex: str = "female"  # female | male
    age: int = 20
    height_cm: float = 163.0
    weight_kg: float = 42.0
    goal: str = "build_muscle"  # build_muscle | maintain | lose
    activity_level: str = "lightly_active"
    net_calorie_mode: NetCalorieMode = NetCalorieMode.fixed
    # Macro surplus for build_muscle goal (PRD Section 2)
    calorie_surplus: int = 400
    water_goal_oz: Optional[float] = None  # user-override; None = auto from service
    dietary_restrictions: list[str] = []
    allergies: list[str] = []
    # Training phase (Section 15)
    training_phase: str = "phase_1"  # phase_1 | phase_2 | phase_3


class Targets(BaseModel):
    """Calculated daily targets derived from UserProfile."""
    bmr: float
    tdee: float
    calorie_target: int
    protein_g: int
    carbs_g: int
    fat_g: int
    is_luteal: bool = False
    luteal_calorie_bonus: int = 0
    luteal_protein_bonus: int = 0


class UserStats(BaseModel):
    """Weekly/monthly progress summary (GET /user/stats)."""
    period: str  # "week" | "month"
    avg_calories: float
    avg_protein_g: float
    avg_carbs_g: float
    avg_fat_g: float
    days_protein_hit: int
    days_calorie_hit: int
    note: str = "stub - aggregation not yet implemented"
