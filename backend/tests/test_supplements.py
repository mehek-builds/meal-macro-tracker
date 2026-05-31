"""
Unit tests for app/services/supplements.py (PRD Section 12).
"""

import pytest
from datetime import datetime, timedelta, timezone

from app.services.supplements import check_conflicts, CONFLICT_HOURS, PROTOCOL


class TestProtocol:
    def test_six_supplements_in_protocol(self):
        assert len(PROTOCOL) == 6

    def test_iron_conflicts_with_vitamin_d3(self):
        iron = next(p for p in PROTOCOL if p["name"] == "iron")
        assert "vitamin_d3" in iron["conflicts"]

    def test_vitamin_d3_conflicts_with_iron(self):
        d3 = next(p for p in PROTOCOL if p["name"] == "vitamin_d3")
        assert "iron" in d3["conflicts"]


class TestConflictHours:
    def test_iron_d3_pair_is_2_hours(self):
        pair = frozenset({"iron", "vitamin_d3"})
        assert CONFLICT_HOURS[pair] == 2.0


class TestCheckConflicts:
    BASE_TIME = datetime(2026, 5, 31, 13, 30, tzinfo=timezone.utc)  # 1:30 PM

    def _log(self, name: str, offset_hours: float) -> dict:
        taken_at = self.BASE_TIME + timedelta(hours=offset_hours)
        return {"supplement_name": name, "taken_at": taken_at.isoformat()}

    def test_no_conflicts_when_logs_empty(self):
        conflicts, next_safe = check_conflicts("iron", self.BASE_TIME, [])
        assert conflicts == []
        assert next_safe is None

    def test_iron_after_d3_within_window_conflicts(self):
        # D3 taken at base_time; trying to log iron 1h later
        d3_log = self._log("vitamin_d3", 0)
        iron_time = self.BASE_TIME + timedelta(hours=1)
        conflicts, next_safe = check_conflicts("iron", iron_time, [d3_log])
        assert len(conflicts) == 1
        assert "Iron" in conflicts[0]
        assert next_safe is not None

    def test_iron_after_d3_outside_window_no_conflict(self):
        # D3 taken at base_time; iron logged 2h later (exactly at boundary)
        d3_log = self._log("vitamin_d3", 0)
        iron_time = self.BASE_TIME + timedelta(hours=2)
        conflicts, next_safe = check_conflicts("iron", iron_time, [d3_log])
        # gap == min_hours (2.0), not strictly less than → no conflict
        assert conflicts == []
        assert next_safe is None

    def test_d3_after_iron_within_window_conflicts(self):
        iron_log = self._log("iron", 0)
        d3_time = self.BASE_TIME + timedelta(hours=0.5)
        conflicts, next_safe = check_conflicts("vitamin_d3", d3_time, [iron_log])
        assert len(conflicts) == 1
        assert "Vitamin D3" in conflicts[0] or "vitamin" in conflicts[0].lower()

    def test_next_safe_time_is_correct(self):
        # D3 taken at base_time; iron 30m later → next safe = base_time + 2h
        d3_log = self._log("vitamin_d3", 0)
        iron_time = self.BASE_TIME + timedelta(minutes=30)
        conflicts, next_safe = check_conflicts("iron", iron_time, [d3_log])
        expected = (self.BASE_TIME + timedelta(hours=2)).isoformat()
        assert next_safe == expected

    def test_unrelated_supplement_no_conflict(self):
        # creatine and magnesium have no conflict
        creatine_log = self._log("creatine_monohydrate", 0)
        mag_time = self.BASE_TIME + timedelta(minutes=30)
        conflicts, next_safe = check_conflicts("magnesium_glycinate", mag_time, [creatine_log])
        assert conflicts == []
        assert next_safe is None

    def test_case_insensitive_supplement_name(self):
        # Name normalisation: "Vitamin D3" -> "vitamin_d3"
        d3_log = {"supplement_name": "Vitamin D3", "taken_at": self.BASE_TIME.isoformat()}
        iron_time = self.BASE_TIME + timedelta(hours=1)
        conflicts, _ = check_conflicts("Iron", iron_time, [d3_log])
        assert len(conflicts) == 1
