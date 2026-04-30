import pandas as pd
import sys

try:
    f1 = 'c:/Users/HP/OneDrive/Desktop/heartattack-prediction-train-model/framingham.csv'
    f2 = 'c:/Users/HP/OneDrive/Desktop/heartattack-prediction-train-model/cardio_train.csv'
    f3 = 'c:/Users/HP/OneDrive/Desktop/heartattack-prediction-train-model/heart_disease_risk.csv'
    
    df1 = pd.read_csv(f1)
    print("--- Framingham ---")
    print(df1.shape)
    print(df1.columns.tolist())
    
    df2 = pd.read_csv(f2, sep=';')
    if len(df2.columns) < 2:
        df2 = pd.read_csv(f2)
    print("\n--- Cardio Train ---")
    print(df2.shape)
    print(df2.columns.tolist())
    
    df3 = pd.read_csv(f3)
    print("\n--- Heart Disease Risk ---")
    print(df3.shape)
    print(df3.columns.tolist())
except Exception as e:
    print(e)
