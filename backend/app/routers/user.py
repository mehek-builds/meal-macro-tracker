"""
User profile endpoints (PRD Sections 2, 9.7, 16).

GET  /user/profile
PUT  /user/profile
PUT  /user/net-calorie-mode
GET  /user/stats
"""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, HTTPException

import app.store as store
from app.models.base import CamelModel
from app.models.user import NetCalorieMode, Targets, UserProfile, UserStats
from app.services.calories import (
    ACTIVITY_FACTORS,
    apply_luteal,
    bmr as calc_bmr,
    daily_calorie_target,
    macro_targets,
    tdee as calc_tdee,
)
from app.services.cycle import compute_cycle_state
from app.services.water_goal import DEFAULT_WATER_GOAL, get_today_water_goal_liters, liters_to_oz

router = APIRouter(prefix="/user", tags=["user"])

COLLECTION = "user"
SINGLETON_ID = "profile"


def _is_luteal(profile: dict) -> bool:
    """
    Determine whether the user is currently in the luteal phase.

    Uses the profile's last_period_start (seed value, PRD Section 6/11.5) fed
    through compute_cycle_state. If no period start is recorded, defaults to False.
    """
    last_period_start = profile.get("last_period_start")
    if not last_period_start:
        return False
    try:
        start = date.fromisoformat(last_period_start)
    except (TypeError, ValueError):
        return False
    state = compute_cycle_state([start], date.today())
    return state["phase"] == "luteal"


def _derive_targets(profile: dict) -> Targets:
    """
    Compute BMR, TDEE, macro targets, and the luteal-adjusted effective targets
    (PRD Sections 2, 11.4). The luteal adjustment (+200 cal / +12 g protein) is
    applied here via apply_luteal so it actually reaches the dashboard.
    """
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

    # Luteal adjustment (PRD Section 2 / 11.4): +200 cal, +12 g protein.
    is_luteal = _is_luteal(profile)
    effective = apply_luteal(
        {"calories": cal_target, "protein_g": macros["protein_g"]},
        is_luteal=is_luteal,
    )
    luteal_calorie_bonus = effective["calories"] - cal_target
    luteal_protein_bonus = effective["protein_g"] - macros["protein_g"]

    # Water goal: user override if set, else the rest-day base goal converted to oz.
    if profile.get("water_goal_oz"):
        water_goal_oz = float(profile["water_goal_oz"])
    else:
        rest_day_liters = get_today_water_goal_liters(0, DEFAULT_WATER_GOAL)
        water_goal_oz = liters_to_oz(rest_day_liters)

    return Targets(
        bmr=round(bmr_val, 1),
        tdee=round(tdee_val, 1),
        calories=cal_target,
        protein_g=macros["protein_g"],
        carbs_g=macros["carbs_g"],
        fat_g=macros["fat_g"],
        is_luteal=is_luteal,
        luteal_calorie_bonus=luteal_calorie_bonus,
        luteal_protein_bonus=luteal_protein_bonus,
        effective_calories=effective["calories"],
        effective_protein_g=effective["protein_g"],
        water_goal_oz=water_goal_oz,
    )


class ProfileResponse(CamelModel):
    profile: UserProfile
    targets: Targets


class NetCalorieModeRequest(CamelModel):
    mode: NetCalorieMode


class WaterGoalRequest(CamelModel):
    oz: float


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
    return {"netCalorieMode": payload.mode.value}


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
def set_water_goal(payload: WaterGoalRequest) -> dict:
    """
    Update the user's manual water goal override in oz (PRD Section 10, PUT /user/water-goal).
    Accepts a JSON body {"oz": <float>} (camel: same) rather than a query param.
    """
    existing = store.get(COLLECTION, SINGLETON_ID)
    if existing is None:
        raise HTTPException(status_code=404, detail="Profile not set up yet")
    store.update(COLLECTION, SINGLETON_ID, {"water_goal_oz": payload.oz})
    return {"waterGoalOz": payload.oz}
