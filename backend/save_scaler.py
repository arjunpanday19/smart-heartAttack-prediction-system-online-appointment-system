"""
save_scaler.py  –  Run this ONCE to generate scaler.pkl
This re-runs only the data-prep portion of train_model.py so that the same
StandardScaler used during training is saved next to the model.
"""

import os
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
import joblib

# ── Paths ────────────────────────────────────────────────────────────────────
MODEL_DIR = r"C:\Users\HP\OneDrive\Desktop\heartattack-prediction-train-model"
f1 = os.path.join(MODEL_DIR, "framingham.csv")
f2 = os.path.join(MODEL_DIR, "cardio_train.csv")
f3 = os.path.join(MODEL_DIR, "heart_disease_risk.csv")

# ── Load ─────────────────────────────────────────────────────────────────────
df1 = pd.read_csv(f1)
df2 = pd.read_csv(f2, sep=";")
if len(df2.columns) < 2:
    df2 = pd.read_csv(f2)
df3 = pd.read_csv(f3)

# ── Feature extraction (exactly as in train_model.py) ────────────────────────
d1 = pd.DataFrame()
d1["age"] = df1["age"]
d1["gender"] = df1["male"]
d1["bmi"] = df1["BMI"]
d1["smoking"] = df1["currentSmoker"]
d1["alcohol"] = np.nan
d1["physical_activity"] = np.nan
d1["systolic_bp"] = df1["sysBP"]
d1["diastolic_bp"] = df1["diaBP"]
d1["heart_rate"] = df1["heartRate"]
d1["stress_level"] = np.nan
d1["family_history"] = np.nan
d1["sleep_hours"] = np.nan

d2 = pd.DataFrame()
d2["age"] = df2["age"] / 365.25
d2["gender"] = df2["gender"].replace({1: 0, 2: 1})
d2["bmi"] = df2["weight"] / ((df2["height"] / 100) ** 2)
d2["smoking"] = df2["smoke"]
d2["alcohol"] = df2["alco"]
d2["physical_activity"] = df2["active"]
d2["systolic_bp"] = df2["ap_hi"]
d2["diastolic_bp"] = df2["ap_lo"]
d2["heart_rate"] = np.nan
d2["stress_level"] = np.nan
d2["family_history"] = np.nan
d2["sleep_hours"] = np.nan

d3 = pd.DataFrame()
d3["age"] = df3["age"]
d3["gender"] = df3["sex"]
d3["bmi"] = np.nan
d3["smoking"] = np.nan
d3["alcohol"] = np.nan
d3["physical_activity"] = np.nan
d3["systolic_bp"] = df3["trestbps"]
d3["diastolic_bp"] = np.nan
d3["heart_rate"] = df3["thalach"]
d3["stress_level"] = np.nan
d3["family_history"] = np.nan
d3["sleep_hours"] = np.nan

df_full = pd.concat([d1, d2, d3], ignore_index=True).drop_duplicates()

# ── Imputation ────────────────────────────────────────────────────────────────
continuous_cols = ["age", "bmi", "systolic_bp", "diastolic_bp", "heart_rate", "sleep_hours"]
for col in continuous_cols:
    if df_full[col].isna().all():
        df_full[col] = 0
    else:
        df_full[col] = df_full[col].fillna(df_full[col].median())

categorical_cols = ["gender", "smoking", "alcohol", "physical_activity", "stress_level", "family_history"]
for col in categorical_cols:
    if df_full[col].isna().all():
        df_full[col] = 0
    else:
        df_full[col] = df_full[col].fillna(df_full[col].mode()[0])

df_full["systolic_bp"] = df_full["systolic_bp"].apply(lambda x: abs(x) if abs(x) < 300 else 120)
df_full["diastolic_bp"] = df_full["diastolic_bp"].apply(lambda x: abs(x) if abs(x) < 200 else 80)

# ── Fit & save scaler ─────────────────────────────────────────────────────────
features_list = [
    "age", "gender", "bmi", "smoking", "alcohol", "physical_activity",
    "systolic_bp", "diastolic_bp", "heart_rate", "stress_level",
    "family_history", "sleep_hours",
]
X = df_full[features_list]
scaler = StandardScaler()
scaler.fit(X)

scaler_path = os.path.join(MODEL_DIR, "scaler.pkl")
joblib.dump(scaler, scaler_path)
print(f"✅  scaler.pkl saved to: {scaler_path}")
