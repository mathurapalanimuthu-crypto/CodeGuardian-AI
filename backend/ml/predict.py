import joblib
import pandas as pd
import os

from .python_jm1_metrics import (
    calculate_python_jm1_metrics
)


MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "random_forest_jm1.pkl"
)


def load_model():
    model = joblib.load(MODEL_PATH)

    print("Random Forest model loaded successfully.")

    return model


def predict_python_code(model, code):
    """
    Extract JM1-style metrics from Python code
    and use the trained Random Forest model
    to predict defect probability.
    """

    metrics = calculate_python_jm1_metrics(
        code
    )

    if metrics is None:
        raise ValueError(
            "Unable to parse Python source code."
        )

    # Exact feature order used by JM1 model
    feature_names = [
        "loc",
        "v(g)",
        "ev(g)",
        "iv(g)",
        "n",
        "v",
        "l",
        "d",
        "i",
        "e",
        "b",
        "t",
        "lOCode",
        "lOComment",
        "lOBlank",
        "locCodeAndComment",
        "uniq_Op",
        "uniq_Opnd",
        "total_Op",
        "total_Opnd",
        "branchCount",
    ]

    feature_data = pd.DataFrame(
        [[metrics[name] for name in feature_names]],
        columns=feature_names
    )

    prediction = model.predict(
        feature_data
    )[0]

    probability = model.predict_proba(
        feature_data
    )[0][1]

    defect_probability = float(
        probability
    )

    if defect_probability < 0.30:
        risk_level = "Low"

    elif defect_probability < 0.60:
        risk_level = "Medium"

    else:
        risk_level = "High"

    recommendations = []

    if metrics["v(g)"] > 10:
        recommendations.append(
            "Reduce cyclomatic complexity."
        )

    if metrics["loc"] > 200:
        recommendations.append(
            "Consider breaking large source files into smaller modules."
        )

    if metrics["lOComment"] == 0:
        recommendations.append(
            "Add meaningful comments or documentation."
        )

    if metrics["branchCount"] > 10:
        recommendations.append(
            "Review excessive branching and conditional logic."
        )

    if metrics["d"] > 20:
        recommendations.append(
            "Review code difficulty and simplify complex logic."
        )

    if not recommendations:
        recommendations.append(
            "No major metric-based warning detected."
        )

    return {
        "prediction": bool(prediction),
        "defect_probability": round(
            defect_probability,
            4
        ),
        "risk_level": risk_level,
        "recommendations": recommendations,
        "metrics": metrics
    }


if __name__ == "__main__":

    model = load_model()

    sample_code = """
def calculate_total(a, b):
    if a > b:
        return a + b
    else:
        return b - a
"""

    result = predict_python_code(
        model,
        sample_code
    )

    print("\n========== ML PREDICTION ==========")

    print(
        "Defect prediction:",
        result["prediction"]
    )

    print(
        "Defect probability:",
        result["defect_probability"]
    )

    print(
        "Risk level:",
        result["risk_level"]
    )

    print("\n========== RECOMMENDATIONS ==========")

    for recommendation in result["recommendations"]:
        print("-", recommendation)

    print("\n========== EXTRACTED METRICS ==========")