"""
Scan endpoints — POST /scan/photo, /scan/barcode, /scan/label (PRD Section 7 / 16).

Photo and label scanning delegates to vision_router (stub).
Barcode lookup: TODO(Section 4.2) — USDA + Open Food Facts.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.nutrition import (
    BarcodeRequest,
    LabelRequest,
    NutritionItem,
    ScanRequest,
    ScanResult,
)
from app.services.vision_router import route_food_scan

router = APIRouter(prefix="/scan", tags=["scan"])


@router.post("/photo", response_model=ScanResult)
async def scan_photo(payload: ScanRequest) -> ScanResult:
    """
    Upload an image (base64) + optional LiDAR depth data.
    Returns a nutrition breakdown for each identified food item.
    Delegates to the multi-model vision router (PRD Section 7.4 — currently stub).
    """
    return await route_food_scan(payload.image_b64, payload.depth_data)


@router.post("/barcode", response_model=ScanResult)
async def scan_barcode(payload: BarcodeRequest) -> ScanResult:
    """
    Look up nutrition by UPC/EAN barcode.
    TODO(Section 4.2): query USDA FoodData Central + Open Food Facts APIs.
    """
    stub_item = NutritionItem(
        food_name=f"Product {payload.barcode} (stub)",
        portion_description="1 serving",
        weight_grams=100,
        calories=150,
        protein_g=5,
        carbs_g=25,
        fat_g=4,
        confidence=0.0,
    )
    return ScanResult(
        items=[stub_item],
        overall_confidence=0.0,
        scan_notes="stub - barcode USDA/Open Food Facts lookup not implemented (Section 4.2 TODO)",
        stub=True,
    )


@router.post("/label", response_model=ScanResult)
async def scan_label(payload: LabelRequest) -> ScanResult:
    """
    OCR a nutrition facts panel and return normalized macros.
    TODO(Section 4.3): Google ML Kit / cloud OCR extraction.
    """
    stub_item = NutritionItem(
        food_name="Nutrition label item (stub)",
        portion_description="1 serving",
        weight_grams=payload.serving_quantity or 100,
        calories=200,
        protein_g=8,
        carbs_g=30,
        fat_g=6,
        confidence=0.0,
    )
    return ScanResult(
        items=[stub_item],
        overall_confidence=0.0,
        scan_notes="stub - OCR label extraction not implemented (Section 4.3 TODO)",
        stub=True,
    )
