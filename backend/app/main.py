"""
FastAPI application entry point.

Start: uvicorn app.main:app --reload
Docs:  http://localhost:8000/docs
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import (
    bloodwork,
    cycle,
    exercise,
    foods,
    log,
    measurements,
    races,
    scan,
    supplements,
    training,
    user,
    water,
)

app = FastAPI(
    title="Fitness Tracker API",
    description="Personal AI nutrition-tracking backend (PRD v2.0, May 2026)",
    version="0.1.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(scan.router)
app.include_router(log.router)
app.include_router(exercise.router)
app.include_router(user.router)
app.include_router(water.router)
app.include_router(supplements.router)
app.include_router(measurements.router)
app.include_router(bloodwork.router)
app.include_router(cycle.router)
app.include_router(training.router)
app.include_router(races.router)
app.include_router(foods.router)


@app.get("/health", tags=["meta"])
def health() -> dict:
    return {"status": "ok", "version": "0.1.0"}


@app.get("/", tags=["meta"])
def root() -> dict:
    return {
        "message": "Fitness Tracker API",
        "docs": "/docs",
        "health": "/health",
    }
