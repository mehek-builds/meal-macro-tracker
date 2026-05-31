"""
Calorie and macro calculators — REAL implementation (PRD Section 2).

All functions are pure Python; no external I/O.
"""

from __future__ import annotations

ACTIVITY_FACTORS: dict[str, float] = {
    "sedentary": 1.2,
    "lightly_active": 1.375,
    "moderately_active": 1.55,
    "very_active": 1.725,
    "athlete": 1.9,
}


def bmr(sex: str, weight_kg: float, height_cm: float, age: int) -> float:
    """
    Mifflin-St Jeor BMR (PRD Section 2).

    female: 10*w + 6.25*h - 5*age - 161
    male:   10*w + 6.25*h - 5*age + 5
    """
    base = 10 * weight_kg + 6.25 * height_cm - 5 * age
    if sex.lower() in ("female", "f"):
        return base - 161
    return base + 5  # male


def tdee(bmr_value: float, activity_key: str) -> float:
    """
    Total Daily Energy Expenditure = BMR x activity factor.

    Raises ValueError for unknown activity_key.
    """
    factor = ACTIVITY_FACTORS.get(activity_key)
    if factor is None:
        raise ValueError(
            f"Unknown activity_key {activity_key!r}. "
            f"Valid keys: {list(ACTIVITY_FACTORS)}"
        )
    return bmr_value * factor


def daily_calorie_target(
    tdee_value: float,
    goal: str,
    surplus: int = 300,
) -> int:
    """
    Daily calorie target by goal (PRD Section 2).

    goal values: "build_muscle" | "maintain" | "lose"
    surplus applies only to build_muscle (default 300 cal, the PRD lean-gain low
    end that lands the example targets in the PRD table; PRD range 300-500).
    """
    if goal == "build_muscle":
        return round(tdee_value + surplus)
    if goal == "maintain":
        return round(tdee_value)
    if goal == "lose":
        return round(tdee_value - 500)
    raise ValueError(f"Unknown goal {goal!r}. Valid: build_muscle, maintain, lose")


def macro_targets(weight_kg: float, calories: int) -> dict[str, int]:
    """
    Macro split from PRD Section 2 table.

    Protein: 2.9 g/kg  (matches the PRD table within each 3-kg band)
    Fat:     25% of calories  → fat_g = calories * 0.25 / 9
    Carbs:   remainder        → carbs_g = (calories - protein_cal - fat_cal) / 4
    """
    protein_g = round(2.9 * weight_kg)
    fat_g = round(calories * 0.25 / 9)
    carbs_g = round((calories - protein_g * 4 - fat_g * 9) / 4)
    return {"protein_g": protein_g, "fat_g": fat_g, "carbs_g": carbs_g}


def apply_luteal(targets: dict[str, int], is_luteal: bool) -> dict[str, int]:
    """
    Add luteal-phase bonuses to calorie + protein targets (PRD Section 2).

    +200 cal, +12 g protein when is_luteal is True.
    Returns a new dict; does not mutate the input.
    """
    out = dict(targets)
    if is_luteal:
        out["calories"] = out.get("calories", 0) + 200
        out["protein_g"] = out.get("protein_g", 0) + 12
    return out


def needs_recalc(
    last_recalc_weight_kg: float,
    current_7day_avg_kg: float,
    step: float = 3.0,
) -> bool:
    """
    Return True when the 7-day average weight has gained at least `step` kg
    SINCE the last recalculation (PRD Section 2, "Auto-Recalculation at Every 3 kg Gained").

    PRD intent is "3 kg gained since last recalc", measured continuously from the
    last recalc weight, not a fixed grid. A 1 kg gain that happens to cross a grid
    line must NOT fire, and a 2.9 kg gain must NOT fire, but a full 3.0 kg gain must.

    NOTE (not yet wired): this helper has no call site yet. To make the PRD's
    "recalc prompt every 3 kg gained" behavior live, add a last_recalc_weight_kg
    field to UserProfile and call this from the profile-update / weigh-in path.
    TODO(Section 2): wire this trigger.
    """
    return (current_7day_avg_kg - last_recalc_weight_kg) >= step
