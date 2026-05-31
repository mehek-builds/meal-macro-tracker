"""
Shared base model establishing the camelCase wire contract.

The mobile app and PRD use camelCase JSON; the backend keeps snake_case Python
field names. Every wire model inherits from CamelModel so:
  - responses serialize by alias (camelCase) — FastAPI uses by_alias for response_model
  - requests accept BOTH camelCase (alias) and snake_case (populate_by_name)

Enum string VALUES are unaffected (e.g. "build_muscle", "photo_scan" stay as-is).
Do NOT use this for config.Settings — BaseSettings must stay snake_case for env vars.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
