"""
Unit tests for app/services/calories.py (PRD Section 2).
All assertions verify formulas from the PRD exactly.
"""

import pytest

from app.services.calories import (
    ACTIVITY_FACTORS,
    apply_luteal,
    bmr,
    daily_calorie_target,
    macro_targets,
    needs_recalc,
    tdee,
)


class TestBMR:
    def test_female_formula(self):
        # 10*42 + 6.25*163 - 5*20 - 161 = 420 + 1018.75 - 100 - 161 = 1177.75
        result = bmr("female", 42, 163, 20)
        assert result == pytest.approx(1177.75, abs=0.01)

    def test_male_formula(self):
        # 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
        result = bmr("male", 80, 180, 30)
        assert result == pytest.approx(1780.0, abs=0.01)

    def test_female_alias_f(self):
        assert bmr("f", 42, 163, 20) == pytest.approx(bmr("female", 42, 163, 20))

    def test_sex_case_insensitive(self):
        assert bmr("FEMALE", 42, 163, 20) == pytest.approx(bmr("female", 42, 163, 20))


class TestTDEE:
    def test_lightly_active(self):
        b = bmr("female", 42, 163, 20)
        result = tdee(b, "lightly_active")
        assert result == pytest.approx(b * 1.375, abs=0.01)

    def test_all_factors_present(self):
        keys = {"sedentary", "lightly_active", "moderately_active", "very_active", "athlete"}
        assert set(ACTIVITY_FACTORS.keys()) == keys

    def test_unknown_key_raises(self):
        with pytest.raises(ValueError, match="Unknown activity_key"):
            tdee(1000, "ultra_active")

    def test_athlete_factor(self):
        b = 1000.0
        assert tdee(b, "athlete") == pytest.approx(1900.0, abs=0.01)


class TestDailyCalorieTarget:
    def test_build_muscle_default_surplus(self):
        result = daily_calorie_target(2000.0, "build_muscle")
        assert result == 2300

    def test_build_muscle_custom_surplus(self):
        result = daily_calorie_target(2000.0, "build_muscle", surplus=300)
        assert result == 2300

    def test_maintain(self):
        assert daily_calorie_target(2000.0, "maintain") == 2000

    def test_lose(self):
        assert daily_calorie_target(2000.0, "lose") == 1500

    def test_unknown_goal_raises(self):
        with pytest.raises(ValueError, match="Unknown goal"):
            daily_calorie_target(2000.0, "bulk_and_cut")

    def test_prd_example_42kg_lightly_active(self):
        """
        PRD Section 2 example: 42kg female, lightly active, build_muscle.
        With the default +300 surplus (the PRD lean-gain low end), the target lands
        inside the PRD's stated 1,850-1,950 range.
        """
        b = bmr("female", 42, 163, 20)
        t = tdee(b, "lightly_active")
        target = daily_calorie_target(t, "build_muscle")  # default surplus now 300
        # BMR=1177.75, TDEE=1619.41, target=1919
        assert 1850 <= target <= 1950


class TestMacroTargets:
    def test_protein_formula(self):
        # protein_g = round(2.9 * weight_kg)
        result = macro_targets(42, 1900)
        assert result["protein_g"] == round(2.9 * 42)

    def test_fat_formula(self):
        result = macro_targets(42, 1900)
        # fat_g = round(1900 * 0.25 / 9)
        assert result["fat_g"] == round(1900 * 0.25 / 9)

    def test_carbs_formula(self):
        result = macro_targets(42, 1900)
        protein_cal = result["protein_g"] * 4
        fat_cal = result["fat_g"] * 9
        assert result["carbs_g"] == round((1900 - protein_cal - fat_cal) / 4)

    def test_returns_three_keys(self):
        result = macro_targets(60, 2200)
        assert set(result.keys()) == {"protein_g", "fat_g", "carbs_g"}

    def test_prd_protein_table_42kg(self):
        """PRD table: 42kg -> 120-125g protein."""
        result = macro_targets(42, 1900)
        assert 118 <= result["protein_g"] <= 125


class TestApplyLuteal:
    def test_adds_200_cal_and_12g_protein(self):
        base = {"calories": 1900, "protein_g": 120, "fat_g": 50, "carbs_g": 240}
        result = apply_luteal(base, is_luteal=True)
        assert result["calories"] == 2100
        assert result["protein_g"] == 132

    def test_no_change_when_not_luteal(self):
        base = {"calories": 1900, "protein_g": 120}
        result = apply_luteal(base, is_luteal=False)
        assert result == base

    def test_does_not_mutate_input(self):
        base = {"calories": 1900, "protein_g": 120}
        _ = apply_luteal(base, is_luteal=True)
        assert base["calories"] == 1900  # unchanged


class TestNeedsRecalc:
    """
    PRD Section 2 intent: recalc fires when weight has gained >= 3 kg SINCE the
    last recalc, measured continuously from the last recalc weight (not a grid).
    """

    def test_one_kg_gain_crossing_grid_line_is_false(self):
        # 44 -> 45 is only a 1 kg gain even though it crosses the //3 grid line.
        assert needs_recalc(44.0, 45.0) is False

    def test_full_three_kg_gain_is_true(self):
        # 42 -> 45 is a full 3 kg gain.
        assert needs_recalc(42.0, 45.0) is True

    def test_two_point_nine_kg_gain_is_false(self):
        # 42 -> 44.9 is 2.9 kg, just under the threshold.
        assert needs_recalc(42.0, 44.9) is False

    def test_exactly_three_kg_is_true(self):
        # Exactly 3.0 kg gained should fire.
        assert needs_recalc(42.0, 45.0) is True

    def test_recalc_large_gain(self):
        # 42 -> 48 is 6 kg, well over threshold.
        assert needs_recalc(42.0, 48.0) is True

    def test_no_recalc_when_weight_unchanged(self):
        assert needs_recalc(42.0, 42.0) is False

    def test_custom_step(self):
        assert needs_recalc(10.0, 14.9, step=5.0) is False
        assert needs_recalc(10.0, 15.0, step=5.0) is True
