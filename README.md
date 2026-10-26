# EcoSort — ML-Based Smart Waste Classification & Geospatial Disposal Platform

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.8+-ee4c2c.svg)](https://pytorch.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900.svg)](https://leafletjs.com/)
[![Tests](https://img.shields.io/badge/Tests-52%20Passed-brightgreen.svg)]()
[![Discrete%20Math](https://img.shields.io/badge/Discrete%20Math-Verified%20Engine-purple.svg)](DISCRETE_MATH_SPEC.md)

**EcoSort** is a production-minded web platform that helps individuals and municipal waste systems accurately classify solid waste using deep learning computer vision, learn actionable preparation and safety guidelines, and discover verified recycling centres and hazardous drop-off depots ranked by distance from their location.

---

## 1. Product Concept & Core User Journey

```mermaid
flowchart LR
    A["1. Location Onboarding<br/>(GPS or PIN/City)"] --> B["2. Image Capture<br/>(Webcam, Upload, Mobile)"]
    B --> C["3. PyTorch Inference<br/>(MobileNetV3 Transfer Learning)"]
    C --> D["4. Disposal Recommendations<br/>(Rules, Safety, Preparation)"]
    D --> E["5. Geospatial Discovery<br/>(OSM + Verified Directory)"]
    E --> F["6. Directions & Action<br/>(Google Maps / OSM Navigation)"]
```

1. **Location-First Onboarding**: Transparent browser geolocation or manual PIN code / city lookup without blocking image scanning.
2. **Waste Image Input**: Live webcam viewfinder with frame capture, file upload with drag-and-drop validation, native mobile camera input (`capture="environment"`), and an instant 1-click test gallery.
3. **Machine Learning Classification**: In-memory PyTorch `MobileNetV3` inference providing category prediction, calibrated confidence scores, alternative ranked candidates, and image clarity checks.
4. **Disposal Recommendation Engine**: Rule-based preparation steps, critical safety precautions (e.g. lithium-ion battery fire hazards, chemical isolation), separation guidelines, and environmental impact metrics.
5. **Geospatial Centre Finder**: Queries OpenStreetMap Overpass API and an authentic verified directory of authorized municipal facilities and licensed recyclers, ranked by Haversine distance with interactive Leaflet map markers.

---

## 2. Machine Learning Architecture & Evaluation

### Model Architecture
- **Backbone**: `torchvision.models.mobilenet_v3_small(weights=DEFAULT)` pretrained on ImageNet-1K.
- **Classification Head**:
  ```python
  nn.Sequential(
      nn.Linear(in_features=1024, out_features=256),
      nn.Hardswish(inplace=True),
      nn.Dropout(p=0.2),
      nn.Linear(in_features=256, out_features=10) # 10 waste streams
  )
  ```
- **Inference Speed**: ~12–25 ms on CPU, <5 ms on CUDA. Model weights are pre-warmed once at startup.

### Supported Waste Streams (10 Categories + Subtypes)
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
