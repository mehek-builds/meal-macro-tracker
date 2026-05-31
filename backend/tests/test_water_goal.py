"""
Unit tests for app/services/water_goal.py (PRD Section 10.1).
"""

import pytest

from app.models.water import WaterGoal
from app.services.water_goal import (
    DEFAULT_WATER_GOAL,
    get_today_water_goal_liters,
    liters_to_oz,
)


class TestDefaultGoal:
    def test_rest_day_default(self):
        assert DEFAULT_WATER_GOAL.rest_day_liters == 2.5

    def test_training_day_default(self):
        assert DEFAULT_WATER_GOAL.training_day_liters == 3.0

    def test_per_hour_bonus_default(self):
        assert DEFAULT_WATER_GOAL.per_hour_training_bonus == 0.5


class TestGetTodayWaterGoalLiters:
    def test_rest_day_zero_minutes(self):
        result = get_today_water_goal_liters(0)
        assert result == 2.5

    def test_training_day_60_minutes(self):
        # base=3.0, bonus=1.0*0.5=0.5 → 3.5
        result = get_today_water_goal_liters(60)
        assert result == 3.5

    def test_training_day_30_minutes(self):
        # base=3.0, bonus=0.5*0.5=0.25 → 3.25, rounded to 1 decimal
        result = get_today_water_goal_liters(30)
        assert result == 3.2

    def test_rounds_to_one_decimal(self):
        # 90 min: bonus=1.5*0.5=0.75 → 3.75 → 3.8
        result = get_today_water_goal_liters(90)
        assert result == 3.8

    def test_custom_goal(self):
        goal = WaterGoal(rest_day_liters=2.0, training_day_liters=2.5, per_hour_training_bonus=0.6)
        result = get_today_water_goal_liters(60, goal)
        # base=2.5, bonus=1.0*0.6=0.6 → 3.1
        assert result == 3.1

    def test_negative_minutes_treated_as_rest(self):
        # Edge: negative minutes — isTrainingDay=False since 0 is the boundary
        result = get_today_water_goal_liters(0)
        assert result == 2.5


class TestLitersToOz:
    def test_2_5_liters(self):
        # 2.5 * 33.814 = 84.535 → 84.5
        result = liters_to_oz(2.5)
        assert result == pytest.approx(84.5, abs=0.1)

    def test_3_liters(self):
        result = liters_to_oz(3.0)
        assert result == pytest.approx(101.4, abs=0.1)
