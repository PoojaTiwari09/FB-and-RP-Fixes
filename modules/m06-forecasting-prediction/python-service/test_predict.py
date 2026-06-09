"""
FEATURE 8 — Python Prediction Engine Tests
Framework: Pytest + httpx (FastAPI TestClient)

Run: cd python-service && pytest test_predict.py -v
"""
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

BASE_PAYLOAD = {
    "tenantId": "test-tenant",
    "periodId": "period-1",
    "openPipeline": [
        {"stage": "Proposal", "amount": 8000000},
        {"stage": "Negotiation", "amount": 12000000},
        {"stage": "Discovery", "amount": 5000000},
    ],
    "closedWonAmount": 50000000,
    "historicalRates": [
        {"fromStage": "Proposal", "toStage": "Negotiation", "rate": 0.58, "sampleSize": 60},
        {"fromStage": "Negotiation", "toStage": "Closed", "rate": 0.74, "sampleSize": 55},
        {"fromStage": "Discovery", "toStage": "Proposal", "rate": 0.20, "sampleSize": 80},
    ],
    "historicalExpectedDealRate": 0.124,
    "totalAddressablePipeline": 126600000,
}


class TestPredictEndpoint:
    """TC-F8-01 through TC-F8-06"""

    def test_f8_01_returns_predicted_amount(self):
        """TC-F8-01 — /predict returns a valid prediction with pipeline weighting"""
        resp = client.post("/predict", json=BASE_PAYLOAD)
        assert resp.status_code == 200
        body = resp.json()
        assert body["predictedAmount"] > BASE_PAYLOAD["closedWonAmount"]
        assert "modelInputs" in body

    def test_f8_04_confidence_range_bounds(self):
        """TC-F8-04 — confidenceRangeLow < predicted < confidenceRangeHigh"""
        resp = client.post("/predict", json=BASE_PAYLOAD)
        body = resp.json()
        assert body["confidenceRangeLow"] < body["predictedAmount"]
        assert body["confidenceRangeHigh"] > body["predictedAmount"]

    def test_f8_06_model_inputs_has_fallback_applied_key(self):
        """TC-F8-06 — modelInputs includes fallbackApplied boolean"""
        resp = client.post("/predict", json=BASE_PAYLOAD)
        body = resp.json()
        assert "fallbackApplied" in body["modelInputs"]
        assert isinstance(body["modelInputs"]["fallbackApplied"], bool)

    def test_f8_03_no_fallback_when_sample_sufficient(self):
        """TC-F8-03 — fallbackApplied is False when sampleSize >= 50"""
        resp = client.post("/predict", json=BASE_PAYLOAD)
        body = resp.json()
        # All rates have sampleSize >= 55
        assert body["modelInputs"]["fallbackApplied"] is False

    def test_predict_with_empty_pipeline(self):
        """Edge case — empty pipeline still returns valid prediction"""
        payload = {**BASE_PAYLOAD, "openPipeline": []}
        resp = client.post("/predict", json=payload)
        assert resp.status_code == 200
        body = resp.json()
        # With no pipeline, predicted should be closedWon + expectedDeals contribution
        assert body["predictedAmount"] >= BASE_PAYLOAD["closedWonAmount"]


class TestExplainEndpoint:
    def test_explain_returns_summary(self):
        resp = client.post("/explain", json={"modelInputs": {"test": True}})
        assert resp.status_code == 200
        body = resp.json()
        assert "summary" in body
        assert "details" in body
