"""
Supplement conflict checker — REAL implementation (PRD Section 12).
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional

# ---------- Protocol table (PRD Section 12.1) ----------
PROTOCOL: list[dict] = [
    {"name": "vitamin_d3",            "dose": "10,000 IU",   "timing": "With fattiest meal",               "conflicts": ["iron"]},
    {"name": "vitamin_k2",            "dose": "100-200 mcg", "timing": "Same meal as D3",                  "conflicts": []},
    {"name": "iron",                  "dose": "60mg (2x30mg)", "timing": "Empty stomach + vitamin C",      "conflicts": ["vitamin_d3", "coffee", "tea", "calcium"]},
    {"name": "creatine_monohydrate",  "dose": "3-5g",        "timing": "Any time with food",               "conflicts": []},
    {"name": "magnesium_glycinate",   "dose": "200-400mg",   "timing": "Before sleep",                     "conflicts": []},
    {"name": "b12",                   "dose": "TBD",         "timing": "Morning",                          "conflicts": []},
]

# ---------- Conflict window map (extensible) ----------
# Key: frozenset of the two supplement names; Value: minimum hours required between doses
CONFLICT_HOURS: dict[frozenset, float] = {
    frozenset({"iron", "vitamin_d3"}): 2.0,
}


def _normalize(name: str) -> str:
    return name.lower().replace(" ", "_").replace("-", "_")


def check_conflicts(
    new_name: str,
    taken_at: datetime,
    todays_logs: list[dict],
) -> tuple[list[str], Optional[str]]:
    """
    Check whether logging `new_name` at `taken_at` conflicts with any supplement
    already in `todays_logs`.

    todays_logs: list of dicts with keys {"supplement_name": str, "taken_at": str (ISO)}.

    Returns:
        conflicts        - list of human-readable conflict messages
        next_safe_time   - ISO timestamp string when it is safe to take, or None
    """
    new_key = _normalize(new_name)
    conflict_messages: list[str] = []
    next_safe_time: Optional[datetime] = None

    for log in todays_logs:
        existing_key = _normalize(log["supplement_name"])
        pair = frozenset({new_key, existing_key})
        min_hours = CONFLICT_HOURS.get(pair)
        if min_hours is None:
            continue

        try:
            existing_dt = datetime.fromisoformat(log["taken_at"])
        except (ValueError, KeyError):
            continue

        gap_hours = abs((taken_at - existing_dt).total_seconds()) / 3600
        if gap_hours < min_hours:
            safe_dt = existing_dt + timedelta(hours=min_hours)
            safe_str = safe_dt.strftime("%I:%M %p").lstrip("0")

            # Human-readable message (PRD Section 12.2 example)
            if new_key == "iron" and existing_key == "vitamin_d3":
                msg = (
                    f"Iron is most effective 2+ hours after Vitamin D3. "
                    f"You took D3 at {existing_dt.strftime('%I:%M %p').lstrip('0')} - "
                    f"wait until {safe_str}."
                )
            elif new_key == "vitamin_d3" and existing_key == "iron":
                msg = (
                    f"Vitamin D3 is best taken 2+ hours away from iron. "
                    f"You took iron at {existing_dt.strftime('%I:%M %p').lstrip('0')} - "
                    f"wait until {safe_str}."
                )
            else:
                msg = (
                    f"{new_name} conflicts with {log['supplement_name']} — "
                    f"wait {min_hours:.0f}h (until {safe_str})."
                )

            conflict_messages.append(msg)
            if next_safe_time is None or safe_dt > next_safe_time:
                next_safe_time = safe_dt

    next_safe_iso = next_safe_time.isoformat() if next_safe_time else None
    return conflict_messages, next_safe_iso
