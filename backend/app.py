"""
app.py  –  Flask backend for Heart Attack Prediction
Run: python app.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}) # Allow all origins for prediction API

@app.route("/")
def home():
    return jsonify({"message": "Heart Attack Prediction ML API is running!"}), 200

# ── Load model and scaler once at startup ─────────────────────────────────────
# Use a relative path to find the model folder inside the same directory as app.py
BASE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "heartattack-prediction-train-model")
MODEL_PATH  = os.path.join(BASE_DIR, "heart_attack_xgboost_model.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "scaler.pkl")

model  = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)

FEATURES = [
    "age", "gender", "bmi", "smoking", "alcohol", "physical_activity",
    "systolic_bp", "diastolic_bp", "heart_rate", "stress_level",
    "family_history", "sleep_hours",
]
# ── Prediction endpoint ───────────────────────────────────────────────────────
@app.route("/api/predict", methods=["POST", "OPTIONS"])
@app.route("/api/v1/predict", methods=["POST", "OPTIONS"])
def predict():
    try:
        data = request.get_json(force=True)

        # Build feature vector in the exact same order as training
        row = []
        for feat in FEATURES:
            val = data.get(feat)
            if val is None:
                return jsonify({"error": f"Missing field: {feat}"}), 400
            row.append(float(val))

        X = np.array(row).reshape(1, -1)
        X_scaled = scaler.transform(X)

        pred_class = int(model.predict(X_scaled)[0])
        pred_proba = float(model.predict_proba(X_scaled)[0][1])  # probability of heart attack

        result = {
            "prediction": "High Risk" if pred_class == 1 else "Low Risk",
            "risk": pred_class,           # 1 = high risk, 0 = low risk
            "probability": round(pred_proba * 100, 1),  # e.g. 78.4
        }
        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Health check ──────────────────────────────────────────────────────────────
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": "XGBoost Heart Attack Model"}), 200


if __name__ == "__main__":
    print("Model loaded:", MODEL_PATH)
    print("Scaler loaded:", SCALER_PATH)
    print("Starting Flask server on http://localhost:5000")
    app.run(port=5000, debug=True)
