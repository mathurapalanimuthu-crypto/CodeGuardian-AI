import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier


DATASET_PATH = "datasets/jm1.csv"


# -----------------------------------------
# 1. Load dataset
# -----------------------------------------

df = pd.read_csv(DATASET_PATH)

print("Dataset shape:", df.shape)


# -----------------------------------------
# 2. Separate features and target
# -----------------------------------------

X = df.drop(columns=["defects"])
y = df["defects"]


print("\nFeatures shape:", X.shape)
print("Target shape:", y.shape)


# -----------------------------------------
# 3. Split dataset
# -----------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)


print("\nTraining samples:", len(X_train))
print("Testing samples:", len(X_test))


# -----------------------------------------
# 4. Create Random Forest model
# -----------------------------------------

model = RandomForestClassifier(
    n_estimators=200,
    random_state=42,
    class_weight="balanced",
    n_jobs=-1
)


# -----------------------------------------
# 5. Train model
# -----------------------------------------

print("\nTraining Random Forest model...")

model.fit(
    X_train,
    y_train
)

print("Model training completed.")


# -----------------------------------------
# 6. Generate predictions
# -----------------------------------------

predictions = model.predict(X_test)


print("\n========== PREDICTIONS ==========")

print("First 20 predictions:")
print(predictions[:20])

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)


# -----------------------------------------
# 7. Evaluate model
# -----------------------------------------

accuracy = accuracy_score(
    y_test,
    predictions
)

precision = precision_score(
    y_test,
    predictions,
    zero_division=0
)

recall = recall_score(
    y_test,
    predictions,
    zero_division=0
)

f1 = f1_score(
    y_test,
    predictions,
    zero_division=0
)

roc_auc = roc_auc_score(
    y_test,
    model.predict_proba(X_test)[:, 1]
)

confusion = confusion_matrix(
    y_test,
    predictions
)


print("\n========== MODEL EVALUATION ==========")

print("Accuracy:", round(accuracy, 4))
print("Precision:", round(precision, 4))
print("Recall:", round(recall, 4))
print("F1 Score:", round(f1, 4))
print("ROC-AUC:", round(roc_auc, 4))

print("\n========== CONFUSION MATRIX ==========")
print(confusion)

print("\n========== CLASSIFICATION REPORT ==========")
print(
    classification_report(
        y_test,
        predictions,
        zero_division=0
    )
)

# -----------------------------------------
# 8. Feature Importance
# -----------------------------------------

feature_importance = pd.DataFrame({
    "feature": X.columns,
    "importance": model.feature_importances_
})

feature_importance = feature_importance.sort_values(
    by="importance",
    ascending=False
)

print("\n========== TOP 15 FEATURE IMPORTANCE ==========")

print(
    feature_importance.head(15).to_string(
        index=False
    )
)

import joblib


# -----------------------------------------
# 9. Save trained model
# -----------------------------------------

MODEL_PATH = "ml/random_forest_jm1.pkl"

joblib.dump(
    model,
    MODEL_PATH
)

print("\n========== MODEL SAVED ==========")
print("Model saved to:", MODEL_PATH)