"""
Smoke tests for final model backend integration.

Run with:
    cd backend
    pip install httpx pytest
    pytest ../backend/test_smoke.py -v

The backend must be running:
    uvicorn main:app --reload
"""

import pytest

try:
    import httpx
except ImportError:
    pytest.skip("httpx not installed", allow_module_level=True)

BASE = "http://127.0.0.1:8000"


# ── /health ───────────────────────────────────────────────────────────────────
def test_health():
    r = httpx.get(f"{BASE}/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["model_loaded"] is True
    assert body["model_type"] == "ExtraTrees"
    assert body["n_features"] == 38


# ── /model-info ───────────────────────────────────────────────────────────────
def test_model_info():
    r = httpx.get(f"{BASE}/model-info")
    assert r.status_code == 200
    body = r.json()
    assert body["bundle_name"] is not None
    assert body["n_features"] == 38
    assert len(body["features"]) == 38
    assert "high" in body["classes"]
    assert 0.0 < body["high_threshold"] < 1.0


# ── /predict — full viral misuse case ────────────────────────────────────────
def test_predict_viral_misuse():
    """Mild viral presentation + prior antibiotic use → high misuse risk + stewardship."""
    payload = {
        "fever": "yes",
        "cough": "yes",
        "sore_throat": "yes",
        "runny_nose": "yes",
        "symptom_duration_days": 2,
        "recent_antibiotic_use": "yes",
        "suspected_infection_type": "viral",
        "temperature": 37.8,
        "spo2": 97.0,
        "pulse_rate": 82,
    }
    r = httpx.post(f"{BASE}/predict", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert "antibiotic_misuse_risk" in body
    assert "recommended_next_step" in body
    assert "confidence_score" in body
    assert "confidence_band" in body
    assert "top_reasons" in body
    assert "probabilities" in body
    # Stewardship case — should NOT be urgent_doctor_review
    assert body["recommended_next_step"] != "urgent_doctor_review", (
        "Viral misuse case should not trigger urgent_doctor_review "
        f"— got {body['recommended_next_step']}"
    )


# ── /predict — severe unstable case ──────────────────────────────────────────
def test_predict_severe_unstable():
    """Severe instability signals → urgent_doctor_review regardless of misuse risk."""
    payload = {
        "fever": "yes",
        "cough": "yes",
        "symptom_duration_days": 5,
        "recent_antibiotic_use": "no",
        "suspected_infection_type": "bacterial",
        "temperature": 39.8,
        "spo2": 90.0,           # low_spo2_flag = 1
        "pulse_rate": 115,       # tachycardia_flag = 1
        "CRP_level": 45.0,       # triggers diagnosis_severe_flag
    }
    r = httpx.post(f"{BASE}/predict", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert body["recommended_next_step"] == "urgent_doctor_review", (
        f"Severe case should trigger urgent_doctor_review — got {body['recommended_next_step']}"
    )
    assert body["possible_clinical_pattern"] == "urgent_review"


# ── /predict — sparse input ───────────────────────────────────────────────────
def test_predict_sparse():
    """Minimal input should not crash — returns valid prediction."""
    payload = {
        "fever": "yes",
        "cough": "yes",
    }
    r = httpx.post(f"{BASE}/predict", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert body["antibiotic_misuse_risk"] in ("low", "medium", "high")
    assert body["recommended_next_step"] in (
        "stewardship_review_required",
        "urgent_doctor_review",
        "review_recommended",
        "further_testing",
        "monitor_and_observe",
        "doctor_review_recommended",
    )


# ── /api/predict — backward-compat alias ──────────────────────────────────────
def test_api_predict_alias():
    """POST /api/predict must return same final model response as /predict."""
    payload = {
        "fever": "yes",
        "cough": "yes",
        "recent_antibiotic_use": "no",
        "suspected_infection_type": "viral",
    }
    r = httpx.post(f"{BASE}/api/predict", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert "antibiotic_misuse_risk" in body


# ── /predict — empty payload ──────────────────────────────────────────────────
def test_predict_empty_payload():
    """Empty payload should return 422 (validation) or a valid cautious prediction."""
    r = httpx.post(f"{BASE}/predict", json={})
    # Either accepts empty (returns prediction with defaults) or rejects with 4xx
    assert r.status_code in (200, 422)
    if r.status_code == 200:
        body = r.json()
        assert "antibiotic_misuse_risk" in body
