"""
Body measurement, bloodwork, and cycle state models (PRD Sections 11, 13, 14).
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class BodyMeasurement(BaseModel):
    id: Optional[str] = None
    date: str  # YYYY-MM-DD
    upper_arm_cm: Optional[float] = None
    chest_cm: Optional[float] = None
    waist_cm: Optional[float] = None
    hips_cm: Optional[float] = None
    thigh_cm: Optional[float] = None
    notes: Optional[str] = None


class BloodworkResult(BaseModel):
    id: Optional[str] = None
    date: str  # YYYY-MM-DD
    marker_name: str       # e.g. "Vitamin D (25-OH)", "Ferritin"
    value: float
    unit: str              # e.g. "ng/mL", "g/dL", "%"
    ref_range_low: Optional[float] = None
    ref_range_high: Optional[float] = None
    status: str = "pending"  # normal | low | high | pending
    retest_date: Optional[str] = None  # YYYY-MM-DD
    notes: Optional[str] = None


class CycleState(BaseModel):
    cycle_day: int
    phase: str  # follicular | luteal | unknown
    last_period_start: Optional[str] = None  # ISO date string
    estimated_cycle_length: int = 28
    near_ovulation: bool = False
    luteal_calorie_bonus: int = 0
    luteal_protein_bonus: int = 0
