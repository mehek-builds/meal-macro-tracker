"""
User profile models (PRD Sections 2, 9.7, 16).
"""

from __future__ import annotations

from enum import Enum
from typing import Optional

from app.models.base import CamelModel


class NetCalorieMode(str, Enum):
    fixed = "fixed"
    eat_back = "eat_back"
    net = "net"


class UserProfile(CamelModel):
    id: Optional[str] = None
    sex: str = "female"  # female | male
    age: int = 20
    height_cm: float = 163.0
    weight_kg: float = 42.0
    goal: str = "build_muscle"  # build_muscle | maintain | lose
    # Goal weights (PRD Section 6 onboarding screen 4): long-term target +
    # near-term milestone. Seeded with the PRD's 57 kg target / 45 kg milestone.
    target_weight_kg: Optional[float] = 57.0
    milestone_weight_kg: Optional[float] = 45.0
    activity_level: str = "lightly_active"
    net_calorie_mode: NetCalorieMode = NetCalorieMode.fixed
    # Macro surplus for build_muscle goal (PRD Section 2)
    calorie_surplus: int = 400
    water_goal_oz: Optional[float] = None  # user-override; None = auto from service
    dietary_restrictions: list[str] = []
    allergies: list[str] = []
    # Training phase (Section 15)
    training_phase: str = "phase_1"  # phase_1 | phase_2 | phase_3
    # Cycle tracking seed: first day of last period (PRD Section 6/11.5).
    # YYYY-MM-DD; drives luteal-phase target adjustment when present.
    last_period_start: Optional[str] = None


class Targets(CamelModel):
    """Calculated daily targets derived from UserProfile (PRD Sections 2, 11.4)."""
    bmr: float
    tdee: float
    calories: int  # base calorie target before luteal adjustment
    protein_g: int  # base protein target before luteal adjustment
    carbs_g: int
    fat_g: int
    is_luteal: bool = False
    luteal_calorie_bonus: int = 0
    luteal_protein_bonus: int = 0
    # Effective targets after luteal adjustment is applied (what the dashboard shows).
    effective_calories: int = 0
    effective_protein_g: int = 0
    water_goal_oz: float = 0.0


class UserStats(CamelModel):
    """Weekly/monthly progress summary (GET /user/stats)."""
    period: str  # "week" | "month"
    avg_calories: float
    avg_protein_g: float
    avg_carbs_g: float
    avg_fat_g: float
    days_protein_hit: int
    days_calorie_hit: int
    note: str = "stub - aggregation not yet implemented"
