"""
Net calorie calculation — REAL implementation (PRD Section 9.7).

Ported verbatim from PRD Python snippet, with bmr_floor passed as an explicit
parameter rather than read from a global user object.
"""

from __future__ import annotations

from typing import Literal


def calculate_net_calories(
    food_calories: int,
    active_calories: int,
    base_target: int,
    mode: Literal["fixed", "eat_back", "net"],
    bmr_floor: int = 1500,
) -> dict:
    """
    Return a calorie accounting dict for the requested mode.

    Modes (PRD Section 9.7):
      fixed    - target stays static; exercise is shown but does not change budget.
      eat_back - active calories added back to budget.
      net      - compares food_calories - active_calories against bmr_floor.

    bmr_floor: user's BMR used as the minimum net in "net" mode. Defaults to 1500
    as a safe placeholder; callers should pass the actual computed BMR.
    """
    if mode == "fixed":
        remaining = base_target - food_calories
        return {
            "target": base_target,
            "eaten": food_calories,
            "burned": active_calories,
            "remaining": remaining,
            "display_burned": True,  # show but don't affect budget
        }

    elif mode == "eat_back":
        adjusted_target = base_target + active_calories
        remaining = adjusted_target - food_calories
        return {
            "target": adjusted_target,
            "eaten": food_calories,
            "burned": active_calories,
            "remaining": remaining,
        }

    elif mode == "net":
        net = food_calories - active_calories
        return {
            "net_calories": net,
            "bmr_floor": bmr_floor,
            "should_eat_more": net < bmr_floor,
            "eat_more_by": max(0, bmr_floor - net),
        }

    else:
        raise ValueError(f"Unknown mode {mode!r}. Valid: fixed, eat_back, net")
