"""
Antibiotic Risk Alert — FastAPI backend  (v2.0.0)

Loads the ExtraTrees ultra_v3 frozen bundle from final/ and exposes
doctor-first decision-support endpoints.

Doctor-first design principles:
  - antibiotic_misuse_risk  = stewardship / prescribing appropriateness concern
  - recommended_next_step   = clinical workflow action (urgency kept separate)
  - high misuse risk ≠ automatic urgent review (stewardship vs. clinical urgency)
"""

import logging
import sys
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Resolve project root and import final model service ──────────────────────
_PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(_PROJECT_ROOT))

from src.modeling.final_inference import FinalModelService  # noqa: E402

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger("antibiotic_api")

# ── Final model service (loaded once at startup) ──────────────────────────────
FINAL_BUNDLE_DIR = _PROJECT_ROOT / "final"

_service = FinalModelService(bundle_dir=FINAL_BUNDLE_DIR)
try:
    _service.load_bundle()
    logger.info("[startup] Final model service ready — bundle: %s",
                _service.model_metadata.get("bundle_name", "ultra_v3"))
except Exception as _exc:
    raise RuntimeError(f"Could not load final model bundle: {_exc}") from _exc

# ── Feature order — all_safe_v2, 38 features (from feature_info.json) ─────────
FEATURE_ORDER = [
    "temperature",      "heartrate",        "resprate",         "o2sat",
    "sbp",              "dbp",
    "temperature_mean", "temperature_max",
    "heartrate_mean",   "heartrate_max",
    "resprate_mean",    "resprate_max",
    "o2sat_mean",       "o2sat_min",
    "sbp_mean",         "dbp_mean",
    "vitals_count",
    "pain",             "acuity",           "pain_max",
    "visit_duration_hours",
    "medication_count", "diagnosis_count",
    "complaint_respiratory_flag", "complaint_fever_flag",
    "complaint_cough_flag",       "complaint_sore_throat_flag",
    "diagnosis_infectious_flag",  "diagnosis_respiratory_flag",
    "diagnosis_viral_like_flag",  "diagnosis_severe_flag",
    "medication_antibiotic_flag",
    "fever_flag",       "high_fever_flag",
    "low_spo2_flag",    "tachycardia_flag",
    "tachypnea_flag",   "short_visit_flag",
]

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="Antibiotic Risk Alert API",
    description=(
        "Doctor-first decision-support system for antibiotic stewardship. "
        "Predicts antibiotic misuse risk — NOT a diagnosis or prescription engine."
    ),
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],           # tighten in production
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ── Request schema ────────────────────────────────────────────────────────────
class PatientData(BaseModel):
    # Patient demographics
    patient_id:               str            = ""
    age:                      Optional[float] = None
    sex:                      str            = ""
    # Symptoms (yes / no / "")
    fever:                    str            = ""
    cough:                    str            = ""
    sore_throat:              str            = ""
    runny_nose:               str            = ""
    symptom_duration_days:    Optional[int]  = None
    # Clinical context
    recent_antibiotic_use:    str            = ""
    antibiotic_allergy:       str            = ""
    suspected_infection_type: str            = ""
    WBC_count:                Optional[float] = None
    CRP_level:                Optional[float] = None
    # Vitals (temperature in °C; spo2 / pulse_rate / o2sat / heartrate supported)
    spo2:                     Optional[float] = None    # alias → o2sat
    o2sat:                    Optional[float] = None
    pulse_rate:               Optional[float] = None    # alias → heartrate
    heartrate:                Optional[float] = None
    temperature:              Optional[float] = None
    # Optional extras
    sbp:                      Optional[float] = None
    dbp:                      Optional[float] = None
    acuity:                   Optional[float] = None
    prior_antibiotic_use:     str            = ""      # alias for recent_antibiotic_use
    allergy_history:          str            = ""      # alias for antibiotic_allergy


# ── Field normalisation helpers ───────────────────────────────────────────────
def _resolve(primary, *aliases, default=None):
    """Return first non-None value from primary and aliases, else default."""
    for v in (primary, *aliases):
        if v is not None:
            return v
    return default


def _yes(val: str) -> bool:
    return str(val).strip().lower() == "yes"


# ── Feature engineering ───────────────────────────────────────────────────────
def engineer_features(d: PatientData) -> dict:
    """
    Map simplified patient form fields to the 38 all_safe_v2 features.
    Returns a plain dict; missing fields are left as NaN for the imputer.
    """
    # ── Normalise aliased field names ────────────────────────────────────────
    temp     = _resolve(d.temperature, default=None)
    hr       = _resolve(d.heartrate, d.pulse_rate, default=None)
    spo2_val = _resolve(d.o2sat, d.spo2, default=None)
    recent_abx = _yes(d.recent_antibiotic_use) or _yes(d.prior_antibiotic_use)
    crp      = d.CRP_level   # may be None
    wbc      = d.WBC_count   # may be None
    dur      = d.symptom_duration_days or 1

    # Use safe sentinel defaults only for derived flags (not for model features)
    temp_val    = temp     if temp     is not None else 37.0
    hr_val      = hr       if hr       is not None else 75.0
    spo2_num    = spo2_val if spo2_val is not None else 98.0
    crp_val     = crp      if crp      is not None else 0.0

    # ── Binary flags ─────────────────────────────────────────────────────────
    fever_flag         = int(_yes(d.fever) or temp_val >= 38.0)
    high_fever_flag    = int(temp_val >= 39.0)
    tachycardia_flag   = int(hr_val > 100)
    low_spo2_flag      = int(spo2_num < 94)

    complaint_fever_flag       = int(_yes(d.fever))
    complaint_cough_flag       = int(_yes(d.cough))
    complaint_sore_throat_flag = int(_yes(d.sore_throat))
    complaint_respiratory_flag = int(_yes(d.cough) or _yes(d.sore_throat))

    infection = d.suspected_infection_type.lower().strip()
    diagnosis_infectious_flag  = int(infection in ("bacterial", "viral"))
    diagnosis_respiratory_flag = int(_yes(d.cough) or _yes(d.sore_throat))
    diagnosis_viral_like_flag  = int(infection == "viral")
    diagnosis_severe_flag      = int(infection == "bacterial" and crp_val > 10)

    medication_antibiotic_flag = int(recent_abx)

    tachypnea_flag = int(complaint_respiratory_flag == 1 and _yes(d.cough))

    # ── Resprate estimate ────────────────────────────────────────────────────
    resprate = 18.0
    if tachypnea_flag:
        resprate = 26.0
    elif complaint_respiratory_flag:
        resprate = 22.0

    # ── Acuity (1=highest urgency … 5=lowest) ────────────────────────────────
    if d.acuity is not None:
        acuity = float(d.acuity)
    elif high_fever_flag or low_spo2_flag or (tachycardia_flag and spo2_num < 95):
        acuity = 2.0
    elif fever_flag or complaint_respiratory_flag or tachycardia_flag:
        acuity = 3.0
    else:
        acuity = 4.0

    # ── BP ────────────────────────────────────────────────────────────────────
    sbp = float(d.sbp) if d.sbp is not None else 120.0
    dbp = float(d.dbp) if d.dbp is not None else 80.0

    # ── Pain proxy from symptoms ──────────────────────────────────────────────
    pain = 0.0
    if _yes(d.fever):       pain += 3.0
    if _yes(d.sore_throat): pain += 2.0
    if _yes(d.cough):       pain += 1.0

    # ── Visit / count features ────────────────────────────────────────────────
    visit_duration_hours = min(float(dur) * 0.5 + 2.0, 24.0)
    medication_count     = float(medication_antibiotic_flag)
    diagnosis_count      = float(1 if infection in ("bacterial", "viral") else 0)
    vitals_count         = 1.0
    short_visit_flag     = int(dur <= 1)

    # ── Missing-value handling ────────────────────────────────────────────────
    # Use actual sensor values when available; NaN otherwise (imputer fills in)
    temp_feat    = temp     if temp     is not None else np.nan
    hr_feat      = hr       if hr       is not None else np.nan
    spo2_feat    = spo2_val if spo2_val is not None else np.nan

    sparse_fields = [temp, hr, spo2_val, crp, wbc]
    missing_count = sum(v is None for v in sparse_fields)
    if missing_count >= 4:
        logger.warning("[engineer_features] Sparse input — %d/5 optional fields missing", missing_count)

    # ── Assemble feature dict (all_safe_v2 — 38 features) ────────────────────
    return {
        # Raw vitals (NaN when not provided — imputer handles)
        "temperature":     temp_feat,
        "heartrate":       hr_feat,
        "resprate":        resprate,
        "o2sat":           spo2_feat,
        "sbp":             sbp,
        "dbp":             dbp,
        # Aggregated vitals (single-visit proxy)
        "temperature_mean": temp_feat,
        "temperature_max":  temp_feat,
        "heartrate_mean":   hr_feat,
        "heartrate_max":    hr_feat,
        "resprate_mean":    resprate,
        "resprate_max":     resprate,
        "o2sat_mean":       spo2_feat,
        "o2sat_min":        spo2_feat,
        "sbp_mean":         sbp,
        "dbp_mean":         dbp,
        # Counts / visit
        "vitals_count":           vitals_count,
        "pain":                   pain,
        "acuity":                 acuity,
        "pain_max":               pain,
        "visit_duration_hours":   visit_duration_hours,
        "medication_count":       medication_count,
        "diagnosis_count":        diagnosis_count,
        # Complaint / diagnosis / medication flags
        "complaint_respiratory_flag": float(complaint_respiratory_flag),
        "complaint_fever_flag":       float(complaint_fever_flag),
        "complaint_cough_flag":       float(complaint_cough_flag),
        "complaint_sore_throat_flag": float(complaint_sore_throat_flag),
        "diagnosis_infectious_flag":  float(diagnosis_infectious_flag),
        "diagnosis_respiratory_flag": float(diagnosis_respiratory_flag),
        "diagnosis_viral_like_flag":  float(diagnosis_viral_like_flag),
        "diagnosis_severe_flag":      float(diagnosis_severe_flag),
        "medication_antibiotic_flag": float(medication_antibiotic_flag),
        # Clinical flags
        "fever_flag":      float(fever_flag),
        "high_fever_flag": float(high_fever_flag),
        "low_spo2_flag":   float(low_spo2_flag),
        "tachycardia_flag": float(tachycardia_flag),
        "tachypnea_flag":  float(tachypnea_flag),
        "short_visit_flag": float(short_visit_flag),
    }


# ── Health endpoint ───────────────────────────────────────────────────────────
@app.get("/health")
def health():
    meta = _service.model_metadata
    return {
        "status":        "ok",
        "model_loaded":  _service.loaded,
        "bundle_name":   meta.get("bundle_name"),
        "model_type":    meta.get("model_type"),
        "feature_set":   meta.get("feature_set"),
        "n_features":    meta.get("n_features"),
        "classes":       meta.get("classes"),
        "high_threshold": meta.get("high_threshold"),
    }


# ── Model info endpoint ────────────────────────────────────────────────────────
@app.get("/model-info")
def model_info():
    meta = _service.model_metadata
    return {
        "bundle_name":    meta.get("bundle_name"),
        "model_type":     meta.get("model_type"),
        "feature_set":    meta.get("feature_set"),
        "n_features":     meta.get("n_features"),
        "classes":        meta.get("classes"),
        "high_threshold": meta.get("high_threshold"),
        "tuning_method":  meta.get("tuning_method"),
        "frozen_at":      meta.get("frozen_at"),
        "test_metrics":   meta.get("test_metrics", {}),
        "features":       _service.feature_names,
    }


# ── Core prediction — final model (POST /predict) ────────────────────────────
@app.post("/predict")
def predict_final(data: PatientData):
    """
    Primary prediction endpoint using the final ExtraTrees ultra_v3 model.

    Returns a doctor-first response with antibiotic misuse risk,
    clinical pattern, recommended next step, confidence, and reasons.
    """
    try:
        features = engineer_features(data)
        result   = _service.predict(features)
        logger.info(
            "[/predict] patient=%s risk=%s next_step=%s band=%s",
            data.patient_id or "anon",
            result["antibiotic_misuse_risk"],
            result["recommended_next_step"],
            result["confidence_band"],
        )
        return result
    except ValueError as exc:
        logger.warning("[/predict] Validation error: %s", exc)
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("[/predict] Prediction failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ── Backward-compatible alias (POST /api/predict) ────────────────────────────
@app.post("/api/predict")
def predict_api(data: PatientData):
    """
    Backward-compatible alias for /predict.

    Returns the final model response format.
    (Previously returned the medium model format — now upgraded to final model.)
    """
    return predict_final(data)


# ─────────────────────────────────────────────────────────────────────────────
# Rule-based specialty endpoints (no ML model — unchanged from v1.0.0)
# ─────────────────────────────────────────────────────────────────────────────

# ── Respiratory Infection Prediction ─────────────────────────────────────────
class RespiratoryData(BaseModel):
    age:               Optional[float] = None
    temperature:       Optional[float] = None
    oxygen_saturation: Optional[float] = None
    cough:             str = ""
    cough_type:        str = ""   # dry | productive | none
    dyspnea:           str = ""
    chest_pain:        str = ""
    duration_days:     Optional[int]   = None


@app.post("/api/predict/respiratory")
def predict_respiratory(d: RespiratoryData):
    temp = d.temperature       or 37.0
    spo2 = d.oxygen_saturation or 98.0
    dur  = d.duration_days     or 1
    age  = d.age               or 35.0

    score = 25
    if temp >= 39.0:                  score += 22
    elif temp >= 38.0:                score += 10
    if spo2 < 92:                     score += 28
    elif spo2 < 95:                   score += 16
    if d.dyspnea    == "yes":         score += 18
    if d.chest_pain == "yes":         score += 14
    if d.cough_type == "productive":  score += 12
    if d.cough      == "yes":         score += 5
    if dur >= 7:                      score += 10
    elif dur >= 5:                    score += 5
    if age > 65 or age < 5:           score += 8
    score = max(5, min(98, score))

    if spo2 < 95 or (d.dyspnea == "yes" and d.cough_type == "productive"):
        diagnosis, antibiotic = "Pneumonia", True
    elif dur >= 5 and d.cough == "yes" and d.cough_type == "productive":
        diagnosis, antibiotic = "Acute Bronchitis", score >= 58
    elif d.chest_pain == "yes" and temp >= 38.5:
        diagnosis, antibiotic = "Possible Pneumonia", True
    elif temp >= 38.5 and d.cough == "yes":
        diagnosis, antibiotic = "Strep / Bacterial URTI", True
    else:
        diagnosis, antibiotic = "Viral URI", False

    level      = "Low" if score < 38 else "Medium" if score < 68 else "High"
    confidence = min(95, 60 + int(abs(score - 50) * 0.6))

    reasons = []
    if temp >= 39.0:              reasons.append(f"High fever ({temp:.1f} \u00b0C) \u2014 likely bacterial")
    elif temp >= 38.0:            reasons.append(f"Fever ({temp:.1f} \u00b0C) detected")
    if spo2 < 95:                 reasons.append(f"SpO\u2082 {spo2:.1f}% \u2014 respiratory compromise")
    if d.dyspnea    == "yes":     reasons.append("Dyspnea present \u2014 lower tract involvement")
    if d.chest_pain == "yes":     reasons.append("Chest pain \u2014 rule out pneumonia / pleuritis")
    if d.cough_type == "productive": reasons.append("Productive cough \u2014 bacterial marker")
    if dur >= 7:                  reasons.append(f"Symptoms persisting {dur} days")
    if age > 65:                  reasons.append("Age > 65 \u2014 elevated complication risk")
    if not reasons:               reasons.append("Mild upper respiratory presentation")

    action = {
        "Low":    "Rest, fluids, monitor for 48 h",
        "Medium": "GP consultation within 24 h",
        "High":   "Chest X-ray + urgent clinical review",
    }[level]

    return {
        "score": score, "level": level, "confidence": confidence,
        "diagnosis": diagnosis, "antibiotic_recommended": antibiotic,
        "reasons": reasons[:5], "action": action,
    }


# ── Fever Risk Analysis ───────────────────────────────────────────────────────
class FeverData(BaseModel):
    age:                 Optional[float] = None
    temperature:         Optional[float] = None
    fever_duration_days: Optional[int]   = None
    fever_pattern:       str = ""   # continuous | intermittent | remittent
    chills:              str = ""
    rash:                str = ""
    recent_travel:       str = ""
    WBC_count:           Optional[float] = None


@app.post("/api/predict/fever")
def predict_fever(d: FeverData):
    temp = d.temperature         or 37.0
    dur  = d.fever_duration_days or 1
    age  = d.age                 or 35.0
    wbc  = d.WBC_count           or 8.0

    score = 20
    if temp >= 40.0:                       score += 30
    elif temp >= 39.0:                     score += 20
    elif temp >= 38.0:                     score += 10
    if dur >= 7:                           score += 20
    elif dur >= 5:                         score += 10
    if d.chills       == "yes":            score += 10
    if d.rash         == "yes":            score += 15
    if d.recent_travel == "yes":           score += 12
    if d.fever_pattern == "intermittent":  score += 8
    if wbc > 12:                           score += 12
    elif wbc < 4:                          score += 8
    if age > 65 or age < 5:               score += 8
    score = max(5, min(98, score))

    if d.rash == "yes" and d.recent_travel == "yes":
        fever_type = "Possible Dengue / Tropical Fever"
    elif d.fever_pattern == "intermittent" and d.recent_travel == "yes":
        fever_type = "Possible Malaria / Typhoid"
    elif wbc > 12 and d.chills == "yes":
        fever_type = "Bacterial Fever"
    elif wbc < 5 and d.rash == "no":
        fever_type = "Viral Fever"
    elif dur >= 7:
        fever_type = "Prolonged Fever \u2014 investigate"
    else:
        fever_type = "Undifferentiated Fever"

    level      = "Low" if score < 38 else "Medium" if score < 68 else "High"
    confidence = min(95, 58 + int(abs(score - 50) * 0.65))

    reasons = []
    if temp >= 40.0:              reasons.append(f"Very high fever ({temp:.1f} \u00b0C) \u2014 urgent")
    elif temp >= 39.0:            reasons.append(f"High fever ({temp:.1f} \u00b0C)")
    if dur >= 7:                  reasons.append(f"Fever persisting {dur} days \u2014 further workup needed")
    if d.chills       == "yes":   reasons.append("Rigors / chills \u2014 possible bacteraemia")
    if d.rash         == "yes":   reasons.append("Rash present \u2014 dengue / viral aetiology")
    if d.recent_travel == "yes":  reasons.append("Recent travel \u2014 tropical infection risk")
    if d.fever_pattern == "intermittent": reasons.append("Intermittent pattern \u2014 malaria screen advised")
    if wbc > 12:                  reasons.append(f"WBC {wbc:.1f} \u00d710\u00b3/\u03bcL \u2014 leukocytosis (bacterial)")
    elif wbc < 4:                 reasons.append(f"WBC {wbc:.1f} \u00d710\u00b3/\u03bcL \u2014 leukopenia (viral)")
    if not reasons:               reasons.append("Mild undifferentiated febrile illness")

    action = {
        "Low":    "Antipyretics, hydration, observe 48 h",
        "Medium": "CBC + blood cultures + clinical review",
        "High":   "Hospitalisation workup \u2014 CBC, culture, malaria screen",
    }[level]

    return {
        "score": score, "level": level, "confidence": confidence,
        "fever_type": fever_type, "reasons": reasons[:5], "action": action,
    }


# ── Viral vs Bacterial Analysis ───────────────────────────────────────────────
class ViralBacterialData(BaseModel):
    age:                   Optional[float] = None
    temperature:           Optional[float] = None
    WBC_count:             Optional[float] = None
    CRP_level:             Optional[float] = None
    symptom_onset:         str = ""   # rapid | gradual
    sore_throat:           str = ""
    runny_nose:            str = ""
    muscle_aches:          str = ""
    recent_antibiotic_use: str = ""


@app.post("/api/predict/viral-bacterial")
def predict_viral_bacterial(d: ViralBacterialData):
    temp = d.temperature or 37.5
    wbc  = d.WBC_count   or 8.0
    crp  = d.CRP_level   or 0.0

    b_score = 0.0
    if temp >= 39.0:                       b_score += 15
    elif temp >= 38.5:                     b_score += 8
    if wbc > 12:                           b_score += 25
    elif wbc > 10:                         b_score += 12
    elif wbc < 5:                          b_score -= 15
    if crp > 10:                           b_score += 20
    elif crp > 5:                          b_score += 10
    if d.symptom_onset    == "rapid":      b_score -= 10
    elif d.symptom_onset  == "gradual":    b_score += 8
    if d.sore_throat      == "yes":        b_score += 8
    if d.runny_nose       == "yes":        b_score -= 12
    if d.muscle_aches     == "yes":        b_score -= 8
    if d.recent_antibiotic_use == "yes":   b_score -= 5

    score = int(max(5, min(98, 50 + b_score)))
    classification = "Bacterial" if score >= 58 else "Viral" if score <= 42 else "Uncertain"
    level          = "High" if score >= 68 or score <= 25 else "Medium" if 43 <= score <= 67 else "Low"
    confidence     = min(95, int(abs(b_score) * 1.5 + 55))

    reasons = []
    if wbc > 12:   reasons.append(f"WBC {wbc:.1f} \u00d710\u00b3/\u03bcL \u2014 leukocytosis (bacterial)")
    elif wbc < 5:  reasons.append(f"WBC {wbc:.1f} \u00d710\u00b3/\u03bcL \u2014 leukopenia (viral)")
    if crp > 10:   reasons.append(f"CRP {crp:.1f} mg/L \u2014 elevated (bacterial marker)")
    elif crp <= 5: reasons.append(f"CRP {crp:.1f} mg/L \u2014 normal (viral likely)")
    if d.runny_nose   == "yes": reasons.append("Rhinorrhoea \u2014 typical viral sign")
    if d.muscle_aches == "yes": reasons.append("Myalgia \u2014 viral pattern")
    if temp >= 39.0:            reasons.append(f"High fever ({temp:.1f} \u00b0C)")
    if d.symptom_onset == "rapid":   reasons.append("Rapid onset (< 24 h) \u2014 viral pattern")
    elif d.symptom_onset == "gradual": reasons.append("Gradual onset \u2014 bacterial pattern")
    if not reasons: reasons.append("Insufficient markers for definitive classification")

    action = {
        "Bacterial": "Antibiotic therapy recommended after culture confirmation",
        "Viral":     "Supportive care \u2014 antibiotics not indicated",
        "Uncertain": "Further labs: CRP, blood culture, throat swab",
    }[classification]

    return {
        "score": score, "level": level, "confidence": confidence,
        "classification": classification, "reasons": reasons[:5],
        "action": action,
        "markers": {"WBC": round(wbc, 1), "CRP": round(crp, 1), "temperature": round(temp, 1)},
    }


# ── Antibiotic Misuse Risk Checker ────────────────────────────────────────────
class MisuseData(BaseModel):
    antibiotic_name:      str = ""
    prescribed_by:        str = ""   # doctor | pharmacist | self | online
    dose_completion:      str = ""   # complete | incomplete | ongoing
    courses_last_year:    Optional[int] = None
    indication_confirmed: str = ""   # yes | no | unsure
    shared_with_others:   str = ""


@app.post("/api/predict/misuse")
def predict_misuse(d: MisuseData):
    score = 10
    if d.prescribed_by        == "self":        score += 35
    elif d.prescribed_by      == "online":       score += 28
    elif d.prescribed_by      == "pharmacist":   score += 18
    if d.dose_completion      == "incomplete":   score += 20
    if d.indication_confirmed == "no":           score += 25
    elif d.indication_confirmed == "unsure":     score += 10
    if d.shared_with_others   == "yes":          score += 30
    courses = d.courses_last_year or 0
    if courses >= 4:   score += 20
    elif courses >= 2: score += 10
    score = max(5, min(98, score))

    level           = "Low" if score < 38 else "Medium" if score < 68 else "High"
    confidence      = min(95, 70 + int(score * 0.2))
    resistance_risk = "Critical" if score >= 75 else "High" if score >= 55 else "Moderate" if score >= 35 else "Low"

    flags = []
    if d.prescribed_by in ("self", "online"):
        flags.append("Self / online prescription \u2014 no clinical diagnosis made")
    if d.prescribed_by == "pharmacist":
        flags.append("Dispensed by pharmacist without prescription")
    if d.dose_completion == "incomplete":
        flags.append("Incomplete course \u2014 promotes resistance selection")
    if d.indication_confirmed == "no":
        flags.append("Indication not clinically confirmed")
    if d.shared_with_others == "yes":
        flags.append("Shared antibiotics \u2014 unauthorised use detected")
    if courses >= 4:
        flags.append(f"{courses} antibiotic courses in last year \u2014 overuse pattern")
    if not flags:
        flags.append("No critical misuse patterns detected")

    recommendations = []
    if d.prescribed_by == "self":
        recommendations.append("Always consult a doctor before starting antibiotics")
    if d.dose_completion == "incomplete":
        recommendations.append("Complete the full antibiotic course even if feeling better")
    if d.shared_with_others == "yes":
        recommendations.append("Never share antibiotics \u2014 dosage is patient-specific")
    if courses >= 3:
        recommendations.append("Consult an infectious disease specialist for resistance screening")
    recommendations.append("Report all antibiotic use to your doctor at every visit")

    ab = (d.antibiotic_name or "").lower()
    alternatives = []
    if d.indication_confirmed in ("no", "unsure"):
        alternatives.append(
            "Consult a certified doctor first \u2014 a proper diagnosis may confirm antibiotics are unnecessary"
        )
    alternatives.append(
        "Rest and increase fluid intake (2\u20133 L/day) \u2014 the most effective first-line treatment for most viral infections"
    )
    alternatives.append(
        "Paracetamol 500\u20131000\u202fmg every 6\u202fh (or Ibuprofen 400\u202fmg every 8\u202fh) to relieve fever and pain"
    )
    if any(x in ab for x in ["amox", "penicil", "augmen", "azithro", "doxycycl", "clarithro", "cephalex"]):
        alternatives += [
            "Warm saline gargle (\u00bc tsp salt in 250\u202fmL warm water) 3\u00d7 daily to soothe sore throat",
            "Steam inhalation 10\u201315\u202fmin twice daily with eucalyptus oil for nasal / sinus congestion",
            "Honey + warm lemon water \u2014 clinically shown to reduce cough severity (suitable for age \u2265 1\u202fyr)",
            "Vitamin\u202fC 500\u20131000\u202fmg + Zinc 10\u201315\u202fmg daily to shorten illness duration",
        ]
    elif any(x in ab for x in ["metro", "tinidaz", "cipro", "levo", "norflo"]):
        alternatives += [
            "Probiotics (Lactobacillus acidophilus / Bifidobacterium) to restore healthy gut microbiome",
            "Oral Rehydration Salts (ORS) if GI symptoms such as diarrhoea or nausea are present",
            "Increase fluid intake to \u2265 2.5\u202fL/day to support urinary tract flushing",
            "Cranberry extract supplements \u2014 evidence-based for prevention of recurrent mild UTIs",
        ]
    else:
        alternatives += [
            "Saline nasal rinse (Neti pot or squeeze bottle) for upper respiratory congestion",
            "Honey-based lozenges or OTC throat spray for throat irritation and mild pain",
            "Vitamin\u202fC 500\u20131000\u202fmg + Zinc lozenges to enhance innate immune response",
            "Probiotic supplements to maintain healthy microbiome balance during illness",
        ]
    alternatives.append(
        "Monitor symptoms for 48\u201372\u202fh; seek medical review if no improvement or if temperature exceeds 39\u202f\u00b0C"
    )

    return {
        "score": score, "level": level, "confidence": confidence,
        "resistance_risk": resistance_risk,
        "flags": flags[:5], "recommendations": recommendations[:4],
        "alternatives": alternatives[:6],
        "action": f"Resistance risk: {resistance_risk} \u2014 review antibiotic stewardship protocols",
    }


# ── Osteoporosis Risk Prediction ──────────────────────────────────────────────
class OsteoporosisData(BaseModel):
    age:               Optional[float] = None
    sex:               str = ""      # female | male
    bmi:               Optional[float] = None
    menopause:         str = ""      # yes | no | na
    previous_fracture: str = ""      # yes | no
    family_history:    str = ""      # yes | no
    steroid_use:       str = ""      # yes | no
    smoking:           str = ""      # yes | no
    t_score:           Optional[float] = None


@app.post("/api/predict/osteoporosis")
def predict_osteoporosis(d: OsteoporosisData):
    age = d.age or 50.0
    bmi = d.bmi or 22.0

    score = 15
    if age >= 70:                        score += 25
    elif age >= 60:                      score += 15
    elif age >= 50:                      score += 8
    if d.sex               == "female":  score += 12
    if bmi < 18.5:                       score += 15
    elif bmi < 22.0:                     score += 5
    if d.menopause         == "yes":     score += 15
    if d.previous_fracture == "yes":     score += 20
    if d.family_history    == "yes":     score += 12
    if d.steroid_use       == "yes":     score += 18
    if d.smoking           == "yes":     score += 8
    if d.t_score is not None:
        if d.t_score <= -2.5:            score += 30
        elif d.t_score <= -1.0:          score += 15
    score = max(5, min(98, score))

    if d.t_score is not None and d.t_score <= -2.5:
        risk_category = "Osteoporosis \u2014 T-score confirmed"
    elif d.t_score is not None and d.t_score <= -1.0:
        risk_category = "Osteopenia \u2014 monitor closely"
    elif score >= 68:
        risk_category = "High-risk Osteoporosis Candidate"
    elif score >= 38:
        risk_category = "Moderate Fracture Risk"
    else:
        risk_category = "Low Osteoporosis Risk"

    base = 3.0
    if age >= 70:                        base += 8
    elif age >= 60:                      base += 4
    elif age >= 50:                      base += 2
    if d.sex               == "female":  base += 3
    if d.previous_fracture == "yes":     base += 6
    if d.family_history    == "yes":     base += 3
    if d.steroid_use       == "yes":     base += 4
    if d.t_score is not None and d.t_score <= -2.5:  base += 10
    elif d.t_score is not None and d.t_score <= -1.0: base += 5
    fracture_risk_10yr = min(95, int(base))

    level      = "Low" if score < 38 else "Medium" if score < 68 else "High"
    confidence = min(92, 60 + int(abs(score - 50) * 0.55))

    reasons = []
    if age >= 70:                    reasons.append(f"Age {int(age)} \u2014 very high osteoporosis risk zone")
    elif age >= 60:                  reasons.append(f"Age {int(age)} \u2014 elevated bone loss risk")
    elif age >= 50:                  reasons.append(f"Age {int(age)} \u2014 bone density monitoring recommended")
    if d.sex == "female":            reasons.append("Female sex \u2014 accelerated bone loss after menopause")
    if bmi < 18.5:                   reasons.append(f"Low BMI ({bmi:.1f}) \u2014 reduced bone mass")
    if d.menopause == "yes":         reasons.append("Post-menopausal \u2014 oestrogen loss accelerates bone resorption")
    if d.previous_fracture == "yes": reasons.append("Previous fragility fracture \u2014 strongest predictor of future fractures")
    if d.family_history == "yes":    reasons.append("Family history of osteoporosis / hip fracture")
    if d.steroid_use == "yes":       reasons.append("Long-term corticosteroid use \u2014 reduces bone mineral density")
    if d.smoking == "yes":           reasons.append("Smoking \u2014 impairs osteoblast activity and bone formation")
    if d.t_score is not None and d.t_score <= -2.5:
        reasons.append(f"T-score {d.t_score:.1f} \u2014 meets WHO criteria for osteoporosis")
    elif d.t_score is not None and d.t_score <= -1.0:
        reasons.append(f"T-score {d.t_score:.1f} \u2014 osteopenia range")
    if not reasons:
        reasons.append("No major osteoporosis risk factors identified at this time")

    action = {
        "Low":    "Standard bone health advice; DEXA scan at age 65+ or per clinical guideline",
        "Medium": "DEXA bone density scan recommended; review calcium and vitamin D intake",
        "High":   "Urgent DEXA scan + specialist referral; evaluate anti-resorptive therapy",
    }[level]

    return {
        "score": score, "level": level, "confidence": confidence,
        "risk_category": risk_category,
        "fracture_risk_10yr": fracture_risk_10yr,
        "reasons": reasons[:5], "action": action,
    }
