"""
Nutrition-related Pydantic models (PRD Sections 4, 7, 8, 16).
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class NutritionItem(BaseModel):
    food_name: str
    portion_description: str = ""
    weight_grams: float
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    confidence: float = Field(ge=0.0, le=1.0)
    hidden_calories_warning: Optional[str] = None


class ScanRequest(BaseModel):
    """Payload for POST /scan/photo."""
    image_b64: str
    depth_data: Optional[dict] = None


class BarcodeRequest(BaseModel):
    """Payload for POST /scan/barcode."""
    barcode: str  # UPC / EAN


class LabelRequest(BaseModel):
    """Payload for POST /scan/label."""
    image_b64: str
    serving_quantity: Optional[float] = None  # actual servings consumed


class ScanResult(BaseModel):
    items: list[NutritionItem]
    overall_confidence: float = Field(ge=0.0, le=1.0)
    scan_notes: str = ""
    stub: bool = False  # True when result comes from a stub, not a real model call


class FoodLogEntry(BaseModel):
    id: Optional[str] = None
    date: str  # YYYY-MM-DD
    meal: str = "snacks"  # breakfast | lunch | dinner | snacks
    food_name: str
    weight_grams: float
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    source: str = "manual"  # manual | scan | barcode | label


class CustomFood(BaseModel):
    id: Optional[str] = None
    name: str
    calories_per_100g: float
    protein_per_100g: float
    carbs_per_100g: float
    fat_per_100g: float
    notes: str = ""


class FoodSearchResult(BaseModel):
    id: str
    name: str
    source: str  # usda | custom | open_food_facts
    calories_per_100g: float
    protein_per_100g: float
    carbs_per_100g: float
    fat_per_100g: float
