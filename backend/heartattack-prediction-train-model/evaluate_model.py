import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report, roc_auc_score
import joblib

def main():
    f1 = 'framingham.csv'
    f2 = 'cardio_train.csv'
    f3 = 'heart_disease_risk.csv'
    
    df1 = pd.read_csv(f1)
    df2 = pd.read_csv(f2, sep=';')
    if len(df2.columns) < 2:
        df2 = pd.read_csv(f2)
    df3 = pd.read_csv(f3)
    
    d1 = pd.DataFrame()
    d1['age'] = df1['age']
    d1['gender'] = df1['male']
    d1['bmi'] = df1['BMI']
    d1['smoking'] = df1['currentSmoker']
    d1['alcohol'] = np.nan
    d1['physical_activity'] = np.nan
    d1['systolic_bp'] = df1['sysBP']
    d1['diastolic_bp'] = df1['diaBP']
    d1['heart_rate'] = df1['heartRate']
    d1['stress_level'] = np.nan
    d1['family_history'] = np.nan
    d1['sleep_hours'] = np.nan
    d1['heart_attack'] = df1['TenYearCHD']
    
    d2 = pd.DataFrame()
    d2['age'] = df2['age'] / 365.25
    d2['gender'] = df2['gender'].replace({1: 0, 2: 1})
    d2['bmi'] = df2['weight'] / ((df2['height'] / 100) ** 2)
    d2['smoking'] = df2['smoke']
    d2['alcohol'] = df2['alco']
    d2['physical_activity'] = df2['active']
    d2['systolic_bp'] = df2['ap_hi']
    d2['diastolic_bp'] = df2['ap_lo']
    d2['heart_rate'] = np.nan
    d2['stress_level'] = np.nan
    d2['family_history'] = np.nan
    d2['sleep_hours'] = np.nan
    d2['heart_attack'] = df2['cardio']
    
    d3 = pd.DataFrame()
    d3['age'] = df3['age']
    d3['gender'] = df3['sex']
    d3['bmi'] = np.nan
    d3['smoking'] = np.nan
    d3['alcohol'] = np.nan
    d3['physical_activity'] = np.nan
    d3['systolic_bp'] = df3['trestbps']
    d3['diastolic_bp'] = np.nan
    d3['heart_rate'] = df3['thalach']
    d3['stress_level'] = np.nan
    d3['family_history'] = np.nan
    d3['sleep_hours'] = np.nan
    d3['heart_attack'] = df3['decision']
    
    df_full = pd.concat([d1, d2, d3], ignore_index=True)
    df_full = df_full.drop_duplicates()
    
    continuous_cols = ['age', 'bmi', 'systolic_bp', 'diastolic_bp', 'heart_rate', 'sleep_hours']
    for col in continuous_cols:
        if df_full[col].isna().all():
            df_full[col] = 0
        else:
            df_full[col] = df_full[col].fillna(df_full[col].median())
            
    categorical_cols = ['gender', 'smoking', 'alcohol', 'physical_activity', 'stress_level', 'family_history']
    for col in categorical_cols:
        if df_full[col].isna().all():
            df_full[col] = 0
        else:
            df_full[col] = df_full[col].fillna(df_full[col].mode()[0])
            
    df_full['heart_attack'] = df_full['heart_attack'].fillna(df_full['heart_attack'].mode()[0]).astype(int)
    
    df_full['systolic_bp'] = df_full['systolic_bp'].apply(lambda x: abs(x) if abs(x) < 300 else 120)
    df_full['diastolic_bp'] = df_full['diastolic_bp'].apply(lambda x: abs(x) if abs(x) < 200 else 80)
    
    features_list = [
        'age', 'gender', 'bmi', 'smoking', 'alcohol', 'physical_activity',
        'systolic_bp', 'diastolic_bp', 'heart_rate', 'stress_level', 
        'family_history', 'sleep_hours'
    ]
    X = df_full[features_list]
    y = df_full['heart_attack']
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.4, random_state=42)
    
    print("Loading saved model...")
    best_xgb = joblib.load('heart_attack_xgboost_model.pkl')
    
    print("Evaluating Model...")
    y_train_pred = best_xgb.predict(X_train)
    y_test_pred = best_xgb.predict(X_test)
    
    train_acc = accuracy_score(y_train, y_train_pred)
    test_acc = accuracy_score(y_test, y_test_pred)
    
    with open("final_metrics.txt", "w") as f:
        f.write(f"Training accuracy: {train_acc:.4f}\n")
        f.write(f"Testing accuracy: {test_acc:.4f}\n")
        f.write("\nConfusion Matrix:\n")
        f.write(str(confusion_matrix(y_test, y_test_pred)))
        f.write("\n\nClassification Report:\n")
        f.write(classification_report(y_test, y_test_pred))
        
        try:
            y_test_probs = best_xgb.predict_proba(X_test)[:, 1]
            roc = roc_auc_score(y_test, y_test_probs)
            f.write(f"\nROC-AUC score: {roc:.4f}\n")
        except Exception as e:
            f.write("Could not compute ROC-AUC score: " + str(e))

if __name__ == "__main__":
    main()
