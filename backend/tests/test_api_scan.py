"""
Integration tests for scan stub endpoints:
  POST /scan/photo
  POST /scan/barcode
  POST /scan/label

These endpoints are stubs — the tests verify:
  - Status code 200
  - Response contains the documented stub fields (items, overall_confidence, scan_notes, stub)
  - Stub flag is True
  - At least one item is returned with required nutrition fields
"""

import pytest
from fastapi.testclient import TestClient

import app.store as store
from app.main import app

client = TestClient(app)

# Wire contract is camelCase (CamelModel alias generator).
REQUIRED_ITEM_FIELDS = {
    "foodName", "weightGrams", "calories",
    "proteinG", "carbsG", "fatG", "confidence",
}

REQUIRED_RESULT_FIELDS = {
    "items", "overallConfidence", "scanNotes", "stub",
}


@pytest.fixture(autouse=True)
def reset_store():
    store.clear_all()
    yield
    store.clear_all()


class TestScanPhoto:
    def test_scan_photo_returns_200(self):
        response = client.post("/scan/photo", json={
            "image_b64": "aGVsbG8=",  # base64("hello")
        })
        assert response.status_code == 200

    def test_scan_photo_has_required_fields(self):
        response = client.post("/scan/photo", json={"image_b64": "aGVsbG8="})
        data = response.json()
        for field in REQUIRED_RESULT_FIELDS:
            assert field in data, f"Missing field: {field}"

    def test_scan_photo_stub_flag_is_true(self):
        response = client.post("/scan/photo", json={"image_b64": "aGVsbG8="})
        assert response.json()["stub"] is True

    def test_scan_photo_returns_at_least_one_item(self):
        response = client.post("/scan/photo", json={"image_b64": "aGVsbG8="})
        items = response.json()["items"]
        assert len(items) >= 1

    def test_scan_photo_item_has_required_nutrition_fields(self):
        response = client.post("/scan/photo", json={"image_b64": "aGVsbG8="})
        item = response.json()["items"][0]
        for field in REQUIRED_ITEM_FIELDS:
            assert field in item, f"Missing item field: {field}"

    def test_scan_photo_with_depth_data_accepted(self):
        response = client.post("/scan/photo", json={
            "image_b64": "aGVsbG8=",
            "depth_data": {"values": [0.5, 0.6, 0.7]},
        })
        assert response.status_code == 200

    def test_scan_photo_overall_confidence_in_range(self):
        response = client.post("/scan/photo", json={"image_b64": "aGVsbG8="})
        confidence = response.json()["overallConfidence"]
        assert 0.0 <= confidence <= 1.0

    def test_scan_photo_oversized_payload_returns_413(self):
        """PRD Section 16 scan step 2: reject images >= 5MB before processing."""
        from app.config import settings
        # Build a base64 string whose approx decoded size exceeds the limit.
        # approx_decoded_bytes = len(b64) * 3 / 4, so need len > max_bytes * 4 / 3.
        oversized_len = int(settings.photo_max_bytes * 4 / 3) + 1000
        big_b64 = "A" * oversized_len
        response = client.post("/scan/photo", json={"image_b64": big_b64})
        assert response.status_code == 413

    def test_scan_photo_at_limit_payload_accepted(self):
        """A small payload well under the limit is processed normally (200)."""
        response = client.post("/scan/photo", json={"image_b64": "aGVsbG8="})
        assert response.status_code == 200


class TestScanBarcode:
    def test_scan_barcode_returns_200(self):
        response = client.post("/scan/barcode", json={"barcode": "012345678901"})
        assert response.status_code == 200

    def test_scan_barcode_has_required_fields(self):
        response = client.post("/scan/barcode", json={"barcode": "012345678901"})
        data = response.json()
        for field in REQUIRED_RESULT_FIELDS:
            assert field in data, f"Missing field: {field}"

    def test_scan_barcode_stub_flag_is_true(self):
        response = client.post("/scan/barcode", json={"barcode": "012345678901"})
        assert response.json()["stub"] is True

    def test_scan_barcode_returns_at_least_one_item(self):
        response = client.post("/scan/barcode", json={"barcode": "012345678901"})
        assert len(response.json()["items"]) >= 1

    def test_scan_barcode_item_has_required_nutrition_fields(self):
        response = client.post("/scan/barcode", json={"barcode": "012345678901"})
        item = response.json()["items"][0]
        for field in REQUIRED_ITEM_FIELDS:
            assert field in item, f"Missing item field: {field}"

    def test_scan_barcode_scan_notes_mentions_stub(self):
        response = client.post("/scan/barcode", json={"barcode": "012345678901"})
        notes = response.json()["scanNotes"].lower()
        assert "stub" in notes

    def test_scan_barcode_missing_barcode_returns_422(self):
        response = client.post("/scan/barcode", json={})
        assert response.status_code == 422


class TestScanLabel:
    def test_scan_label_returns_200(self):
        response = client.post("/scan/label", json={"image_b64": "aGVsbG8="})
        assert response.status_code == 200

    def test_scan_label_has_required_fields(self):
        response = client.post("/scan/label", json={"image_b64": "aGVsbG8="})
        data = response.json()
        for field in REQUIRED_RESULT_FIELDS:
            assert field in data, f"Missing field: {field}"

    def test_scan_label_stub_flag_is_true(self):
        response = client.post("/scan/label", json={"image_b64": "aGVsbG8="})
        assert response.json()["stub"] is True

    def test_scan_label_returns_at_least_one_item(self):
        response = client.post("/scan/label", json={"image_b64": "aGVsbG8="})
        assert len(response.json()["items"]) >= 1

    def test_scan_label_item_has_required_nutrition_fields(self):
        response = client.post("/scan/label", json={"image_b64": "aGVsbG8="})
        item = response.json()["items"][0]
        for field in REQUIRED_ITEM_FIELDS:
            assert field in item, f"Missing item field: {field}"

    def test_scan_label_with_serving_quantity(self):
        """serving_quantity param is optional; passing it should be accepted."""
        response = client.post("/scan/label", json={
            "image_b64": "aGVsbG8=",
            "serving_quantity": 1.5,
        })
        assert response.status_code == 200

    def test_scan_label_scan_notes_mentions_stub(self):
        response = client.post("/scan/label", json={"image_b64": "aGVsbG8="})
        notes = response.json()["scanNotes"].lower()
        assert "stub" in notes
