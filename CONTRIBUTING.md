# Contributing to EcoSort

Thank you for your interest in contributing to **EcoSort: Decision-Aware, Constraint-Validated Batch Waste Sorting and Collection Planning System**.

## Development Principles & Guidelines

1. **Academic Truthfulness**: Never fabricate model accuracy, experimental results, regulatory rules, facility coordinates, or travel distances.
2. **Modular Architecture**: Maintain clean architectural separation between:
   - Computer Vision inference (`backend/app/ml/`, `backend/app/detection/`)
   - Deterministic rule engine (`backend/app/rules/`)
   - Mathematical optimization solver (`backend/app/optimizer/`)
   - Geospatial facility routing (`backend/app/geospatial/`)
   - Autonomous LLM consensus verification (`backend/app/agent/`)
   - Frontend presentation & studio (`frontend/src/`)
3. **Reproducibility**: All critical algorithms must have companion unit and integration tests under `backend/tests/`.

## Local Setup & Development

### Backend (Python 3.9+)
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Running Backend Tests
```bash
cd backend
pytest -v
```

### Frontend (React 19 + TypeScript + Vite)
```bash
cd frontend
npm install
npm run dev
```

### Building Frontend
```bash
cd frontend
npm run build
```

## Pull Request Guidelines

1. Ensure all 73 backend tests pass (`pytest -v`).
2. Ensure the frontend builds cleanly without TypeScript or Lint errors (`npm run build`).
3. Commit messages should adhere to Conventional Commits:
   - `feat(...)`: New feature or algorithm
   - `fix(...)`: Bug fix or accuracy calibration
   - `docs(...)`: Documentation updates
   - `test(...)`: Test suite additions
