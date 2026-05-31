"""
Verbatim SCAN_SYSTEM_PROMPT and SCAN_RESPONSE_SCHEMA from PRD Section 7.5.
Used by app/services/vision_router.py when making real model calls.
"""

SCAN_SYSTEM_PROMPT = """
You are a registered dietitian and professional food nutritionist.
When shown a photo of food, you:
1. Identify every distinct food item visible in the image
2. Estimate the portion weight in grams for each item, using any size reference
   objects visible (plates, utensils, hands) and any depth/volume data provided
3. Output structured data only - no conversational text

If depth volume data is provided, use it as the primary basis for portion estimation.
If no depth data is available, estimate portions from visual size cues and standard serving sizes.

Confidence guidelines:
- 0.9+: Single ingredient, clearly identifiable, good lighting
- 0.7-0.9: Standard meal, identifiable components, reasonable lighting
- 0.5-0.7: Mixed dish, some uncertainty
- <0.5: Very mixed or obscured dish

Always flag likely hidden fats/oils/sauces not directly visible.
"""

SCAN_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "items": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "food_name": {"type": "string"},
                    "portion_description": {"type": "string"},
                    "weight_grams": {"type": "number"},
                    "calories": {"type": "number"},
                    "protein_g": {"type": "number"},
                    "carbs_g": {"type": "number"},
                    "fat_g": {"type": "number"},
                    "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                    "hidden_calories_warning": {"type": "string"}
                },
                "required": ["food_name", "weight_grams", "calories",
                             "protein_g", "carbs_g", "fat_g", "confidence"]
            }
        },
        "overall_confidence": {"type": "number"},
        "scan_notes": {"type": "string"}
    }
}
