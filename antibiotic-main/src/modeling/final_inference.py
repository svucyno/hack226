"""
Final inference module — AI Antibiotic Misuse Risk Alert System
ExtraTrees ultra_v3 frozen bundle (all_safe_v2, 38 features)

This module is the ONLY authorised inference path for the final deployment.
Do not modify model weights or frozen artifacts.

Doctor-first design:
  antibiotic_misuse_risk  = stewardship / prescribing appropriateness concern
  recommended_next_step   = clinical workflow action (urgent review kept separate)
"""

import json
import logging
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# Default bundle path: <project_root>/final/
_HERE = Path(__file__).parent                  # src/modeling/
DEFAULT_BUNDLE_DIR = _HERE.parent.parent / "final"


class FinalModelService:
    """
    Loads and serves the frozen ExtraTrees ultra_v3 antibiotic misuse risk model.

    All artifacts are loaded once at startup and cached in memory.
    Call load_bundle() before calling predict().
    """

    def __init__(self, bundle_dir: Optional[Path] = None):
        self.bundle_dir: Path = Path(bundle_dir) if bundle_dir else DEFAULT_BUNDLE_DIR
        self._model = None
        self._imputer = None
        self._label_encoder = None
        self._threshold_policy: dict = {}
        self._hybrid_rules: dict = {}
        self._confidence_config: dict = {}
        self._metrics: dict = {}
        self._feature_info: dict = {}
        self._freeze_manifest: dict = {}
        self.loaded: bool = False

    # ── Bundle loading ────────────────────────────────────────────────────────

    def load_bundle(self) -> None:
        """Load all frozen artifacts from the bundle directory."""
        d = self.bundle_dir
        logger.info("[FinalModelService] Loading bundle from %s", d)

        if not d.exists():
            raise RuntimeError(f"Final bundle directory not found: {d}")

        required_files = [
            "model.joblib", "imputer.joblib", "label_encoder.joblib",
            "threshold_policy.json", "hybrid_rules.json",
            "confidence_config.json", "feature_info.json",
        ]
        missing = [f for f in required_files if not (d / f).exists()]
        if missing:
            raise RuntimeError(f"Missing bundle files: {missing}")

        self._model         = joblib.load(d / "model.joblib")
        self._imputer       = joblib.load(d / "imputer.joblib")
        self._label_encoder = joblib.load(d / "label_encoder.joblib")

        self._threshold_policy  = json.loads((d / "threshold_policy.json").read_text())
        self._hybrid_rules      = json.loads((d / "hybrid_rules.json").read_text())
        self._confidence_config = json.loads((d / "confidence_config.json").read_text())
        self._feature_info      = json.loads((d / "feature_info.json").read_text())

        # Optional but useful metadata files
        for attr, fname in [("_metrics", "metrics.json"),
                             ("_freeze_manifest", "freeze_manifest.json")]:
            p = d / fname
            if p.exists():
                setattr(self, attr, json.loads(p.read_text()))

        self.loaded = True
        logger.info(
            "[FinalModelService] Loaded: bundle=%s | features=%d | threshold=%.3f | classes=%s",
            self._freeze_manifest.get("model_version", "ultra_v3"),
            len(self.feature_names),
            self.high_threshold,
            self.classes,
        )

    # ── Properties ───────────────────────────────────────────────────────────

    @property
    def feature_names(self) -> list:
        return self._feature_info.get("features", [])

    @property
    def high_threshold(self) -> float:
        return float(self._threshold_policy.get("high_class_threshold", 0.175))

    @property
    def classes(self) -> list:
        return self._label_encoder.classes_.tolist() if self._label_encoder is not None else []

    @property
    def model_metadata(self) -> dict:
        """Summary info for /health and /model-info endpoints."""
        manifest = self._freeze_manifest
        metrics  = self._metrics.get("test", self._metrics)
        policy   = self._threshold_policy
        return {
            "bundle_name":    manifest.get("model_version",    "ultra_v3"),
            "model_type":     manifest.get("model_name",       "ExtraTrees"),
            "feature_set":    self._feature_info.get("feature_set_name", "all_safe_v2"),
            "n_features":     len(self.feature_names),
            "classes":        self.classes,
            "high_threshold": self.high_threshold,
            "tuning_method":  policy.get("tuning_method",     "oof_ultra_score_optimization"),
            "frozen_at":      manifest.get("freeze_timestamp", ""),
            "test_metrics":   metrics,
        }

    # ── Confidence band ───────────────────────────────────────────────────────

    def _confidence_band(self, max_prob: float, top2_gap: float) -> str:
        cfg = self._confidence_config
        conf_high   = float(cfg.get("conf_high",    0.70))
        conf_low    = float(cfg.get("conf_low",     0.50))
        uncertain   = float(cfg.get("uncertain_gap", 0.15))
        if max_prob >= conf_high and top2_gap >= uncertain:
            return "high"
        if max_prob < conf_low or top2_gap < uncertain:
            return "low"
        return "medium"

    # ── Hybrid rules ─────────────────────────────────────────────────────────

    def _apply_hybrid_rules(
        self,
        raw_class: str,
        prob_dict: dict,
        features: dict,
        top2_gap: float,
    ) -> dict:
        """
        Apply clinical override rules from hybrid_rules.json.

        Returns
        -------
        dict with keys:
            final_class        — possibly escalated risk class
            force_pattern      — clinical pattern forced by a rule (or None)
            force_next_step    — next-step action forced by a rule (or None)
            warnings           — list of warning strings for the response
            annotations        — list of stewardship annotation strings
        """
        rules       = self._hybrid_rules.get("rules", {})
        final_class = raw_class
        force_pattern   = None
        force_next_step = None
        warnings        = []
        annotations     = []

        # ── instability_override ─────────────────────────────────────────────
        r = rules.get("instability_override", {})
        if r.get("enabled", False):
            cond = r.get("conditions", {})
            acuity_ok  = float(features.get("acuity", 5)) <= float(cond.get("acuity_max", 2))
            one_of_ok  = any(features.get(f, 0) for f in cond.get("requires_one_of", []))
            all_req_ok = all(features.get(f, 0) for f in cond.get("also_requires", []))
            if acuity_ok and one_of_ok and all_req_ok:
                force_pattern   = "urgent_review"
                force_next_step = "urgent_doctor_review"
                warnings.append(
                    "Clinical instability detected (acuity ≤2 + haemodynamic flag + severe diagnosis) "
                    "— urgent clinical review recommended."
                )
                logger.info("[hybrid] instability_override triggered")

        # ── multi_alarm_escalation ───────────────────────────────────────────
        r = rules.get("multi_alarm_escalation", {})
        if r.get("enabled", False) and final_class == "low":
            cond = r.get("conditions", {})
            if all(features.get(f, 0) for f in cond.get("requires_all", [])):
                final_class = "medium"
                warnings.append("Multiple alarm signs present — risk escalated from low to medium.")
                logger.info("[hybrid] multi_alarm_escalation triggered")

        # ── viral_no_abx_flag ────────────────────────────────────────────────
        r = rules.get("viral_no_abx_flag", {})
        if r.get("enabled", False):
            cond = r.get("conditions", {})
            no_abx      = not features.get("medication_antibiotic_flag", 0)
            viral_diag  = bool(features.get("diagnosis_viral_like_flag", 0))
            signal_count = sum(
                int(bool(features.get(f, 0)))
                for f in cond.get("viral_signal_features", [])
            )
            if no_abx and viral_diag and signal_count >= int(cond.get("min_viral_signals", 3)):
                annotations.append("viral_no_abx")
                logger.info("[hybrid] viral_no_abx_flag annotation set")

        # ── low_confidence_escalation ────────────────────────────────────────
        r = rules.get("low_confidence_escalation", {})
        if r.get("enabled", False) and force_next_step is None:
            cfg = self._confidence_config
            if top2_gap < float(cfg.get("uncertain_gap", 0.15)):
                force_next_step = "doctor_review_recommended"
                logger.info("[hybrid] low_confidence_escalation triggered (top2_gap=%.3f)", top2_gap)

        return {
            "final_class":      final_class,
            "force_pattern":    force_pattern,
            "force_next_step":  force_next_step,
            "warnings":         warnings,
            "annotations":      annotations,
        }

    # ── Clinical pattern ──────────────────────────────────────────────────────

    @staticmethod
    def _clinical_pattern(
        final_class: str,
        features: dict,
        force_pattern: Optional[str],
    ) -> str:
        if force_pattern:
            return force_pattern
        if final_class == "high":
            return "possible_antibiotic_overuse_pattern"
        if final_class == "medium":
            return "undifferentiated_moderate_risk"
        # low
        if features.get("diagnosis_viral_like_flag", 0):
            return "viral_like_pattern"
        return "low_risk_standard_care"

    # ── Next step ─────────────────────────────────────────────────────────────

    @staticmethod
    def _next_step(
        final_class: str,
        pattern: str,
        force_next_step: Optional[str],
        confidence_band: str,
    ) -> str:
        if force_next_step:
            return force_next_step
        if pattern == "urgent_review":
            return "urgent_doctor_review"
        if final_class == "high":
            return "stewardship_review_required"
        if final_class == "medium":
            return "further_testing" if confidence_band == "low" else "review_recommended"
        # low
        return "monitor_and_observe"

    # ── Human-readable reasons ────────────────────────────────────────────────

    @staticmethod
    def _build_reasons(features: dict, final_class: str) -> list:
        r = []
        if features.get("medication_antibiotic_flag", 0):
            r.append("recent antibiotic use recorded")
        if features.get("diagnosis_viral_like_flag", 0):
            r.append("viral-like infection suspected")
        if features.get("high_fever_flag", 0):
            r.append("high fever — clinical review warranted")
        elif features.get("fever_flag", 0):
            r.append("mild fever noted")
        if features.get("complaint_cough_flag", 0) and features.get("complaint_sore_throat_flag", 0):
            r.append("upper respiratory presentation (cough + sore throat)")
        elif features.get("complaint_cough_flag", 0):
            r.append("respiratory complaint present")
        elif features.get("complaint_sore_throat_flag", 0):
            r.append("sore throat complaint present")
        if features.get("tachycardia_flag", 0):
            r.append("elevated heart rate detected")
        if features.get("tachypnea_flag", 0):
            r.append("elevated respiratory rate")
        if features.get("low_spo2_flag", 0):
            r.append("low oxygen saturation — clinical review warranted")
        elif float(features.get("o2sat", 99)) >= 95:
            r.append("normal oxygen saturation")
        if features.get("diagnosis_severe_flag", 0):
            r.append("possible severe bacterial infection pattern")
        if not r:
            r.append("clinical presentation reviewed")
        return r[:6]

    # ── Doctor priority note ──────────────────────────────────────────────────

    @staticmethod
    def _doctor_note(next_step: str, final_class: str) -> str:
        if next_step == "urgent_doctor_review":
            return (
                "Clinical instability signs detected. Urgent clinical review is recommended. "
                "Final decision rests with the treating clinician."
            )
        if next_step == "stewardship_review_required":
            return (
                "This is a prescribing appropriateness concern, not a clinical emergency. "
                "Final decision should be made by a qualified doctor."
            )
        if final_class == "medium":
            return (
                "Mixed or uncertain risk pattern. Clinical review is advised before prescribing. "
                "Final decision should be made by a qualified doctor."
            )
        return (
            "Low antibiotic misuse risk — standard clinical monitoring applies. "
            "Final decision should be made by a qualified doctor."
        )

    # ── Main predict ──────────────────────────────────────────────────────────

    def predict(self, patient_features: dict) -> dict:
        """
        Run full inference pipeline on a pre-engineered feature dict.

        Parameters
        ----------
        patient_features : dict
            Feature name → value mapping (38 features expected).
            Missing features are filled by the imputer.

        Returns
        -------
        dict
            Structured doctor-first API response.
        """
        if not self.loaded:
            raise RuntimeError("Bundle not loaded — call load_bundle() first.")

        # Build DataFrame in the exact training feature order
        feat_names = self.feature_names
        row = {f: patient_features.get(f, np.nan) for f in feat_names}
        X   = pd.DataFrame([row], columns=feat_names)

        # Impute
        X_imp = self._imputer.transform(X)

        # Probabilities
        proba    = self._model.predict_proba(X_imp)[0]
        classes  = self.classes
        prob_dict = dict(zip(classes, proba.tolist()))

        # Threshold policy: P(high) >= threshold → predict high
        raw_class = (
            "high"
            if prob_dict.get("high", 0.0) >= self.high_threshold
            else classes[int(np.argmax(proba))]
        )

        # Confidence metrics
        sorted_probs = sorted(prob_dict.values(), reverse=True)
        max_prob = sorted_probs[0]
        top2_gap = sorted_probs[0] - sorted_probs[1] if len(sorted_probs) >= 2 else 1.0
        band = self._confidence_band(max_prob, top2_gap)

        # Hybrid rules
        hybrid = self._apply_hybrid_rules(raw_class, prob_dict, patient_features, top2_gap)
        final_class = hybrid["final_class"]

        # Semantic outputs
        pattern   = self._clinical_pattern(final_class, patient_features, hybrid["force_pattern"])
        next_step = self._next_step(final_class, pattern, hybrid["force_next_step"], band)
        reasons   = self._build_reasons(patient_features, final_class)
        note      = self._doctor_note(next_step, final_class)

        logger.info(
            "[predict] risk=%s pattern=%s next_step=%s band=%s conf=%.3f",
            final_class, pattern, next_step, band, max_prob,
        )

        return {
            "antibiotic_misuse_risk":    final_class,
            "possible_clinical_pattern": pattern,
            "recommended_next_step":     next_step,
            "confidence_score":          round(float(max_prob), 4),
            "confidence_band":           band,
            "top_reasons":               reasons,
            "doctor_priority_note":      note,
            "probabilities": {
                "low":    round(float(prob_dict.get("low",    0.0)), 4),
                "medium": round(float(prob_dict.get("medium", 0.0)), 4),
                "high":   round(float(prob_dict.get("high",   0.0)), 4),
            },
            "warnings":   hybrid["warnings"],
            "annotations": hybrid["annotations"],
        }
