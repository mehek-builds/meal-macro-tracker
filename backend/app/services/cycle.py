"""
Menstrual cycle state computation — REAL implementation (PRD Section 11.3).

HealthKit reads are stubbed in app/routers/cycle.py.
This module contains only pure-Python logic, fully unit-tested.
"""

from __future__ import annotations

from datetime import date, timedelta


def compute_cycle_state(
    period_starts: list[date],
    today: date,
) -> dict:
    """
    Compute the current cycle state from a list of period start dates.

    period_starts: list of date objects marking the first day of each period,
                   sorted in any order (function sorts internally).
    today:         the date to evaluate against (makes unit-testing easy).

    Returns a dict matching CycleState (PRD Section 11.3):
      cycleDay              int     (1 = first day of period; 0 = unknown)
      phase                 str     follicular | luteal | unknown
      lastPeriodStart       str | None  ISO date or None
      estimatedCycleLength  int     (from last two starts, else 28)
      nearOvulation         bool    (within ±2 days of estimated ovulation)
      lutealCalorieBonus    int     200 if luteal else 0
      lutealProteinBonus    int     12  if luteal else 0
    """
    _unknown: dict = {
        "cycleDay": 0,
        "phase": "unknown",
        "lastPeriodStart": None,
        "estimatedCycleLength": 28,
        "nearOvulation": False,
        "lutealCalorieBonus": 0,
        "lutealProteinBonus": 0,
    }

    if not period_starts:
        return _unknown

    sorted_starts = sorted(period_starts)
    last_start = sorted_starts[-1]

    if last_start > today:
        return _unknown

    cycle_day = (today - last_start).days + 1  # 1-indexed

    # Estimate cycle length from last two starts if available
    if len(sorted_starts) >= 2:
        second_last = sorted_starts[-2]
        estimated_cycle_length = (last_start - second_last).days
    else:
        estimated_cycle_length = 28

    # Ovulation estimated at ~mid-cycle (PRD Section 11.3: cycleLength // 2)
    estimated_ovulation_day = estimated_cycle_length // 2

    # Near ovulation: within ±2 days of estimated ovulation (PRD Section 11.3)
    near_ovulation = (
        estimated_ovulation_day - 2
        <= cycle_day
        <= estimated_ovulation_day + 2
    )

    # Luteal phase: after ovulation until end of cycle
    is_luteal = cycle_day > estimated_ovulation_day
    phase = "luteal" if is_luteal else "follicular"

    return {
        "cycleDay": cycle_day,
        "phase": phase,
        "lastPeriodStart": last_start.isoformat(),
        "estimatedCycleLength": estimated_cycle_length,
        "nearOvulation": near_ovulation,
        "lutealCalorieBonus": 200 if is_luteal else 0,   # PRD Section 11.3 midpoint
        "lutealProteinBonus": 12 if is_luteal else 0,    # PRD Section 11.3 midpoint
    }
