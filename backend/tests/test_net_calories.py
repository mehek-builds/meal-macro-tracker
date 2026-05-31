"""
Unit tests for app/services/net_calories.py (PRD Section 9.7).
"""

import pytest

from app.services.net_calories import calculate_net_calories


class TestFixedMode:
    def test_remaining_positive(self):
        result = calculate_net_calories(1200, 400, 2000, "fixed")
        assert result["target"] == 2000
        assert result["eaten"] == 1200
        assert result["burned"] == 400
        assert result["remaining"] == 800
        assert result["display_burned"] is True

    def test_remaining_negative_over_eaten(self):
        result = calculate_net_calories(2200, 400, 2000, "fixed")
        assert result["remaining"] == -200

    def test_burns_do_not_change_target(self):
        r1 = calculate_net_calories(1200, 0, 2000, "fixed")
        r2 = calculate_net_calories(1200, 800, 2000, "fixed")
        assert r1["target"] == r2["target"] == 2000


class TestEatBackMode:
    def test_adjusted_target(self):
        result = calculate_net_calories(1200, 400, 2000, "eat_back")
        assert result["target"] == 2400
        assert result["remaining"] == 1200

    def test_zero_exercise(self):
        result = calculate_net_calories(1200, 0, 2000, "eat_back")
        assert result["target"] == 2000


class TestNetMode:
    def test_above_bmr_floor(self):
        result = calculate_net_calories(2000, 300, 2000, "net", bmr_floor=1400)
        assert result["net_calories"] == 1700
        assert result["bmr_floor"] == 1400
        assert result["should_eat_more"] is False
        assert result["eat_more_by"] == 0

    def test_below_bmr_floor(self):
        result = calculate_net_calories(1200, 400, 2000, "net", bmr_floor=1500)
        net = 1200 - 400  # 800
        assert result["net_calories"] == 800
        assert result["should_eat_more"] is True
        assert result["eat_more_by"] == 700  # 1500 - 800

    def test_eat_more_never_negative(self):
        result = calculate_net_calories(3000, 0, 2000, "net", bmr_floor=1500)
        assert result["eat_more_by"] == 0


class TestInvalidMode:
    def test_raises_value_error(self):
        with pytest.raises(ValueError, match="Unknown mode"):
            calculate_net_calories(1200, 400, 2000, "unknown")  # type: ignore[arg-type]
