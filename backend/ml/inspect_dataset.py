import pandas as pd

DATASET_PATH = "datasets/jm1.csv"

df = pd.read_csv(DATASET_PATH)

print("\n========== DATASET SHAPE ==========")
print("Rows:", df.shape[0])
print("Columns:", df.shape[1])

print("\n========== COLUMN NAMES ==========")
print(df.columns.tolist())

print("\n========== FIRST 5 ROWS ==========")
print(df.head())

print("\n========== DATA TYPES ==========")
print(df.dtypes)

print("\n========== MISSING VALUES ==========")
print(df.isnull().sum())

print("\n========== DUPLICATE ROWS ==========")
print(df.duplicated().sum())

print("\n========== DEFECT DISTRIBUTION ==========")
print(df["defects"].value_counts())

print("\n========== DEFECT PERCENTAGE ==========")
print(df["defects"].value_counts(normalize=True) * 100)

print("\n========== DUPLICATE FEATURE LABEL CHECK ==========")

feature_columns = [
    col for col in df.columns
    if col != "defects"
]

duplicate_rows = df[
    df.duplicated(
        subset=feature_columns,
        keep=False
    )
]

conflicting_duplicates = (
    duplicate_rows
    .groupby(feature_columns)["defects"]
    .nunique()
)

conflicting_count = (
    conflicting_duplicates > 1
).sum()

print(
    "Duplicate feature groups with conflicting defect labels:",
    conflicting_count
)