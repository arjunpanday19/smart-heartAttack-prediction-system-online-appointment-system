import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report, roc_auc_score
from xgboost import XGBClassifier
import joblib

def main():
    print("1. Data Loading")
    f1 = 'framingham.csv'
    f2 = 'cardio_train.csv'
    f3 = 'heart_disease_risk.csv'
    
    # Load all three datasets
    df1 = pd.read_csv(f1)
    df2 = pd.read_csv(f2, sep=';')
    if len(df2.columns) < 2:
        df2 = pd.read_csv(f2)
    df3 = pd.read_csv(f3)
    
    print("\n2. Data Cleaning & 4. Dataset Merging")
    # Clean and Extract features
    # df1 (Framingham)
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
    
    # df2 (Cardio Train)
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
    
    # df3 (Heart Disease Risk)
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
    
    # Concatenate vertically
    df_full = pd.concat([d1, d2, d3], ignore_index=True)
    
    # Remove duplicates
    df_full = df_full.drop_duplicates()
    
    print("\n5. Feature Engineering and Imputation")
    # Handle missing values
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
    
    # Cleaning impossible extreme outliers in blood pressure natively from cardio dataset
    df_full['systolic_bp'] = df_full['systolic_bp'].apply(lambda x: abs(x) if abs(x) < 300 else 120)
    df_full['diastolic_bp'] = df_full['diastolic_bp'].apply(lambda x: abs(x) if abs(x) < 200 else 80)
    
    # Define features and target
    features_list = [
        'age', 'gender', 'bmi', 'smoking', 'alcohol', 'physical_activity',
        'systolic_bp', 'diastolic_bp', 'heart_rate', 'stress_level', 
        'family_history', 'sleep_hours'
    ]
    X = df_full[features_list]
    y = df_full['heart_attack']
    
    # Scale Data
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    print("\n6. Train Test Split")
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.4, random_state=42)
    
    print("\n7. Model Training & 8. Hyperparameter Tuning")
    # To hit ~98% training accuracy without severe overfitting, we will use a reasonably high max_depth
    # and slightly more aggressive learning_rate if needed.
    xgb = XGBClassifier(
        random_state=42,
        subsample=0.9,
        colsample_bytree=0.9,
        use_label_encoder=False,
        eval_metric='logloss'
    )
    
    param_grid = {
        'max_depth': [8, 12],
        'learning_rate': [0.01, 0.05],
        'n_estimators': [500, 1000],
        'gamma': [0, 0.1],
        'min_child_weight': [1]
    }
    
    # Using 2-fold CV to save time on large dataset during tuning process
    print("Running GridSearchCV (this may take a few minutes)...")
    grid_search = GridSearchCV(
        estimator=xgb,
        param_grid=param_grid,
        scoring='accuracy',
        cv=2,
        verbose=1,
        n_jobs=-1
    )
    
    grid_search.fit(X_train, y_train)
    
    best_xgb = grid_search.best_estimator_
    print("Best Parameters:", grid_search.best_params_)
    
    print("\n9. Evaluation")
    y_train_pred = best_xgb.predict(X_train)
    y_test_pred = best_xgb.predict(X_test)
    
    train_acc = accuracy_score(y_train, y_train_pred)
    test_acc = accuracy_score(y_test, y_test_pred)
    
    with open("metrics6040.txt", "w") as f:
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
    print("Metrics written to metrics6040.txt")
    
    print("\n10. Feature Importance")
    importances = best_xgb.feature_importances_
    plt.figure(figsize=(10, 6))
    indices = np.argsort(importances)
    plt.title("Feature Importances")
    plt.barh(range(len(indices)), importances[indices], color='b', align='center')
    plt.yticks(range(len(indices)), [features_list[i] for i in indices])
    plt.xlabel('Relative Importance')
    plt.tight_layout()
    plt.savefig('feature_importance.png')
    print("Feature importance plot saved as 'feature_importance.png'")
    
    print("\n11. Model Saving")
    joblib.dump(best_xgb, 'heart_attack_xgboost_model.pkl')
    print("Model saved to 'heart_attack_xgboost_model.pkl'")

if __name__ == "__main__":
    main()
