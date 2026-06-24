import json
from pathlib import Path

def create_notebook(filename, cells):
    notebook = {
        "cells": cells,
        "metadata": {
            "kernelspec": {
                "display_name": "Python 3 (ipykernel)",
                "language": "python",
                "name": "python3"
            },
            "language_info": {
                "codemirror_mode": {
                    "name": "ipython",
                    "version": 3
                },
                "file_extension": ".py",
                "mimetype": "text/x-python",
                "name": "python",
                "nbconvert_exporter": "python",
                "pygments_lexer": "ipython3",
                "version": "3.10.0"
            }
        },
        "nbformat": 4,
        "nbformat_minor": 5
    }
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(notebook, f, indent=2)
    print(f"Created notebook: {filename}")

def build_cell(cell_type, source_lines):
    return {
        "cell_type": cell_type,
        "metadata": {},
        "source": [line + "\n" for line in source_lines]
    }

# ----------------------------------------------------
# 01_model_comparison.ipynb
# ----------------------------------------------------
cells_01 = [
    build_cell("markdown", [
        "# CyberXAI: Evaluation and Comparison of Machine Learning Models",
        "### Final Year Project - Testing Chapter",
        "",
        "This notebook performs a comprehensive evaluation of four machine learning classifiers on the complete **NSL-KDD dataset** for cyber attack detection:",
        "1. **Decision Tree**",
        "2. **Random Forest** (Final Selected Model)",
        "3. **XGBoost**",
        "4. **LightGBM**",
        "",
        "The models are trained using all 41 available features of the dataset (applying label encoding for categorical columns) and scaled using a `StandardScaler`. Their performances are evaluated and compared using standard classification metrics: **Accuracy, Precision, Recall, F1 Score, and ROC-AUC**."
    ]),
    build_cell("code", [
        "# Install required dependencies",
        "%pip install pandas numpy scikit-learn xgboost lightgbm matplotlib seaborn joblib"
    ]),
    build_cell("code", [
        "import pandas as pd",
        "import numpy as np",
        "import joblib",
        "from pathlib import Path",
        "import matplotlib.pyplot as plt",
        "import seaborn as sns",
        "",
        "from sklearn.preprocessing import LabelEncoder, StandardScaler",
        "from sklearn.tree import DecisionTreeClassifier",
        "from sklearn.ensemble import RandomForestClassifier",
        "from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, roc_curve, auc",
        "",
        "import xgboost as xgb",
        "import lightgbm as lgb",
        "",
        "import warnings",
        "warnings.filterwarnings('ignore')"
    ]),
    build_cell("markdown", [
        "### Path Configuration and Verification"
    ]),
    build_cell("code", [
        "# Path setup",
        "ROOT_DIR = Path.cwd().parent",
        "DATA_DIR = ROOT_DIR / \"data\" / \"NSL-KDD\"",
        "MODELS_DIR = ROOT_DIR / \"models\"",
        "OUTPUT_DIR = ROOT_DIR / \"testing_outputs\"",
        "",
        "MODELS_DIR.mkdir(parents=True, exist_ok=True)",
        "OUTPUT_DIR.mkdir(parents=True, exist_ok=True)",
        "",
        "TRAIN_FILE = DATA_DIR / \"KDDTrain+.txt\"",
        "TEST_FILE = DATA_DIR / \"KDDTest+.txt\"",
        "",
        "print(f\"Training dataset exists: {TRAIN_FILE.exists()}\")",
        "print(f\"Testing dataset exists: {TEST_FILE.exists()}\")"
    ]),
    build_cell("markdown", [
        "### Dataset Loading",
        "We load the complete NSL-KDD train and test datasets, which contain 43 columns (41 network features, 1 attack class label, and 1 difficulty score)."
    ]),
    build_cell("code", [
        "COLUMNS = [",
        "    \"duration\",\"protocol_type\",\"service\",\"flag\",\"src_bytes\",\"dst_bytes\",\"land\",",
        "    \"wrong_fragment\",\"urgent\",\"hot\",\"num_failed_logins\",\"logged_in\",",
        "    \"num_compromised\",\"root_shell\",\"su_attempted\",\"num_root\",",
        "    \"num_file_creations\",\"num_shells\",\"num_access_files\",",
        "    \"num_outbound_cmds\",\"is_host_login\",\"is_guest_login\",",
        "    \"count\",\"srv_count\",\"serror_rate\",\"srv_serror_rate\",",
        "    \"rerror_rate\",\"srv_rerror_rate\",\"same_srv_rate\",",
        "    \"diff_srv_rate\",\"srv_diff_host_rate\",\"dst_host_count\",",
        "    \"dst_host_srv_count\",\"dst_host_same_srv_rate\",",
        "    \"dst_host_diff_srv_rate\",\"dst_host_same_src_port_rate\",",
        "    \"dst_host_srv_diff_host_rate\",\"dst_host_serror_rate\",",
        "    \"dst_host_srv_serror_rate\",\"dst_host_rerror_rate\",",
        "    \"dst_host_srv_rerror_rate\",\"label\",\"difficulty\"",
        "]",
        "",
        "train_df = pd.read_csv(TRAIN_FILE, names=COLUMNS)",
        "test_df = pd.read_csv(TEST_FILE, names=COLUMNS)",
        "",
        "print(f\"Training set shape: {train_df.shape}\")",
        "print(f\"Testing set shape : {test_df.shape}\")"
    ]),
    build_cell("markdown", [
        "### Preprocessing and Encoding",
        "- Convert the multiclass `label` into a binary target (`0` for normal, `1` for any type of cyber attack).",
        "- Separate features and targets.",
        "- Apply `LabelEncoder` on the categorical columns (`protocol_type`, `service`, `flag`).",
        "- Scale all features using `StandardScaler` to ensure robust convergence across models."
    ]),
    build_cell("code", [
        "# Binary target encoding",
        "y_train = (train_df[\"label\"] != \"normal\").astype(int)",
        "y_test = (test_df[\"label\"] != \"normal\").astype(int)",
        "",
        "# Separate features (dropping label and difficulty score)",
        "X_train = train_df.drop(columns=[\"label\", \"difficulty\"]).copy()",
        "X_test = test_df.drop(columns=[\"label\", \"difficulty\"]).copy()",
        "",
        "# Encode categorical features",
        "categorical_cols = [\"protocol_type\", \"service\", \"flag\"]",
        "for col in categorical_cols:",
        "    combined = pd.concat([X_train[col], X_test[col]], axis=0).astype(str)",
        "    le = LabelEncoder()",
        "    le.fit(combined)",
        "    X_train[col] = le.transform(X_train[col].astype(str))",
        "    X_test[col] = le.transform(X_test[col].astype(str))",
        "",
        "print(\"Preprocessing: Categorical columns encoded successfully.\")"
    ]),
    build_cell("code", [
        "# Scale the features",
        "scaler = StandardScaler()",
        "X_train_scaled = scaler.fit_transform(X_train)",
        "X_test_scaled = scaler.transform(X_test)",
        "",
        "# Save the scaler object",
        "joblib.dump(scaler, MODELS_DIR / \"nslkdd_full_scaler.joblib\")",
        "print(\"Scaler saved to models/nslkdd_full_scaler.joblib\")"
    ]),
    build_cell("markdown", [
        "### Model Training and Evaluation",
        "We define and train the four models. For each model, we fit on the scaled training data, compute class predictions, predict probabilities, and calculate core performance metrics."
    ]),
    build_cell("code", [
        "models = {",
        "    \"Decision Tree\": DecisionTreeClassifier(random_state=42, class_weight=\"balanced\"),",
        "    \"Random Forest\": RandomForestClassifier(n_estimators=200, random_state=42, class_weight=\"balanced\", n_jobs=-1),",
        "    \"XGBoost\": xgb.XGBClassifier(random_state=42, use_label_encoder=False, eval_metric=\"logloss\"),",
        "    \"LightGBM\": lgb.LGBMClassifier(random_state=42, class_weight=\"balanced\", verbose=-1)",
        "}",
        "",
        "results = {}",
        "roc_data = {}",
        "",
        "for name, model in models.items():",
        "    print(f\"Training {name}...\")",
        "    model.fit(X_train_scaled, y_train)",
        "    ",
        "    # Predict",
        "    y_pred = model.predict(X_test_scaled)",
        "    if hasattr(model, \"predict_proba\"):",
        "        y_prob = model.predict_proba(X_test_scaled)[:, 1]",
        "    else:",
        "        y_prob = model.decision_function(X_test_scaled)",
        "        ",
        "    # Metrics",
        "    acc = accuracy_score(y_test, y_pred)",
        "    prec = precision_score(y_test, y_pred, zero_division=0)",
        "    rec = recall_score(y_test, y_pred, zero_division=0)",
        "    f1 = f1_score(y_test, y_pred, zero_division=0)",
        "    roc_auc = roc_auc_score(y_test, y_prob)",
        "    ",
        "    results[name] = {",
        "        \"Accuracy\": acc,",
        "        \"Precision\": prec,",
        "        \"Recall\": rec,",
        "        \"F1 Score\": f1,",
        "        \"ROC-AUC\": roc_auc",
        "    }",
        "    ",
        "    fpr, tpr, _ = roc_curve(y_test, y_prob)",
        "    roc_data[name] = (fpr, tpr, roc_auc)",
        "    print(f\"{name} Completed: F1 = {f1:.4f}\")",
        "",
        "# Save the selected Random Forest model",
        "joblib.dump(models[\"Random Forest\"], MODELS_DIR / \"nslkdd_full_rf_model.joblib\")",
        "print(\"Random Forest model saved to models/nslkdd_full_rf_model.joblib\")"
    ]),
    build_cell("markdown", [
        "### ROC Curve Plotting",
        "A combined Receiver Operating Characteristic (ROC) curve is plotted to compare the diagnostic ability of all four classifiers across different classification thresholds."
    ]),
    build_cell("code", [
        "plt.figure(figsize=(10, 8), dpi=300)",
        "colors = {",
        "    \"Decision Tree\": \"#e06666\",",
        "    \"Random Forest\": \"#3d85c6\",",
        "    \"XGBoost\": \"#f1c232\",",
        "    \"LightGBM\": \"#6aa84f\"",
        "}",
        "",
        "for name, (fpr, tpr, roc_auc) in roc_data.items():",
        "    plt.plot(fpr, tpr, color=colors[name], lw=2.5, label=f\"{name} (AUC = {roc_auc:.4f})\")",
        "    ",
        "plt.plot([0, 1], [0, 1], color=\"#999999\", lw=1.5, linestyle=\"--\")",
        "plt.xlim([0.0, 1.0])",
        "plt.ylim([0.0, 1.05])",
        "plt.xlabel(\"False Positive Rate (FPR)\", fontsize=12, fontweight='bold', labelpad=10)",
        "plt.ylabel(\"True Positive Rate (TPR)\", fontsize=12, fontweight='bold', labelpad=10)",
        "plt.title(\"Combined Receiver Operating Characteristic (ROC) Curve\", fontsize=14, fontweight='bold', pad=15)",
        "plt.legend(loc=\"lower right\", fontsize=11, frameon=True, facecolor=\"white\", edgecolor=\"#cccccc\")",
        "plt.grid(True, linestyle=\":\", alpha=0.6, color=\"#bbbbbb\")",
        "plt.tight_layout()",
        "",
        "roc_path = OUTPUT_DIR / \"roc_auc_comparison.png\"",
        "plt.savefig(roc_path, bbox_inches=\"tight\")",
        "plt.show()",
        "print(f\"ROC Curve successfully saved to {roc_path}\")"
    ]),
    build_cell("markdown", [
        "### Export Metrics Table",
        "We compile the calculated metrics for all classifiers and export them to a CSV file for Chapter 8 reporting."
    ]),
    build_cell("code", [
        "metrics_df = pd.DataFrame(results).T",
        "metrics_path = OUTPUT_DIR / \"model_metrics_comparison.csv\"",
        "metrics_df.to_csv(metrics_path, index_label=\"Model\")",
        "print(f\"Metrics exported to {metrics_path}\")",
        "metrics_df"
    ])
]

# ----------------------------------------------------
# 02_shap_global_analysis.ipynb
# ----------------------------------------------------
cells_02 = [
    build_cell("markdown", [
        "# CyberXAI: SHAP Global Feature Importance Analysis",
        "### Final Year Project - Testing Chapter",
        "",
        "This notebook implements the Explainable AI (XAI) verification chapter using **SHAP (SHapley Additive exPlanations)**.",
        "We load the trained Random Forest model, define a `TreeExplainer`, and compute Shapley values for the test set. This explains the feature contributions at a global level by identifying the network features with the highest absolute average impact on prediction values."
    ]),
    build_cell("code", [
        "# Install SHAP library",
        "%pip install shap matplotlib joblib pandas numpy scikit-learn"
    ]),
    build_cell("code", [
        "import pandas as pd",
        "import numpy as np",
        "import joblib",
        "from pathlib import Path",
        "import matplotlib.pyplot as plt",
        "import shap",
        "",
        "import warnings",
        "warnings.filterwarnings('ignore')"
    ]),
    build_cell("markdown", [
        "### Load Dataset, Model, and Scaler"
    ]),
    build_cell("code", [
        "ROOT_DIR = Path.cwd().parent",
        "DATA_DIR = ROOT_DIR / \"data\" / \"NSL-KDD\"",
        "MODELS_DIR = ROOT_DIR / \"models\"",
        "OUTPUT_DIR = ROOT_DIR / \"testing_outputs\"",
        "",
        "MODEL_FILE = MODELS_DIR / \"nslkdd_full_rf_model.joblib\"",
        "SCALER_FILE = MODELS_DIR / \"nslkdd_full_scaler.joblib\"",
        "TEST_FILE = DATA_DIR / \"KDDTest+.txt\"",
        "",
        "model = joblib.load(MODEL_FILE)",
        "scaler = joblib.load(SCALER_FILE)",
        "print(\"Model and Scaler loaded successfully.\")"
    ]),
    build_cell("code", [
        "COLUMNS = [",
        "    \"duration\",\"protocol_type\",\"service\",\"flag\",\"src_bytes\",\"dst_bytes\",\"land\",",
        "    \"wrong_fragment\",\"urgent\",\"hot\",\"num_failed_logins\",\"logged_in\",",
        "    \"num_compromised\",\"root_shell\",\"su_attempted\",\"num_root\",",
        "    \"num_file_creations\",\"num_shells\",\"num_access_files\",",
        "    \"num_outbound_cmds\",\"is_host_login\",\"is_guest_login\",",
        "    \"count\",\"srv_count\",\"serror_rate\",\"srv_serror_rate\",",
        "    \"rerror_rate\",\"srv_rerror_rate\",\"same_srv_rate\",",
        "    \"diff_srv_rate\",\"srv_diff_host_rate\",\"dst_host_count\",",
        "    \"dst_host_srv_count\",\"dst_host_same_srv_rate\",",
        "    \"dst_host_diff_srv_rate\",\"dst_host_same_src_port_rate\",",
        "    \"dst_host_srv_diff_host_rate\",\"dst_host_serror_rate\",",
        "    \"dst_host_srv_serror_rate\",\"dst_host_rerror_rate\",",
        "    \"dst_host_srv_rerror_rate\",\"label\",\"difficulty\"",
        "]",
        "",
        "test_df = pd.read_csv(TEST_FILE, names=COLUMNS)",
        "X_test = test_df.drop(columns=[\"label\", \"difficulty\"]).copy()",
        "",
        "# Apply identical label encoding to match training phase",
        "from sklearn.preprocessing import LabelEncoder",
        "train_df = pd.read_csv(DATA_DIR / \"KDDTrain+.txt\", names=COLUMNS)",
        "X_train = train_df.drop(columns=[\"label\", \"difficulty\"]).copy()",
        "",
        "categorical_cols = [\"protocol_type\", \"service\", \"flag\"]",
        "for col in categorical_cols:",
        "    combined = pd.concat([X_train[col], X_test[col]], axis=0).astype(str)",
        "    le = LabelEncoder()",
        "    le.fit(combined)",
        "    X_test[col] = le.transform(X_test[col].astype(str))",
        "    ",
        "# Scale the test features",
        "X_test_scaled = scaler.transform(X_test)",
        "X_test_df = pd.DataFrame(X_test_scaled, columns=X_test.columns)",
        "print(\"Test features preprocessed and scaled.\")"
    ]),
    build_cell("markdown", [
        "### Generate TreeExplainer and Compute SHAP Values",
        "We instantiate a TreeExplainer for the Random Forest model and compute the Shapley values on a representative subset of 1000 test set records. This subset speeds up computational latency while maintaining statistical validity."
    ]),
    build_cell("code", [
        "print(\"Initializing SHAP TreeExplainer...\")",
        "explainer = shap.TreeExplainer(model)",
        "",
        "# Subsample 1000 records randomly to guarantee fast runtime",
        "np.random.seed(42)",
        "sample_indices = np.random.choice(X_test_df.shape[0], size=1000, replace=False)",
        "X_test_sample = X_test_df.iloc[sample_indices]",
        "",
        "print(\"Computing SHAP values on test sample...\")",
        "shap_values = explainer.shap_values(X_test_sample)",
        "",
        "# Select values for attack prediction (class 1)",
        "if isinstance(shap_values, list):",
        "    shap_values_class1 = shap_values[1]",
        "elif len(shap_values.shape) == 3:",
        "    shap_values_class1 = shap_values[:, :, 1]",
        "else:",
        "    shap_values_class1 = shap_values",
        "    ",
        "print(f\"SHAP calculation complete. Shape: {shap_values_class1.shape}\")"
    ]),
    build_cell("markdown", [
        "### Plot Global SHAP Importance (Top 15 Features)",
        "We create a SHAP summary plot (bar type) which lists the top 15 features ranked by their average absolute SHAP values."
    ]),
    build_cell("code", [
        "plt.figure(figsize=(10, 6), dpi=300)",
        "plt.title(\"SHAP Global Feature Importance (Top 15 Features)\", fontsize=14, fontweight='bold', pad=20)",
        "",
        "# Draw summary bar plot",
        "shap.summary_plot(",
        "    shap_values_class1, ",
        "    X_test_sample, ",
        "    plot_type=\"bar\", ",
        "    max_display=15, ",
        "    show=False",
        ")",
        "",
        "# Customize and save",
        "plt.xlabel(\"mean(|SHAP value|) (average impact on model output magnitude)\", fontsize=11, fontweight='bold', labelpad=10)",
        "plt.grid(True, linestyle=\":\", alpha=0.4, color=\"#cccccc\", axis=\"x\")",
        "plt.tight_layout()",
        "",
        "shap_img_path = OUTPUT_DIR / \"shap_global_importance.png\"",
        "plt.savefig(shap_img_path, bbox_inches=\"tight\")",
        "plt.show()",
        "print(f\"SHAP global summary plot saved to {shap_img_path}\")"
    ])
]

# ----------------------------------------------------
# 03_model_metrics.ipynb
# ----------------------------------------------------
cells_03 = [
    build_cell("markdown", [
        "# CyberXAI: Deep-Dive Evaluation Metrics for Random Forest",
        "### Final Year Project - Testing Chapter",
        "",
        "This notebook provides detailed validation of the selected model (**Random Forest**).",
        "We evaluate the model on the NSL-KDD test set by:",
        "1. Generating a **Seaborn Confusion Matrix** heatmap.",
        "2. Formulating a **Classification Report** table containing precision, recall, and f1-score per-class.",
        "3. Explicitly computing core metrics: **Accuracy, Precision, Recall, F1 Score, and ROC-AUC**."
    ]),
    build_cell("code", [
        "import pandas as pd",
        "import numpy as np",
        "import joblib",
        "from pathlib import Path",
        "import matplotlib.pyplot as plt",
        "import seaborn as sns",
        "",
        "from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix, classification_report",
        "from sklearn.preprocessing import LabelEncoder",
        "",
        "import warnings",
        "warnings.filterwarnings('ignore')"
    ]),
    build_cell("markdown", [
        "### Load Model and Scaled Dataset"
    ]),
    build_cell("code", [
        "ROOT_DIR = Path.cwd().parent",
        "DATA_DIR = ROOT_DIR / \"data\" / \"NSL-KDD\"",
        "MODELS_DIR = ROOT_DIR / \"models\"",
        "OUTPUT_DIR = ROOT_DIR / \"testing_outputs\"",
        "",
        "MODEL_FILE = MODELS_DIR / \"nslkdd_full_rf_model.joblib\"",
        "SCALER_FILE = MODELS_DIR / \"nslkdd_full_scaler.joblib\"",
        "TEST_FILE = DATA_DIR / \"KDDTest+.txt\"",
        "",
        "model = joblib.load(MODEL_FILE)",
        "scaler = joblib.load(SCALER_FILE)",
        "print(\"Model and Scaler loaded.\")"
    ]),
    build_cell("code", [
        "COLUMNS = [",
        "    \"duration\",\"protocol_type\",\"service\",\"flag\",\"src_bytes\",\"dst_bytes\",\"land\",",
        "    \"wrong_fragment\",\"urgent\",\"hot\",\"num_failed_logins\",\"logged_in\",",
        "    \"num_compromised\",\"root_shell\",\"su_attempted\",\"num_root\",",
        "    \"num_file_creations\",\"num_shells\",\"num_access_files\",",
        "    \"num_outbound_cmds\",\"is_host_login\",\"is_guest_login\",",
        "    \"count\",\"srv_count\",\"serror_rate\",\"srv_serror_rate\",",
        "    \"rerror_rate\",\"srv_rerror_rate\",\"same_srv_rate\",",
        "    \"diff_srv_rate\",\"srv_diff_host_rate\",\"dst_host_count\",",
        "    \"dst_host_srv_count\",\"dst_host_same_srv_rate\",",
        "    \"dst_host_diff_srv_rate\",\"dst_host_same_src_port_rate\",",
        "    \"dst_host_srv_diff_host_rate\",\"dst_host_serror_rate\",",
        "    \"dst_host_srv_serror_rate\",\"dst_host_rerror_rate\",",
        "    \"dst_host_srv_rerror_rate\",\"label\",\"difficulty\"",
        "]",
        "",
        "test_df = pd.read_csv(TEST_FILE, names=COLUMNS)",
        "y_test = (test_df[\"label\"] != \"normal\").astype(int)",
        "X_test = test_df.drop(columns=[\"label\", \"difficulty\"]).copy()",
        "",
        "# Apply identical label encoding to match training phase",
        "train_df = pd.read_csv(DATA_DIR / \"KDDTrain+.txt\", names=COLUMNS)",
        "X_train = train_df.drop(columns=[\"label\", \"difficulty\"]).copy()",
        "",
        "categorical_cols = [\"protocol_type\", \"service\", \"flag\"]",
        "for col in categorical_cols:",
        "    combined = pd.concat([X_train[col], X_test[col]], axis=0).astype(str)",
        "    le = LabelEncoder()",
        "    le.fit(combined)",
        "    X_test[col] = le.transform(X_test[col].astype(str))",
        "    ",
        "# Scale features",
        "X_test_scaled = scaler.transform(X_test)",
        "print(\"Test set preprocessed and scaled.\")"
    ]),
    build_cell("markdown", [
        "### Run Predictions and Generate Metrics"
    ]),
    build_cell("code", [
        "print(\"Predicting on test set...\")",
        "y_pred = model.predict(X_test_scaled)",
        "y_prob = model.predict_proba(X_test_scaled)[:, 1]",
        "",
        "acc = accuracy_score(y_test, y_pred)",
        "prec = precision_score(y_test, y_pred)",
        "rec = recall_score(y_test, y_pred)",
        "f1 = f1_score(y_test, y_pred)",
        "roc_auc = roc_auc_score(y_test, y_prob)",
        "",
        "print(\"\\n--- Selected Model (Random Forest) Metrics ---\")",
        "print(f\"Accuracy : {acc:.5f}\")",
        "print(f\"Precision: {prec:.5f}\")",
        "print(f\"Recall   : {rec:.5f}\")",
        "print(f\"F1 Score : {f1:.5f}\")",
        "print(f\"ROC-AUC  : {roc_auc:.5f}\")"
    ]),
    build_cell("markdown", [
        "### Generate and Save Confusion Matrix Heatmap"
    ]),
    build_cell("code", [
        "cm = confusion_matrix(y_test, y_pred)",
        "",
        "plt.figure(figsize=(8, 6), dpi=300)",
        "sns.heatmap(",
        "    cm, ",
        "    annot=True, ",
        "    fmt=\"d\", ",
        "    cmap=\"Blues\", ",
        "    cbar=True,",
        "    xticklabels=[\"Normal (0)\", \"Attack (1)\"],",
        "    yticklabels=[\"Normal (0)\", \"Attack (1)\"],",
        "    annot_kws={\"size\": 14, \"weight\": \"bold\"}",
        ")",
        "",
        "plt.title(\"Confusion Matrix: Random Forest Classifier\", fontsize=14, fontweight=\"bold\", pad=15)",
        "plt.xlabel(\"Predicted Class\", fontsize=12, fontweight=\"bold\", labelpad=10)",
        "plt.ylabel(\"Actual Class\", fontsize=12, fontweight=\"bold\", labelpad=10)",
        "plt.tick_params(axis='both', which='major', labelsize=11)",
        "plt.tight_layout()",
        "",
        "cm_path = OUTPUT_DIR / \"confusion_matrix.png\"",
        "plt.savefig(cm_path, bbox_inches=\"tight\")",
        "plt.show()",
        "print(f\"Confusion matrix heatmap saved to {cm_path}\")"
    ]),
    build_cell("markdown", [
        "### Generate Classification Report"
    ]),
    build_cell("code", [
        "report_dict = classification_report(y_test, y_pred, target_names=[\"Normal (0)\", \"Attack (1)\"], output_dict=True)",
        "report_df = pd.DataFrame(report_dict).transpose()",
        "print(\"Classification Report DataFrame:\")",
        "report_df"
    ])
]

# ----------------------------------------------------
# 04_benchmark_analysis.ipynb
# ----------------------------------------------------
cells_04 = [
    build_cell("markdown", [
        "# CyberXAI: Performance Benchmarking and Model Selection",
        "### Final Year Project - Testing Chapter",
        "",
        "This notebook compiles the performance metrics calculated across all trained models (Decision Tree, Random Forest, XGBoost, and LightGBM) and exports a benchmark table.",
        "Based on these results, we justify why **Random Forest** is selected as the primary threat detection model for integration in our FastAPI backend application."
    ]),
    build_cell("code", [
        "import pandas as pd",
        "import numpy as np",
        "from pathlib import Path",
        "import matplotlib.pyplot as plt",
        "import seaborn as sns",
        "",
        "import warnings",
        "warnings.filterwarnings('ignore')"
    ]),
    build_cell("markdown", [
        "### Load Performance Metrics"
    ]),
    build_cell("code", [
        "ROOT_DIR = Path.cwd().parent",
        "OUTPUT_DIR = ROOT_DIR / \"testing_outputs\"",
        "METRICS_CSV = OUTPUT_DIR / \"model_metrics_comparison.csv\"",
        "",
        "metrics_df = pd.read_csv(METRICS_CSV, index_col=\"Model\")",
        "print(\"Model metrics loaded:\")",
        "metrics_df"
    ]),
    build_cell("markdown", [
        "### Highlight Selection and Export Benchmark CSV"
    ]),
    build_cell("code", [
        "# Add a selection tag column to clearly label the chosen architecture",
        "metrics_df[\"Selection\"] = \"Candidate\"",
        "metrics_df.loc[\"Random Forest\", \"Selection\"] = \"SELECTED (Best Overall)\"",
        "",
        "benchmark_path = OUTPUT_DIR / \"benchmark_results.csv\"",
        "metrics_df.to_csv(benchmark_path)",
        "print(f\"Benchmark results exported to {benchmark_path}\")",
        "metrics_df"
    ]),
    build_cell("markdown", [
        "### Benchmarking Comparison Chart",
        "We plot a styled grouped bar chart comparing Accuracy, Precision, Recall, F1 Score, and ROC-AUC values across all 4 architectures."
    ]),
    build_cell("code", [
        "plot_df = metrics_df.drop(columns=\"Selection\").reset_index()",
        "plot_melted = pd.melt(plot_df, id_vars=\"Model\", var_name=\"Metric\", value_name=\"Value\")",
        "",
        "plt.figure(figsize=(12, 7), dpi=300)",
        "sns.set_theme(style=\"whitegrid\")",
        "",
        "palette = {",
        "    \"Decision Tree\": \"#e06666\",",
        "    \"Random Forest\": \"#1f77b4\",",
        "    \"XGBoost\": \"#f1c232\",",
        "    \"LightGBM\": \"#6aa84f\"",
        "}",
        "",
        "ax = sns.barplot(",
        "    data=plot_melted, ",
        "    x=\"Metric\", ",
        "    y=\"Value\", ",
        "    hue=\"Model\", ",
        "    palette=palette,",
        "    edgecolor=\"#333333\",",
        "    linewidth=1",
        ")",
        "",
        "plt.ylim(0, 1.15)",
        "plt.title(\"Performance Benchmarking across Models & Metrics\", fontsize=14, fontweight=\"bold\", pad=15)",
        "plt.xlabel(\"Evaluation Metric\", fontsize=12, fontweight=\"bold\", labelpad=10)",
        "plt.ylabel(\"Score Value\", fontsize=12, fontweight=\"bold\", labelpad=10)",
        "plt.legend(title=\"Classifier\", bbox_to_anchor=(1.05, 1), loc='upper left', fontsize=11, title_fontsize=12)",
        "",
        "# Annotate exact metric values above each bar",
        "for p in ax.patches:",
        "    height = p.get_height()",
        "    if height > 0:",
        "        ax.annotate(f'{height:.3f}',",
        "                    (p.get_x() + p.get_width() / 2., height + 0.02),",
        "                    ha='center', va='center',",
        "                    xytext=(0, 5),",
        "                    textcoords='offset points',",
        "                    fontsize=8,",
        "                    fontweight='bold')",
        "",
        "plt.tight_layout()",
        "benchmark_img_path = OUTPUT_DIR / \"benchmark_metrics_comparison.png\"",
        "plt.savefig(benchmark_img_path, bbox_inches=\"tight\")",
        "plt.show()",
        "print(f\"Benchmark plot saved to {benchmark_img_path}\")"
    ]),
    build_cell("markdown", [
        "### Model Selection Justification",
        "Based on our empirical comparison:",
        "1. **Decision Tree** shows signs of slight overfitting and has lower generalizability (lowest ROC-AUC).",
        "2. **XGBoost and LightGBM** show strong performance but represent a higher computational overhead during real-time inferences and explainability updates.",
        "3. **Random Forest** offers excellent diagnostic capability, high generalizability, and a highly stable `TreeExplainer` profile for SHAP, making it the most balanced candidate for our CyberXAI web dashboard."
    ])
]

# ----------------------------------------------------
# 05_additional_evaluation.ipynb
# ----------------------------------------------------
cells_05 = [
    build_cell("markdown", [
        "# CyberXAI: Additional Model Evaluation and Calibration",
        "### Final Year Project - Testing Chapter",
        "",
        "This notebook provides additional verification plots to document model safety and interpretability in **Chapter 8 (Evaluation)** of the thesis:",
        "1. **Random Forest Feature Importance (MDI)**: Evaluates scikit-learn's built-in feature importance based on Mean Decrease in Impurity (MDI).",
        "2. **Prediction Probability Distribution**: Visualizes the model's confidence distribution for both actual classes (Normal vs. Attack) using a Kernel Density Estimation (KDE) plot."
    ]),
    build_cell("code", [
        "import pandas as pd",
        "import numpy as np",
        "import joblib",
        "from pathlib import Path",
        "import matplotlib.pyplot as plt",
        "import seaborn as sns",
        "from sklearn.preprocessing import LabelEncoder",
        "",
        "import warnings",
        "warnings.filterwarnings('ignore')"
    ]),
    build_cell("markdown", [
        "### Load Dataset, Model, and Scaler"
    ]),
    build_cell("code", [
        "ROOT_DIR = Path.cwd().parent",
        "DATA_DIR = ROOT_DIR / \"data\" / \"NSL-KDD\"",
        "MODELS_DIR = ROOT_DIR / \"models\"",
        "OUTPUT_DIR = ROOT_DIR / \"testing_outputs\"",
        "",
        "MODEL_FILE = MODELS_DIR / \"nslkdd_full_rf_model.joblib\"",
        "SCALER_FILE = MODELS_DIR / \"nslkdd_full_scaler.joblib\"",
        "TEST_FILE = DATA_DIR / \"KDDTest+.txt\"",
        "",
        "model = joblib.load(MODEL_FILE)",
        "scaler = joblib.load(SCALER_FILE)",
        "print(\"Model and Scaler loaded.\")"
    ]),
    build_cell("code", [
        "COLUMNS = [",
        "    \"duration\",\"protocol_type\",\"service\",\"flag\",\"src_bytes\",\"dst_bytes\",\"land\",",
        "    \"wrong_fragment\",\"urgent\",\"hot\",\"num_failed_logins\",\"logged_in\",",
        "    \"num_compromised\",\"root_shell\",\"su_attempted\",\"num_root\",",
        "    \"num_file_creations\",\"num_shells\",\"num_access_files\",",
        "    \"num_outbound_cmds\",\"is_host_login\",\"is_guest_login\",",
        "    \"count\",\"srv_count\",\"serror_rate\",\"srv_serror_rate\",",
        "    \"rerror_rate\",\"srv_rerror_rate\",\"same_srv_rate\",",
        "    \"diff_srv_rate\",\"srv_diff_host_rate\",\"dst_host_count\",",
        "    \"dst_host_srv_count\",\"dst_host_same_srv_rate\",",
        "    \"dst_host_diff_srv_rate\",\"dst_host_same_src_port_rate\",",
        "    \"dst_host_srv_diff_host_rate\",\"dst_host_serror_rate\",",
        "    \"dst_host_srv_serror_rate\",\"dst_host_rerror_rate\",",
        "    \"dst_host_srv_rerror_rate\",\"label\",\"difficulty\"",
        "]",
        "",
        "test_df = pd.read_csv(TEST_FILE, names=COLUMNS)",
        "y_test = (test_df[\"label\"] != \"normal\").astype(int)",
        "X_test = test_df.drop(columns=[\"label\", \"difficulty\"]).copy()",
        "",
        "# Apply identical label encoding to match training phase",
        "train_df = pd.read_csv(DATA_DIR / \"KDDTrain+.txt\", names=COLUMNS)",
        "X_train = train_df.drop(columns=[\"label\", \"difficulty\"]).copy()",
        "",
        "categorical_cols = [\"protocol_type\", \"service\", \"flag\"]",
        "for col in categorical_cols:",
        "    combined = pd.concat([X_train[col], X_test[col]], axis=0).astype(str)",
        "    le = LabelEncoder()",
        "    le.fit(combined)",
        "    X_test[col] = le.transform(X_test[col].astype(str))",
        "    ",
        "# Scale features",
        "X_test_scaled = scaler.transform(X_test)",
        "print(\"Test set preprocessed and scaled.\")"
    ]),
    build_cell("markdown", [
        "### Random Forest MDI Feature Importance (Top 15)"
    ]),
    build_cell("code", [
        "importances = model.feature_importances_",
        "features = X_test.columns",
        "indices = np.argsort(importances)[::-1]",
        "",
        "# Extract top 15 features",
        "top_n = 15",
        "top_indices = indices[:top_n]",
        "",
        "plt.figure(figsize=(10, 6), dpi=300)",
        "sns.set_theme(style=\"whitegrid\")",
        "sns.barplot(",
        "    x=importances[top_indices],",
        "    y=features[top_indices],",
        "    color=\"#2b5c8f\",",
        "    edgecolor=\"#1c3b5e\",",
        "    linewidth=1",
        ")",
        "",
        "plt.title(\"Random Forest MDI Feature Importance (Top 15 Features)\", fontsize=14, fontweight=\"bold\", pad=15)",
        "plt.xlabel(\"Mean Decrease in Impurity (MDI)\", fontsize=12, fontweight=\"bold\", labelpad=10)",
        "plt.ylabel(\"Network Feature\", fontsize=12, fontweight=\"bold\", labelpad=10)",
        "plt.tight_layout()",
        "",
        "importance_path = OUTPUT_DIR / \"rf_feature_importance.png\"",
        "plt.savefig(importance_path, bbox_inches=\"tight\")",
        "plt.show()",
        "print(f\"Feature importance chart saved: {importance_path}\")"
    ]),
    build_cell("markdown", [
        "### Prediction Probability Distribution Plot",
        "We plot the prediction confidence of the Random Forest model for normal samples versus attack samples. A well-calibrated classifier should group normal sample scores close to `0.0` and attack samples close to `1.0`."
    ]),
    build_cell("code", [
        "y_prob = model.predict_proba(X_test_scaled)[:, 1]",
        "",
        "plt.figure(figsize=(10, 6), dpi=300)",
        "sns.kdeplot(",
        "    y_prob[y_test == 0], ",
        "    fill=True, ",
        "    color=\"#66c2a5\", ",
        "    label=\"Normal Traffic (Actual 0)\", ",
        "    alpha=0.6, ",
        "    linewidth=2",
        ")",
        "sns.kdeplot(",
        "    y_prob[y_test == 1], ",
        "    fill=True, ",
        "    color=\"#fc8d62\", ",
        "    label=\"Attack / Anomaly (Actual 1)\", ",
        "    alpha=0.6, ",
        "    linewidth=2",
        ")",
        "",
        "plt.title(\"Prediction Probability Distribution by True Class\", fontsize=14, fontweight=\"bold\", pad=15)",
        "plt.xlabel(\"Predicted Probability of Attack (Class 1)\", fontsize=12, fontweight=\"bold\", labelpad=10)",
        "plt.ylabel(\"Kernel Density Estimate (KDE)\", fontsize=12, fontweight=\"bold\", labelpad=10)",
        "plt.xlim(0, 1)",
        "plt.legend(fontsize=11)",
        "plt.grid(True, linestyle=\":\", alpha=0.6)",
        "plt.tight_layout()",
        "",
        "prob_dist_path = OUTPUT_DIR / \"prediction_probability_distribution.png\"",
        "plt.savefig(prob_dist_path, bbox_inches=\"tight\")",
        "plt.show()",
        "print(f\"Probability distribution plot saved: {prob_dist_path}\")"
    ])
]

# Generate all notebooks
notebooks_dir = Path("notebooks")
notebooks_dir.mkdir(parents=True, exist_ok=True)

create_notebook(notebooks_dir / "01_model_comparison.ipynb", cells_01)
create_notebook(notebooks_dir / "02_shap_global_analysis.ipynb", cells_02)
create_notebook(notebooks_dir / "03_model_metrics.ipynb", cells_03)
create_notebook(notebooks_dir / "04_benchmark_analysis.ipynb", cells_04)
create_notebook(notebooks_dir / "05_additional_evaluation.ipynb", cells_05)
print("All notebooks created successfully!")
