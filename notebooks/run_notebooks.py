import sys
import subprocess
from pathlib import Path

# Ensure dependencies for running notebooks are present
try:
    import nbformat
    from nbconvert.preprocessors import ExecutePreprocessor
except ImportError:
    print("Installing nbformat and nbconvert to execute notebooks...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "nbformat", "nbconvert"])
    import nbformat
    from nbconvert.preprocessors import ExecutePreprocessor

# Install and register the python3 ipykernel
try:
    import ipykernel
except ImportError:
    print("Installing ipykernel...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "ipykernel"])
print("Registering python3 kernel...")
subprocess.check_call([sys.executable, "-m", "ipykernel", "install", "--user", "--name", "python3"])

notebooks_dir = Path("notebooks")
output_dir = Path("testing_outputs")
output_dir.mkdir(parents=True, exist_ok=True)

notebooks = [
    "01_model_comparison.ipynb",
    "02_shap_global_analysis.ipynb",
    "03_model_metrics.ipynb",
    "04_benchmark_analysis.ipynb",
    "05_additional_evaluation.ipynb"
]

print("Starting sequential notebook execution...")

for nb_name in notebooks:
    nb_path = notebooks_dir / nb_name
    print(f"\n==========================================")
    print(f"Executing: {nb_name}")
    print(f"==========================================")
    
    with open(nb_path, "r", encoding="utf-8") as f:
        nb = nbformat.read(f, as_version=4)
        
    # Execute the notebook in the context of the notebooks directory
    ep = ExecutePreprocessor(timeout=600, kernel_name="python3")
    try:
        ep.preprocess(nb, {"metadata": {"path": str(notebooks_dir.resolve())}})
        
        # Write back the executed notebook so the outputs are saved inside the notebook files
        with open(nb_path, "w", encoding="utf-8") as f_out:
            nbformat.write(nb, f_out)
        print(f"SUCCESS: {nb_name} completed and updated with cell execution outputs.")
    except Exception as e:
        print(f"FAILED: {nb_name} failed with error:")
        print(e)
        sys.exit(1)

print("\nAll notebooks executed successfully and outputs are verified!")
