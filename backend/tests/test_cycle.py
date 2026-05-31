"""
Unit tests for app/services/cycle.py (PRD Section 11.3).
"""

import pytest
from datetime import date

from app.services.cycle import compute_cycle_state


class TestUnknownState:
    def test_empty_period_starts(self):
        state = compute_cycle_state([], date(2026, 5, 31))
        assert state["phase"] == "unknown"
        assert state["cycleDay"] == 0
        assert state["lastPeriodStart"] is None

    def test_future_period_start(self):
        future = date(2026, 6, 10)
        state = compute_cycle_state([future], date(2026, 5, 31))
        assert state["phase"] == "unknown"


class TestCycleDay:
    def test_day_one_is_period_start(self):
        today = date(2026, 5, 1)
        state = compute_cycle_state([today], today)
        assert state["cycleDay"] == 1

    def test_day_14(self):
        start = date(2026, 5, 1)
        today = date(2026, 5, 14)
        state = compute_cycle_state([start], today)
        assert state["cycleDay"] == 14


class TestEstimatedCycleLength:
    def test_default_28_with_one_start(self):
        state = compute_cycle_state([date(2026, 5, 1)], date(2026, 5, 10))
        assert state["estimatedCycleLength"] == 28

    def test_computed_from_two_starts(self):
        # 28-day cycle: May 1 -> May 29
        starts = [date(2026, 5, 1), date(2026, 5, 29)]
        state = compute_cycle_state(starts, date(2026, 5, 31))
        assert state["estimatedCycleLength"] == 28

    def test_irregular_cycle(self):
        # 32-day cycle
        starts = [date(2026, 4, 1), date(2026, 5, 3)]
        state = compute_cycle_state(starts, date(2026, 5, 10))
        assert state["estimatedCycleLength"] == 32


class TestPhase:
    def test_follicular_before_ovulation(self):
        # 28-day cycle; ovulation at day 14; testing day 7
        start = date(2026, 5, 1)
        today = date(2026, 5, 7)  # day 7
        state = compute_cycle_state([start], today)
        assert state["phase"] == "follicular"

    def test_luteal_after_ovulation(self):
        # day 15 is after ovulation (day 14)
        start = date(2026, 5, 1)
        today = date(2026, 5, 15)  # day 15
        state = compute_cycle_state([start], today)
        assert state["phase"] == "luteal"

    def test_luteal_bonuses_applied(self):
        start = date(2026, 5, 1)
        today = date(2026, 5, 20)  # clearly luteal
        state = compute_cycle_state([start], today)
        assert state["lutealCalorieBonus"] == 200
        assert state["lutealProteinBonus"] == 12

    def test_follicular_bonuses_zero(self):
        start = date(2026, 5, 1)
        today = date(2026, 5, 7)
        state = compute_cycle_state([start], today)
        assert state["lutealCalorieBonus"] == 0
        assert state["lutealProteinBonus"] == 0


class TestNearOvulation:
    def test_near_ovulation_at_day_14(self):
        # ovulation_day = 28//2 = 14; near if cycleDay in [12, 16]
        start = date(2026, 5, 1)
        today = date(2026, 5, 14)  # day 14 = ovulation
        state = compute_cycle_state([start], today)
        assert state["nearOvulation"] is True

    def test_near_ovulation_two_days_before(self):
        start = date(2026, 5, 1)
        today = date(2026, 5, 12)  # day 12
        state = compute_cycle_state([start], today)
        assert state["nearOvulation"] is True

    def test_near_ovulation_two_days_after(self):
        start = date(2026, 5, 1)
        today = date(2026, 5, 16)  # day 16
        state = compute_cycle_state([start], today)
        assert state["nearOvulation"] is True

    def test_not_near_ovulation_early_follicular(self):
        start = date(2026, 5, 1)
        today = date(2026, 5, 5)  # day 5, far from ovulation
        state = compute_cycle_state([start], today)
        assert state["nearOvulation"] is False

    def test_last_period_start_correct(self):
        starts = [date(2026, 4, 3), date(2026, 5, 1)]
        state = compute_cycle_state(starts, date(2026, 5, 10))
        assert state["lastPeriodStart"] == "2026-05-01"

    def test_unsorted_input_handled(self):
        # Provide starts in reverse order; function should sort them
        starts = [date(2026, 5, 1), date(2026, 4, 3)]
        state = compute_cycle_state(starts, date(2026, 5, 10))
        assert state["lastPeriodStart"] == "2026-05-01"
