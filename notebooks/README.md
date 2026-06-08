# CyberXAI — Google Colab Training

Use this notebook instead of local VS Code for **NSL-KDD data preparation and model training**.

## Why Colab?

- No local Python/venv setup issues
- Free GPU/CPU for training
- Easy file upload for large datasets
- Same output files as `backend/train_model.py`

## Steps

1. Open [Google Colab](https://colab.research.google.com/)
2. **File → Upload notebook** → select `CyberXAI_NSL-KDD_Training.ipynb`
3. Download NSL-KDD files from [UNB CIC](https://www.unb.ca/cic/datasets/nsl.html):
   - `KDDTrain+.txt`
   - `KDDTest+.txt`
4. Run cells in order:
   - **Option A** — upload both `.txt` files directly
   - **Option B** — mount Google Drive if files are already there
5. Train the model and download `cyberxai_model_artifacts.zip`
6. Copy extracted files into your project:

```
CyberXAI/
  models/
    nslkdd_4f_rf_model.joblib
    nslkdd_4f_features.json
    nslkdd_4f_sample_input.csv
```

7. Restart the FastAPI backend so it loads the new model:

```bash
cd backend
uvicorn main:app --reload
```

## Local training (optional)

You can still run locally if data is in `data/NSL-KDD/`:

```bash
cd backend
python train_model.py
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `File not found: KDDTrain+.txt` | Run Option A upload or fix Drive path in Option B |
| Backend says "Model file not found" | Copy `.joblib` into `models/` folder |
| Low accuracy in demo | Expected with only 4 features — document this in FYP report |
