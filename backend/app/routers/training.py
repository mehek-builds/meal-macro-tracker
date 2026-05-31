"""
Training mode endpoint (PRD Section 15 / 16).

PUT /training/mode
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

import app.store as store
from app.models.base import CamelModel
from app.models.training import TrainingMode

router = APIRouter(prefix="/training", tags=["training"])

USER_COLLECTION = "user"
SINGLETON_ID = "profile"


class TrainingModeRequest(CamelModel):
    mode: TrainingMode


@router.put("/mode", response_model=dict)
def set_training_mode(payload: TrainingModeRequest) -> dict:
    """
    Switch training mode: muscle_gain | marathon | both (PRD Section 15.2).
    TODO(Section 15.3): applying marathon-specific nutrition overlays on mode change.
    """
    existing = store.get(USER_COLLECTION, SINGLETON_ID)
    if existing is None:
        raise HTTPException(status_code=404, detail="Profile not set up yet")
    store.update(USER_COLLECTION, SINGLETON_ID, {"training_mode": payload.mode.value})
    return {"trainingMode": payload.mode.value}
