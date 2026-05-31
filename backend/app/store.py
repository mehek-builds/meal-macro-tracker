"""
In-memory store — DEV ONLY, NOT persistent across restarts.
Production: swap all store calls for Supabase queries (see app/db.py and PRD Section 16).

Each collection is a plain dict keyed by str UUID.
"""

from __future__ import annotations

import uuid
from collections import defaultdict
from typing import Any

_stores: dict[str, dict[str, Any]] = defaultdict(dict)


def _new_id() -> str:
    return str(uuid.uuid4())


# ---------- public API ----------

def insert(collection: str, data: dict[str, Any]) -> dict[str, Any]:
    """Insert a record; assigns a new UUID id if not already present."""
    record = dict(data)
    if not record.get("id"):
        record["id"] = _new_id()
    _stores[collection][record["id"]] = record
    return record


def get(collection: str, record_id: str) -> dict[str, Any] | None:
    return _stores[collection].get(record_id)


def list_all(collection: str) -> list[dict[str, Any]]:
    return list(_stores[collection].values())


def update(collection: str, record_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    existing = _stores[collection].get(record_id)
    if existing is None:
        return None
    existing.update(data)
    return existing


def delete(collection: str, record_id: str) -> bool:
    return _stores[collection].pop(record_id, None) is not None


def query(collection: str, **filters: Any) -> list[dict[str, Any]]:
    """Return records matching all key=value filters."""
    results = []
    for record in _stores[collection].values():
        if all(record.get(k) == v for k, v in filters.items()):
            results.append(record)
    return results


def clear_all() -> None:
    """Test helper: wipe every collection."""
    _stores.clear()
