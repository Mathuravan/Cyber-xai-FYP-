from pathlib import Path
import json
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# --------------------------------------------------
# Project paths
# --------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data" / "NSL-KDD"
MODELS_DIR = BASE_DIR / "models"

MODELS_DIR.mkdir(parents=True, exist_ok=True)

TRAIN_FILE = DATA_DIR / "KDDTrain+.txt"
TEST_FILE = DATA_DIR / "KDDTest+.txt"

# --------------------------------------------------
# NSL-KDD column names
# --------------------------------------------------
columns = [
    'duration', 'protocol_type', 'service', 'flag', 'src_bytes', 'dst_bytes', 'land',
    'wrong_fragment', 'urgent', 'hot', 'num_failed_logins', 'logged_in',
    'num_compromised', 'root_shell', 'su_attempted', 'num_root', 'num_file_creations',
    'num_shells', 'num_access_files', 'num_outbound_cmds', 'is_host_login',
    'is_guest_login', 'count', 'srv_count', 'serror_rate', 'srv_serror_rate',
    'rerror_rate', 'srv_rerror_rate', 'same_srv_rate', 'diff_srv_rate',
    'srv_diff_host_rate', 'dst_host_count', 'dst_host_srv_count',
    'dst_host_same_srv_rate', 'dst_host_diff_srv_rate', 'dst_host_same_src_port_rate',
    'dst_host_srv_diff_host_rate', 'dst_host_serror_rate', 'dst_host_srv_serror_rate',
    'dst_host_rerror_rate', 'dst_host_srv_rerror_rate', 'attack', 'level'
]

# --------------------------------------------------
# Check files
# --------------------------------------------------
if not TRAIN_FILE.exists():
    raise FileNotFoundError(f"Training file not found: {TRAIN_FILE}")

if not TEST_FILE.exists():
    raise FileNotFoundError(f"Test file not found: {TEST_FILE}")

print("Loading NSL-KDD files...")
train_df = pd.read_csv(TRAIN_FILE, names=columns)
test_df = pd.read_csv(TEST_FILE, names=columns)

# --------------------------------------------------
# Use only 4 features to match current frontend form
# --------------------------------------------------
selected_features = ["duration", "src_bytes", "dst_bytes", "count"]

X_train = train_df[selected_features].copy()
X_test = test_df[selected_features].copy()

# Binary target: 0 = Normal, 1 = Malicious
y_train = (train_df["attack"] != "normal").astype(int)
y_test = (test_df["attack"] != "normal").astype(int)

print(f"Train shape: {X_train.shape}")
print(f"Test shape: {X_test.shape}")
print(f"Selected features: {selected_features}")

# --------------------------------------------------
# Train model
# --------------------------------------------------
model = RandomForestClassifier(
    n_estimators=200,
    random_state=42,
    class_weight="balanced"
)

model.fit(X_train, y_train)

# --------------------------------------------------
# Evaluate
# --------------------------------------------------
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print("\n--- NSL-KDD 4-Feature Model Results ---")
print(f"Accuracy: {accuracy:.4f}")
print(classification_report(y_test, y_pred))

# --------------------------------------------------
# Save artifacts
# --------------------------------------------------
model_path = MODELS_DIR / "nslkdd_4f_rf_model.joblib"
features_path = MODELS_DIR / "nslkdd_4f_features.json"
sample_path = MODELS_DIR / "nslkdd_4f_sample_input.csv"

joblib.dump(model, model_path)

with open(features_path, "w") as f:
    json.dump(selected_features, f)

sample_df = X_test.head(5).copy()
sample_df["actual_label"] = y_test.head(5).values
sample_df.to_csv(sample_path, index=False)

print("\nSaved files:")
print(f"- {model_path}")
print(f"- {features_path}")
print(f"- {sample_path}")

print("TRAIN_FILE:", TRAIN_FILE)
print("EXISTS:", TRAIN_FILE.exists())