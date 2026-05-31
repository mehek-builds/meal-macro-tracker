"""
Nutrition-related Pydantic models (PRD Sections 4, 7, 8, 16).
"""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import Field

from app.models.base import CamelModel


class FoodSource(str, Enum):
    """Where a food log entry originated (PRD Section 4)."""
    photo_scan = "photo_scan"
    barcode = "barcode"
    label_ocr = "label_ocr"
    voice = "voice"
    text_search = "text_search"
    custom = "custom"
    manual = "manual"


class NutritionItem(CamelModel):
    food_name: str
    portion_description: str = ""
    weight_grams: float
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    confidence: float = Field(ge=0.0, le=1.0)
    hidden_calories_warning: Optional[str] = None
    # Critical micronutrients (PRD Section 5). Optional — populated when known.
    iron_mg: Optional[float] = None
    calcium_mg: Optional[float] = None
    magnesium_mg: Optional[float] = None
    zinc_mg: Optional[float] = None


class ScanRequest(CamelModel):
    """Payload for POST /scan/photo."""
    image_b64: str
    depth_data: Optional[dict] = None


class BarcodeRequest(CamelModel):
    """Payload for POST /scan/barcode."""
    barcode: str  # UPC / EAN


class LabelRequest(CamelModel):
    """Payload for POST /scan/label."""
    image_b64: str
    serving_quantity: Optional[float] = None  # actual servings consumed


class ScanResult(CamelModel):
    items: list[NutritionItem]
    overall_confidence: float = Field(ge=0.0, le=1.0)
    scan_notes: str = ""
    stub: bool = False  # True when result comes from a stub, not a real model call


class FoodLogEntry(CamelModel):
    id: Optional[str] = None
    date: str  # YYYY-MM-DD
    meal: str = "snacks"  # breakfast | lunch | dinner | snacks
    source: FoodSource = FoodSource.manual
    item: NutritionItem  # nested nutrition detail (replaces flat macro fields)


class CustomFood(CamelModel):
    id: Optional[str] = None
    name: str
    calories_per_100g: float
    protein_per_100g: float
    carbs_per_100g: float
    fat_per_100g: float
    notes: str = ""


class FoodSearchResult(CamelModel):
    id: str
    name: str
    source: str  # usda | custom | open_food_facts
    calories_per_100g: float
    protein_per_100g: float
    carbs_per_100g: float
    fat_per_100g: float
