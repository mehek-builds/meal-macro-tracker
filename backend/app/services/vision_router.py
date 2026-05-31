"""
Vision model router — STUB (PRD Section 7.4).

Real implementation requires:
  - openai>=1.30 (GPT-4o / GPT-4o-mini) — NOT imported at top level
  - anthropic>=0.25 (Claude claude-sonnet-4-6) — NOT imported at top level
  - Image preprocessing (pillow, numpy) — NOT imported at top level

The routing skeleton is present; model calls raise NotImplementedError with clear TODO notes.
"""

from __future__ import annotations

from app.models.nutrition import NutritionItem, ScanResult


# ---------- stubs for individual model calls ----------

async def _call_gpt4o_mini(image_b64: str, depth_data: dict | None) -> ScanResult:
    # TODO(Section 7.4): call openai.AsyncOpenAI().chat.completions.create(
    #   model="gpt-4o-mini", response_format=..., messages=[...SCAN_SYSTEM_PROMPT...]
    # )
    raise NotImplementedError("GPT-4o-mini call not implemented (stub)")


async def _call_gpt4o(image_b64: str, depth_data: dict | None) -> ScanResult:
    # TODO(Section 7.4): call openai.AsyncOpenAI().chat.completions.create(
    #   model="gpt-4o", response_format=..., messages=[...SCAN_SYSTEM_PROMPT...]
    # )
    raise NotImplementedError("GPT-4o call not implemented (stub)")


async def _call_claude(image_b64: str, depth_data: dict | None) -> ScanResult:
    # TODO(Section 7.4): call anthropic.AsyncAnthropic().messages.create(
    #   model="claude-sonnet-4-6", messages=[...SCAN_SYSTEM_PROMPT...]
    # )
    raise NotImplementedError("Claude call not implemented (stub)")


async def _classify_complexity(image_b64: str) -> str:
    # TODO(Section 7.4): cheap GPT-4o-mini call to classify image as
    #   "simple" | "moderate" | "complex" before choosing model
    return "moderate"  # safe default


async def _merge_results(result_a: ScanResult, result_b: ScanResult) -> ScanResult:
    # TODO(Section 7.4): weighted average of two ScanResults for complex dishes
    return result_a


async def _run_second_opinion(
    image_b64: str,
    depth_data: dict | None,
    first_result: ScanResult,
) -> ScanResult:
    # TODO(Section 7.4): re-run with the alternate model when confidence < threshold
    return first_result


# ---------- public entry point ----------

async def route_food_scan(
    image_b64: str,
    depth_data: dict | None,
) -> ScanResult:
    """
    Route a food scan to the cheapest adequate model (PRD Section 7.4).

    Currently returns a canned stub result rather than calling any model.
    Replace _call_* implementations above and remove the stub block below.
    """
    # --- STUB model step: representative data without a real model call ---
    # (Real impl replaces this block with the SKELETON routing below.)
    stub_item = NutritionItem(
        food_name="Sample Food (stub)",
        portion_description="100g estimated",
        weight_grams=100,
        calories=200,
        protein_g=15,
        carbs_g=20,
        fat_g=5,
        confidence=0.0,
        hidden_calories_warning=None,
    )
    result = ScanResult(
        items=[stub_item],
        overall_confidence=0.0,
        scan_notes="stub - no model call was made (Section 7.4 TODO)",
        stub=True,
    )

    # --- RAG override (PRD Section 7.6 + Section 20 risk) ---
    # The DB lookup OVERWRITES the model's calorie/macro estimates with verified
    # values before returning. This ordering (DB overrides model) is what prevents
    # the LLM from hallucinating numbers. The loop is structurally present even while
    # fuzzy_lookup is a stub — the contract (DB wins over model) is what matters here.
    # Local import keeps the optional data deps out of module import.
    from app.services.rag import fuzzy_lookup

    for item in result.items:
        # TODO(7.6): swap stub fuzzy_lookup for real pgvector USDA/IFCT search
        looked_up = fuzzy_lookup(item.food_name, item.weight_grams)
        item.calories = looked_up["calories"]
        item.protein_g = looked_up["protein_g"]
        item.carbs_g = looked_up["carbs_g"]
        item.fat_g = looked_up["fat_g"]

    return result

    # --- SKELETON (unreachable until stubs are wired) ---
    # complexity = await _classify_complexity(image_b64)
    # if complexity == "simple":
    #     result = await _call_gpt4o_mini(image_b64, depth_data)
    # elif complexity == "moderate":
    #     result = await _call_gpt4o(image_b64, depth_data)
    # else:  # complex
    #     result_a = await _call_gpt4o(image_b64, depth_data)
    #     result_b = await _call_claude(image_b64, depth_data)
    #     result = await _merge_results(result_a, result_b)
    # from app.config import settings
    # if result.overall_confidence < settings.confidence_threshold:
    #     result = await _run_second_opinion(image_b64, depth_data, result)
    # # Then the same RAG-override loop above runs before returning.
    # return result
