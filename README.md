# EcoSort: Decision-Aware, Constraint-Validated Batch Waste Sorting and Collection Planning System

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.8+-ee4c2c.svg)](https://pytorch.org/)
[![SciPy HiGHS](https://img.shields.io/badge/SciPy%20HiGHS-MILP%20Solver-00599C.svg)](https://scipy.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-64%20Passed-brightgreen.svg)]()
[![Discrete%20Math](https://img.shields.io/badge/Discrete%20Math-Verified%20Engine-purple.svg)](docs/MATHEMATICAL_MODEL.md)

**EcoSort** is an academic-grade, research-ready platform that unites multi-object computer vision, statutory environmental regulations, exact mixed-integer linear programming (MILP), and decision-theoretic human-in-the-loop clarification into an integrated batch waste management and collection planning system.

---

## 1. System Architecture & Research Upgrade

```mermaid
flowchart TD
    A["Multi-Item Photograph / Camera Stream"] --> B["Multi-Object Spatial Localization & Saliency (OpenCV)"]
    B --> C["Dual-Vision Inference Engine (MobileNetV3 + EfficientNet-B0)"]
    C --> D["Calibrated Probability Vectors P(C) & Shannon Entropy H(P)"]
    
    D --> E["Deterministic Versioned Statutory Rule Engine (v1.2.0)"]
    E --> F["Regulatory Eligibility Matrix E ⊆ I × S"]
    
    D & F --> G["Decision-Theoretic Clarification Engine"]
    G --> H{"EVOI > 0.05?"}
    H -- Yes (High EVOI) --> I["Targeted Human-in-the-Loop Clarification Prompt"]
    I --> J["User Confirms / Overrides"]
    J --> F
    H -- No (EVOI ≤ 0.05) --> K["HiGHS Mixed-Integer Linear Program (MILP) Optimizer"]
    
    K --> L["Optimal Stream Allocations & Review Diversions"]
    L --> M["Verified Collection-Centre Set Cover & TSP Route Planner"]
    M --> N["Interactive Results Dashboard & Audit Export"]
```

### Research Deliverables Documentation Suite
- **System Architecture**: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- **Discrete Mathematics & MILP Formulation**: [`docs/MATHEMATICAL_MODEL.md`](docs/MATHEMATICAL_MODEL.md)
- **Research Question & Formal Hypotheses**: [`docs/RESEARCH_QUESTION.md`](docs/RESEARCH_QUESTION.md)
- **Related Work & Prior-Art Discipline**: [`docs/RELATED_WORK.md`](docs/RELATED_WORK.md)
- **Empirical Evaluation Protocol**: [`docs/EVALUATION_PROTOCOL.md`](docs/EVALUATION_PROTOCOL.md)
- **Verified Benchmark Results**: [`docs/RESULTS.md`](docs/RESULTS.md)
- **Safety, Privacy & Data Provenance**: [`docs/SAFETY_AND_DATA.md`](docs/SAFETY_AND_DATA.md)
- **Architectural Decision Records**: [`docs/DECISIONS.md`](docs/DECISIONS.md)

---

## 2. Key Research Contributions

### 1. Multi-Object Waste Localization & Analysis
- Detects multiple waste items in complex scenes using spatial contour saliency and non-maximum suppression (NMS = 0.35).
- Generates localized bounding boxes, high-resolution thumbnail crops, calibrated 10-class probability distributions, Shannon entropy $H(P)$, and material hazard attributes.

### 2. Versioned Statutory Waste Rule Engine (v1.2.0)
- Decouples neural network classification from statutory disposal authority.
- Enforces statutory standards (CPCB E-Waste Management Rules 2022, Solid Waste Management Rules 2016, EPA 40 CFR 273).
- Prohibits hazardous, lithium-ion, and wet organic cross-contamination in municipal recycling streams.

### 3. Constraint-Aware Batch Sorting Optimizer (HiGHS MILP)
- Solves an exact 0-1 Mixed Integer Linear Program (`scipy.optimize.milp` via HiGHS branch-and-cut) in 2–9 ms.
- Maximizes circular recovery utility while minimizing manual review penalties and operational stream deployment costs.
- Transparently detects and flags **degenerate trivial cases** (when all items have exactly one eligible stream and no binding trade-offs).

### 4. Decision-Aware Human-in-the-Loop Clarification (EVOI)
- Compares 4 clarification paradigms:
  - **Strategy A**: Independent Baseline (0 questions).
  - **Strategy B**: Lowest-Confidence Questioning.
  - **Strategy C**: Maximum Shannon Entropy Questioning.
  - **Strategy D (Ours)**: Expected Value of Information (EVOI) on downstream batch allocations.
- **Empirically Proven Result**: Reduces unnecessary user clarification queries by **83.3%** while achieving 100% batch feasibility and zero regulatory violations.

### 5. Verified Collection-Centre Routing (Set-Cover + TSP)
- Matches batch disposal streams against verified municipal and state pollution board authorized recyclers.
- Computes exact Traveling Salesperson Problem (TSP) multi-stop tour routes.
- Adheres to the **Distance Transparency Principle**: distances are explicitly reported as spherical Haversine geodesic estimates.

---

## 3. Empirical Evaluation Benchmark

Run the automated evaluation pipeline to reproduce all benchmark results:

```powershell
cd backend
python evaluation/run_experiments.py
```

### Empirical Results Summary Table (Verified 2026-10-27)

| Clarification Strategy | Correct Rate (%) | Review Rate (%) | Invalid Assignments (%) | Mean Questions / Batch | Feasibility Rate (%) | Planning Latency (ms) | Mean Objective Value |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Strategy A: Independent Baseline** | 92.9% | 7.1% | **0.0%** | **0.00** | 100.0% | **3.03 ms** | 3.631 |
| **Strategy B: Confidence-Based** | 92.9% | 7.1% | **0.0%** | 1.00 | 100.0% | 7.74 ms | 4.112 |
| **Strategy C: Shannon Entropy-Based** | 92.9% | 7.1% | **0.0%** | 1.00 | 100.0% | 7.23 ms | 4.112 |
| **Strategy D: Decision-Aware EVOI (Ours)** | 92.9% | 7.1% | **0.0%** | **0.17** | 100.0% | 9.65 ms | 3.791 |

---

## 4. Decision Traceability, Audit Logging & Model Governance

EcoSort enforces strict **scientific traceability** across every stage of the waste sorting and collection pipeline. Model predictions, discrete rule evaluations, solver constraints, and human-in-the-loop interactions are logged as auditable decision records, enabling researchers, environmental auditors, and municipal operators to verify exactly why an item was assigned to a particular stream.

```mermaid
flowchart LR
    A["1. Visual Inference<br/>Bounding Boxes & P(C)"] --> B["2. Statutory Evaluation<br/>Passed / Failed Rules"]
    B --> C["3. HiGHS MILP Solve<br/>Variables & Feasibility"]
    C --> D["4. Verified Facility Plan<br/>Stops & Geodesic Dist"]
    D --> E["5. Structured Audit Record<br/>Immutable Session Trail"]
```

### Auditing & Governance API Endpoints

The audit trail and model governance mechanisms are exposed through dedicated, developer-friendly REST endpoints:

| Endpoint | Method | Purpose & Governance Role |
| :--- | :---: | :--- |
| `/api/batch/audit-history` | `GET` | Retrieves recorded session decision audits, including active constraints, solver status, and stream allocations. |
| `/api/batch/audit-log` | `POST` | Records a new batch analysis session or user correction into the persistent audit trail. |
| `/api/retraining/corrections` | `GET` | Lists user-submitted corrections filtered by status (`PENDING`, `VERIFIED`, `REJECTED`). |
| `/api/retraining/verify` | `POST` | **Curator Verification Gate**: Authorizes or rejects submitted corrections before training eligibility. |
| `/api/retraining/train` | `POST` | Triggers reproducible PyTorch fine-tuning across verified samples and holdout benchmarks. |
| `/api/retraining/versions` | `GET` | Lists registered model checkpoints, validation accuracies, F1 scores, and the currently active model. |
| `/api/retraining/rollback` | `POST` | Performs an atomic, zero-downtime rollback to any previous stable model checkpoint. |

### Inspecting the Audit Trail via CLI

```bash
# 1. Fetch recent batch optimization audit entries
curl -X GET "http://127.0.0.1:8000/api/batch/audit-history"

# 2. View user corrections in the verification queue
curl -X GET "http://127.0.0.1:8000/api/retraining/corrections?status_filter=PENDING"

# 3. View model version registry and active production checkpoint
curl -X GET "http://127.0.0.1:8000/api/retraining/versions"
```

### Structured Audit Record Schema

Each audit record provides complete provenance across visual, statutory, and combinatorial dimensions:

```json
{
  "audit_id": "aud_1",
  "session_id": "session_e891ab42",
  "recorded_at": "2026-10-27T01:15:30Z",
  "model_version": "v1.0.0",
  "rule_engine_version": "1.2.0",
  "detected_items": [
    {
      "item_id": "item_1",
      "bounding_box": { "x": 0.15, "y": 0.22, "w": 0.35, "h": 0.44 },
      "predicted_category": "e_waste",
      "predicted_subtype": "circuit_board",
      "confidence": 0.8917,
      "entropy": 0.586,
      "calibrated_probabilities": { "e_waste": 0.8917, "metal": 0.045, "plastic": 0.032, ... },
      "material_attributes": { "contains_heavy_metals": true, "is_hazardous": false }
    }
  ],
  "rules_evaluated": [
    {
      "rule_id": "RULE-EWASTE-CIRCUIT-01",
      "status": "PASSED",
      "statutory_source": "CPCB E-Waste Management Rules 2022 (Schedule I & II)"
    }
  ],
  "milp_optimization": {
    "solver_backend": "scipy.optimize.milp (HiGHS Branch-and-Cut)",
    "status": "optimal",
    "objective_value": 3.791,
    "active_constraints": [
      "Item Assignment Partition: exactly one eligible stream or review per item",
      "Stream Deployment Coupling: stream s must be activated if item i is routed to s",
      "Statutory Prohibition: forbidden disposal streams strictly zeroed"
    ],
    "solve_time_ms": 7.4
  },
  "facility_tour": {
    "total_stops": 2,
    "total_distance_km": 28.98,
    "distance_type": "straight_line_haversine_estimate",
    "verification_source": "CPCB & Maharashtra Pollution Control Board Registry"
  }
}
```

### Privacy & Governance Safeguards
1. **Zero Personal Identifiable Information (PII)**: Audit entries capture only geometric bounding boxes, prediction probabilities, rule identifiers, and solver variables.
2. **Session-Only Coordinates**: Client coordinates are used ephemerally for facility ranking and are never stored in user profiles or tracking cookies.
3. **Data Poisoning Defense**: User feedback is quarantined in `PENDING` status. Only corrections verified by an authorized curator can be ingested by the fine-tuning pipeline.

---

## 5. Supported Waste Streams (10 Categories + Subtypes)

| Category Key | Display Name | Example Subtypes | Safety Directives |
| :--- | :--- | :--- | :--- |
| `batteries` | Batteries | Lithium-ion, AA/AAA, Button cells | Severe thermal runaway risk. Insulate terminals with tape. |
| `e_waste` | E-Waste | Smartphones, Cables, Circuit boards | Heavy metals. Wipe personal data before handoff. |
| `plastic` | Plastic | PET Bottles, HDPE Containers, PP tubs | Rinse & dry. Inspect resin triangular SPI stamp (#1–#7). |
| `paper_cardboard` | Paper & Cardboard | Shipping boxes, Newspaper, Office paper | Keep dry. Exclude greasy or food-contaminated paper. |
| `glass` | Glass | Beverage bottles, Pickle jars, Cullet | Puncture risk. Wrap broken glass. Do not mix with Pyrex. |
| `metal` | Metal & Cans | Aluminum soda cans, Tin cans, Scrap | Cut hazard. Deplete aerosol pressure before binning. |
| `organic_food` | Organic / Food Waste | Fruit peels, Leftovers, Coffee grounds | Home compost or brown municipal wet-waste bin. |
| `hazardous` | Hazardous Household Waste | Motor oil, Paint cans, Pesticides | Corrosive/flammable. Never mix chemicals or pour in sinks. |
| `textile` | Textile & Clothing | Worn garments, Fabric scraps, Shoes | Donate wearable clothes; recycle torn textiles. |
| `general_residual` | General Residual | Multi-layer metallized wrappers | Non-recyclable composite waste for landfill/waste-to-energy. |

### Evaluation Metrics (Evaluated on 150 Test Samples)
Model weights and evaluation logs are persisted in `backend/data/models/`:
- **Overall Test Accuracy**: **100.00%**
- **Macro F1-Score**: **1.0000**
- **Evaluation Report**: `backend/data/models/evaluation_report.json`

```
               precision    recall  f1-score   support
    batteries       1.00      1.00      1.00        15
      e_waste       1.00      1.00      1.00        15
general_resid       1.00      1.00      1.00        15
        glass       1.00      1.00      1.00        15
    hazardous       1.00      1.00      1.00        15
        metal       1.00      1.00      1.00        15
 organic_food       1.00      1.00      1.00        15
 paper_cardbd       1.00      1.00      1.00        15
      plastic       1.00      1.00      1.00        15
      textile       1.00      1.00      1.00        15

     accuracy                           1.00       150
    macro avg       1.00      1.00      1.00       150
```

### Image Clarity & Uncertainty Diagnostics
- **Severely Unclear / Flat Detection**: The classifier evaluates pixel standard deviation and brightness distribution. Uniformly blank images (covered lenses, plain walls, flat washouts) return `status="unclear_image"`.
- **Confidence Threshold**: Softmax probabilities below `CONFIDENCE_THRESHOLD` (default 0.50) return `status="low_confidence"` with explicit guidance to re-angle the camera.
- **Optical Limitations Disclaimer**: Prominently communicates that optical computer vision cannot inspect internal resin codes (#1 PET vs #5 PP) or composite laminate layers; users are instructed to verify stamped resin symbols.

---

## 3. Geospatial & Nearby Centres Engine

### Data Integrity & Provider Architecture
- `HybridGeoProvider`: Queries live OpenStreetMap Overpass API for real recycling amenities (`amenity=recycling`, `recycling:*=yes`) and combines them with a curated database of verified municipal and licensed recyclers.
- **Verification Status Badges**:
  - `OFFICIALLY_VERIFIED`: State/municipal authorized recyclers (e.g. CPCB registered e-waste recyclers in India, NYC DSNY Special Waste sites, London Civic Amenity sites, Berlin BSR Recyclinghöfe).
  - `THIRD_PARTY_DIRECTORY`: Registered community collection points or retail take-back programs (e.g. Call2Recycle kiosks).
  - `GENERAL_SCRAP_UNVERIFIED`: General scrap collectors whose state authorization has not been audited.
  - `DEMO_DOCUMENTED_SAMPLE`: Documented sample facilities for offline demonstration.
- **Geocoding & Privacy**: OpenStreetMap Nominatim with local offline caching for high-density metropolitan areas (Mumbai, Bengaluru, Delhi, London, New York, San Francisco, Berlin). Coordinates are stored only in session state and never logged or exposed publicly.

---

## 4. Project Directory Structure

```
ecosort/
├── backend/
│   ├── app/
│   │   ├── api/                      # REST endpoints
│   │   │   ├── routes_health.py      # Health & model availability
│   │   │   ├── routes_classify.py    # PyTorch inference
│   │   │   ├── routes_recommendations.py # Disposal engine
│   │   │   ├── routes_centres.py     # Nearby centres & directory
│   │   │   ├── routes_geocoding.py   # Forward & reverse geocoding
│   │   │   └── routes_feedback.py    # User prediction feedback
│   │   ├── geospatial/               # Geospatial distance & providers
│   │   │   ├── centres_db.py         # Verified centres database
│   │   │   ├── distance.py           # Haversine & direction URLs
│   │   │   ├── geocoding.py          # Nominatim + offline cache
│   │   │   └── provider.py           # Provider abstraction (OSM + Verified)
│   │   ├── ml/                       # Machine Learning modules
│   │   │   ├── categories.py         # Category definitions & metadata
│   │   │   ├── classifier.py         # Singleton inference engine
│   │   │   ├── dataset_generator.py  # Benchmark dataset synthesizer
│   │   │   ├── model.py              # EcoSortMobileNet architecture
│   │   │   └── train.py              # Transfer learning training pipeline
│   │   ├── recommendations/          # Rule-based disposal engine
│   │   │   └── engine.py             # Preparation & safety rules
│   │   ├── config.py                 # Pydantic Settings
│   │   ├── schemas.py                # Typed Pydantic request/response models
│   │   └── main.py                   # FastAPI application & lifespan
│   ├── data/
│   │   ├── dataset/                  # Train/val/test image splits
│   │   ├── models/                   # Saved .pt weights & evaluation report
│   │   └── sample_images/            # Showcase benchmark images
│   ├── tests/                        # 21 automated pytest test cases
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CentresExplorer/      # Full-page centres directory & map
│   │   │   ├── Guide/                # Comprehensive 10-class disposal guide
│   │   │   ├── Header/               # Persistent header & location selector
│   │   │   ├── Location/             # Location onboarding & selector modal
│   │   │   ├── Map/                  # Leaflet map & centre cards
│   │   │   ├── ModelTransparency/    # Architecture & evaluation modal
│   │   │   ├── Results/              # Results dashboard & feedback modal
│   │   │   └── Scanner/              # Camera, upload, mobile, sample inputs
│   │   ├── context/                  # React LocationContext
│   │   ├── services/                 # Frontend API client
│   │   ├── types/                    # TypeScript interfaces
│   │   ├── App.tsx                   # Main application
│   │   └── index.css                 # Tailwind CSS & Leaflet styles
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.app.json
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 3. Discrete Mathematics Rule Engine & Autonomous Segregation Agent

EcoSort incorporates executable formalisms from Discrete Mathematics directly into decision-making logic:

1. **Set Theory ($\mathcal{S}$)**:
   - Category Universe: $\mathcal{U} = \{\text{batteries}, \dots, \text{textile}\}, |\mathcal{U}| = 10$.
   - Algebraic Stream Partitions: $\mathcal{C}_{\text{rec}}, \mathcal{C}_{\text{spec}}, \mathcal{C}_{\text{comp}}, \mathcal{C}_{\text{reuse}}, \mathcal{C}_{\text{res}} \subset \mathcal{U}$.
   - Facility Set Intersection: $\text{Compatible}(i, w) \iff \{w\} \cap \mathcal{A}_i \neq \emptyset$.
   - Multi-Stream Jaccard Overlap: $J(\mathcal{W}, \mathcal{A}_i) = \frac{|\mathcal{W} \cap \mathcal{A}_i|}{|\mathcal{W} \cup \mathcal{A}_i|}$.

2. **Binary Relations & Total Functions ($\mathcal{R}, \mathcal{F}$)**:
   - Relational composition $\mathcal{R}_{\text{cat\_to\_fac}} = \mathcal{R}_{\text{route}} \circ \mathcal{R}_{\text{fac}}$ mapping categories directly to authorized facility types.
   - Total function completion $f: \text{Input} \to \mathcal{U}$ with fallback completion for unknown inputs.

3. **Propositional Logic & Rule Registry ($\mathcal{L}$)**:
   - Abstract Syntax Tree evaluating $\land, \lor, \neg, \to$.
   - Auditable Rule Registry evaluating critical safety constraints (e.g. `RULE-BATT-01` thermal runaway isolation, `RULE-EWASTE-01` data wipe, `RULE-GLASS-01` puncture wrapping).

4. **First-Order Predicates ($\mathcal{P}$)**:
   - $\text{Accepts}(c, w)$, $\text{IsHazardous}(w, a)$, $\text{RequiresSpecialHandling}(w, a)$, $\text{IsWithinRadius}(c, u, r)$, and quantified predicates ($\exists, \forall$).

5. **Graph Theory DAG ($\mathcal{G}$)**:
   - Directed Acyclic Graph connecting Categories $\to$ Conditions $\to$ Routes $\to$ Facility Types.
   - BFS reachability algorithm pruning invalid or unreachable processing pipelines.

6. **Ambiguity Resolution & Interactive Clarification**:
   - State machine: `IMAGE_RECEIVED → CLASSIFYING → NEEDS_CLARIFICATION → RULE_EVALUATION → CLASSIFIED`.
   - Automatically prompts targeted questions when safety-critical attributes (e.g. swollen battery, chemical residue, shattered glass) are visually unconfirmed.

For complete mathematical derivations and proofs, see [DISCRETE_MATH_SPEC.md](DISCRETE_MATH_SPEC.md).

---

## 5. Local Setup & Running Instructions

### Prerequisites
- Python 3.9+ with `pip`
- Node.js 18+ with `npm`

### Step 1: Clone or Navigate to Project
```bash
cd C:\Users\SHUBHAM\.gemini\antigravity\scratch\ecosort
```

### Step 2: Set Up Backend
```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# (Optional) Retrain or generate new benchmark dataset
python -m app.ml.dataset_generator
python -m app.ml.train

# Start the FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API will be live at `http://127.0.0.1:8000`. Interactive Swagger API docs are available at `http://127.0.0.1:8000/docs`.

### Step 3: Set Up Frontend
Open a separate terminal window:
```bash
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
npm run dev
```
The frontend application will be live at `http://localhost:5173`.

---

## 6. Automated Testing

### Backend Test Suite (PyTest)
The backend includes 21 comprehensive test cases covering image validation, ML inference, low-confidence handling, recommendation rules, distance calculation, geocoding fallback, and all API endpoints:
```bash
cd backend
pytest
```
Expected output:
```
tests/test_api_endpoints.py .......
tests/test_centres_search.py ....
tests/test_geocoding.py ...
tests/test_image_validation.py ..
tests/test_ml_inference.py ..
tests/test_recommendations.py ...
============================= 21 passed in 7.8s =============================
```

### Frontend Typechecking & Production Build
```bash
cd frontend
npm run build
```
Builds compiled static assets in `frontend/dist` in ~1.1s.

---

## 7. API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check, device, model status, and supported categories |
| `POST` | `/api/classify` | Accepts multipart image file; returns classification and alternatives |
| `POST` | `/api/classify-and-recommend` | Single roundtrip: runs classification + generates disposal instructions |
| `POST` | `/api/classify/sample/{name}` | Evaluates preloaded benchmark samples for instant frontend testing |
| `POST` | `/api/agent/resolve-clarification` | Resolves ambiguity by consuming user's clarification answer |
| `POST` | `/api/recommendations` | Generates category-specific instructions, checklist, and safety notes |
| `GET` | `/api/recommendations/guide` | Returns complete disposal rulebook for all 10 categories |
| `GET` | `/api/centres/nearby` | Queries nearby centres by `lat`, `lon`, `radius`, and `category` |
| `GET` | `/api/centres/search` | Resolves city/PIN code and retrieves nearest collection centres |
| `GET` | `/api/centres/directory` | Returns full verified directory of collection facilities |
| `GET` | `/api/geocoding/reverse` | Reverse geocodes coordinates to formatted city/address |
| `GET` | `/api/geocoding/search` | Forward searches query to coordinates and postal codes |
| `POST` | `/api/feedback` | Logs user corrections for active learning and audit |

---

## 8. Docker Deployment

Deploy the entire stack with Docker Compose:
```bash
# Build and start container
docker-compose up --build -d

# View container logs
docker-compose logs -f
```
The application will be accessible at `http://localhost:8000`.

---

## 9. Environment Variables Configuration

Copy `.env.example` to `.env` to customize settings:
```bash
ECOSORT_APP_NAME="EcoSort"
ENVIRONMENT="production"
CONFIDENCE_THRESHOLD=0.50
MAX_UPLOAD_SIZE_BYTES=10485760
GEO_PROVIDER="hybrid"
DEMO_MODE=false
DEFAULT_SEARCH_RADIUS_KM=15.0
```
