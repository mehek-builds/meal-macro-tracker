"""
Supabase client stub.

All endpoints currently use app/store.py (in-memory, dev only).
When ready for production:
  1. Set SUPABASE_URL + SUPABASE_SERVICE_KEY in .env
  2. Replace store calls with supabase.table(...).select/insert/update/delete
  3. Enable pgvector extension in Supabase for RAG (PRD Section 7.6)

DO NOT import supabase at module top level — the package is in the optional
[data] extra and may not be installed.
"""

from __future__ import annotations


def get_supabase():  # type: ignore[return]
    """
    Return a configured Supabase client.

    Raises RuntimeError if SUPABASE_URL / SUPABASE_SERVICE_KEY are not set,
    or ImportError if the supabase package is not installed (pip install -e ".[data]").
    """
    from app.config import settings  # local import keeps base install clean

    if not settings.supabase_url or not settings.supabase_service_key:
        raise RuntimeError(
            "Supabase is not configured. "
            "Set SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file. "
            "Until then, all endpoints use app/store.py (in-memory, dev only)."
        )

    try:
        # supabase is in the [data] optional extra — lazy import intentional
        from supabase import create_client  # type: ignore[import]
    except ImportError as exc:
        raise ImportError(
            "supabase package not installed. Run: pip install -e '.[data]'"
        ) from exc

    return create_client(settings.supabase_url, settings.supabase_service_key)
