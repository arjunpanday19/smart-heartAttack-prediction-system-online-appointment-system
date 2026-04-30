import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score, confusion_matrix, classification_report, 
    roc_auc_score, roc_curve, precision_recall_curve, auc
)
import joblib
import os

def load_and_preprocess_data():
    """
    Loads raw CSV datasets and applies preprocessing logic consistent with the training script.
    """
    print("Loading datasets...")
    f1 = 'framingham.csv'
    f2 = 'cardio_train.csv'
    f3 = 'heart_disease_risk.csv'
    
    # Load all three datasets
    df1 = pd.read_csv(f1)
    df2 = pd.read_csv(f2, sep=';')
    if len(df2.columns) < 2:
        df2 = pd.read_csv(f2)
    df3 = pd.read_csv(f3)
    
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
    df_full = df_full.drop_duplicates()
    
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
    
    # Extreme outliers in blood pressure
    df_full['systolic_bp'] = df_full['systolic_bp'].apply(lambda x: abs(x) if abs(x) < 300 else 120)
    df_full['diastolic_bp'] = df_full['diastolic_bp'].apply(lambda x: abs(x) if abs(x) < 200 else 80)
    
    features_list = [
        'age', 'gender', 'bmi', 'smoking', 'alcohol', 'physical_activity',
        'systolic_bp', 'diastolic_bp', 'heart_rate', 'stress_level', 
        'family_history', 'sleep_hours'
    ]
    X = df_full[features_list]
    y = df_full['heart_attack']
    
    # Load or fit Scale Data
    print("Scaling data...")
    if os.path.exists('scaler.pkl'):
        scaler = joblib.load('scaler.pkl')
        X_scaled = scaler.transform(X)
    else:
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
    
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.4, random_state=42)
    return X_test, y_test

def plot_confusion_matrix(y_true, y_pred):
    """
    Plots a clean confusion matrix using matplotlib.
    """
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(8, 6))
    plt.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
    plt.title('Confusion Matrix')
    plt.colorbar()
    tick_marks = np.arange(2)
    plt.xticks(tick_marks, ['No Attack', 'Heart Attack'], rotation=45)
    plt.yticks(tick_marks, ['No Attack', 'Heart Attack'])

    # Labeling the matrix
    thresh = cm.max() / 2.
    for i, j in np.ndindex(cm.shape):
        plt.text(j, i, format(cm[i, j], 'd'),
                 horizontalalignment="center",
                 color="white" if cm[i, j] > thresh else "black")

    plt.ylabel('True label')
    plt.xlabel('Predicted label')
    plt.tight_layout()
    plt.savefig('confusion_matrix.png')
    print("Confusion matrix saved as 'confusion_matrix.png'")

def plot_roc_curve(y_true, y_probs):
    """
    Plots the Receiver Operating Characteristic (ROC) curve.
    """
    fpr, tpr, _ = roc_curve(y_true, y_probs)
    roc_auc = auc(fpr, tpr)

    plt.figure(figsize=(8, 6))
    plt.plot(fpr, tpr, color='darkorange', lw=2, label=f'ROC curve (area = {roc_auc:.2f})')
    plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('Receiver Operating Characteristic (ROC)')
    plt.legend(loc="lower right")
    plt.grid(alpha=0.3)
    plt.savefig('roc_curve.png')
    print("ROC curve saved as 'roc_curve.png'")

def main():
    model_path = 'heart_attack_xgboost_model.pkl'
    
    if not os.path.exists(model_path):
        print(f"Error: Could not find model file at {model_path}")
        return

    # Load model
    print(f"Loading model from {model_path}...")
    model = joblib.load(model_path)

    # Get test data
    X_test, y_test = load_and_preprocess_data()

    # Predictions
    print("Running predictions...")
    y_pred = model.predict(X_test)
    y_probs = model.predict_proba(X_test)[:, 1]

    # Calculate and Print Metrics
    acc = accuracy_score(y_test, y_pred)
    print(f"\nModel Accuracy: {acc:.4f}")
    
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))

    # Visualizations
    print("\nGenerating visualizations...")
    plot_confusion_matrix(y_test, y_pred)
    plot_roc_curve(y_test, y_probs)

    print("\nEvaluation complete. Check generated image files for visualizations.")

if __name__ == "__main__":
    main()
