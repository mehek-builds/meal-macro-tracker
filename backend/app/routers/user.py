"""
User profile endpoints (PRD Sections 2, 9.7, 16).

GET  /user/profile
PUT  /user/profile
PUT  /user/net-calorie-mode
GET  /user/stats
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

import app.store as store
from app.models.user import NetCalorieMode, Targets, UserProfile, UserStats
from app.services.calories import (
    ACTIVITY_FACTORS,
    bmr as calc_bmr,
    daily_calorie_target,
    macro_targets,
    tdee as calc_tdee,
)

router = APIRouter(prefix="/user", tags=["user"])

COLLECTION = "user"
SINGLETON_ID = "profile"


def _derive_targets(profile: dict) -> Targets:
    """Compute BMR, TDEE, and macro targets from stored profile dict."""
    bmr_val = calc_bmr(
        sex=profile["sex"],
        weight_kg=profile["weight_kg"],
        height_cm=profile["height_cm"],
        age=profile["age"],
    )
    tdee_val = calc_tdee(bmr_val, profile["activity_level"])
    cal_target = daily_calorie_target(
        tdee_val, profile["goal"], surplus=profile.get("calorie_surplus", 400)
    )
    macros = macro_targets(profile["weight_kg"], cal_target)
    return Targets(
        bmr=round(bmr_val, 1),
        tdee=round(tdee_val, 1),
        calorie_target=cal_target,
        protein_g=macros["protein_g"],
        carbs_g=macros["carbs_g"],
        fat_g=macros["fat_g"],
    )


class ProfileResponse(BaseModel):
    profile: UserProfile
    targets: Targets


class NetCalorieModeRequest(BaseModel):
    mode: NetCalorieMode


@router.get("/profile", response_model=ProfileResponse)
def get_profile() -> ProfileResponse:
    """Return user profile + calculated targets."""
    record = store.get(COLLECTION, SINGLETON_ID)
    if record is None:
        # Return sensible defaults on first use
        default = UserProfile()
        record = store.insert(COLLECTION, {**default.model_dump(), "id": SINGLETON_ID})
    profile = UserProfile(**record)
    targets = _derive_targets(record)
    return ProfileResponse(profile=profile, targets=targets)


@router.put("/profile", response_model=ProfileResponse)
def update_profile(profile: UserProfile) -> ProfileResponse:
    """Update user profile and recalculate targets."""
    data = profile.model_dump()
    data["id"] = SINGLETON_ID
    existing = store.get(COLLECTION, SINGLETON_ID)
    if existing is None:
        record = store.insert(COLLECTION, data)
    else:
        record = store.update(COLLECTION, SINGLETON_ID, data)
    targets = _derive_targets(record)  # type: ignore[arg-type]
    return ProfileResponse(profile=UserProfile(**record), targets=targets)


@router.put("/net-calorie-mode", response_model=dict)
def set_net_calorie_mode(payload: NetCalorieModeRequest) -> dict:
    """Switch the net calorie mode (fixed / eat_back / net)."""
    existing = store.get(COLLECTION, SINGLETON_ID)
    if existing is None:
        raise HTTPException(status_code=404, detail="Profile not set up yet")
    store.update(COLLECTION, SINGLETON_ID, {"net_calorie_mode": payload.mode.value})
    return {"net_calorie_mode": payload.mode.value}


@router.get("/stats", response_model=UserStats)
def get_stats() -> UserStats:
    """
    Weekly/monthly progress summary.
    TODO(Section 16): aggregate food_log + exercise store entries properly.
    """
    return UserStats(
        period="week",
        avg_calories=0.0,
        avg_protein_g=0.0,
        avg_carbs_g=0.0,
        avg_fat_g=0.0,
        days_protein_hit=0,
        days_calorie_hit=0,
        note="stub - aggregation not yet implemented (Section 16 TODO)",
    )


@router.put("/water-goal", response_model=dict)
def set_water_goal(oz: float) -> dict:
    """
    Update the user's manual water goal override in oz (PRD Section 10, PUT /user/water-goal).
    """
    existing = store.get(COLLECTION, SINGLETON_ID)
    if existing is None:
        raise HTTPException(status_code=404, detail="Profile not set up yet")
    store.update(COLLECTION, SINGLETON_ID, {"water_goal_oz": oz})
    return {"water_goal_oz": oz}
