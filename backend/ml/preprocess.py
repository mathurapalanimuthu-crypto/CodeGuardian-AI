import pandas as pd
from sklearn.model_selection import train_test_split


DATASET_PATH = "datasets/jm1.csv"


def load_dataset():
    df = pd.read_csv(DATASET_PATH)

    print("Original dataset shape:", df.shape)

    return df


def prepare_features(df):
    X = df.drop(columns=["defects"])
    y = df["defects"]

    print("\n========== FEATURES (X) ==========")
    print("Shape:", X.shape)

    print("\n========== TARGET (y) ==========")
    print("Shape:", y.shape)

    print("\nTarget distribution:")
    print(y.value_counts())

    return X, y


def split_dataset(X, y):
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
        stratify=y
    )

    print("\n========== TRAIN / TEST SPLIT ==========")

    print("X_train shape:", X_train.shape)
    print("X_test shape:", X_test.shape)

    print("y_train shape:", y_train.shape)
    print("y_test shape:", y_test.shape)

    print("\nTraining target distribution:")
    print(y_train.value_counts())

    print("\nTesting target distribution:")
    print(y_test.value_counts())

    print("\n========== SPLIT PERCENTAGE ==========")

    print(
    "Training data:",
    round(len(X_train) / len(X) * 100, 2),
    "%"
)

    print(
    "Testing data:",
    round(len(X_test) / len(X) * 100, 2),
    "%"
)

    return X_train, X_test, y_train, y_test


if __name__ == "__main__":
    df = load_dataset()

    X, y = prepare_features(df)

    X_train, X_test, y_train, y_test = split_dataset(X, y)

    print("\n========== ALL JM1 FEATURES ==========")

for index, feature in enumerate(X.columns, start=1):
    print(index, feature)