# EcoSort Project Architecture & File Directory

EcoSort is an intelligent waste classification, statutory compliance, and geospatial collection planning system designed for multi-stream circular waste management.

---

## 1. Root Configuration & Deployment

| File / Folder | Purpose & Architectural Role |
| :--- | :--- |
| `docker-compose.yml` | Multi-container orchestration for running the FastAPI backend and Vite frontend together. |
| `Dockerfile` | Multi-stage production container build (Stage 1: Node.js frontend build; Stage 2: Python runtime). |
| `.env.example` | Template for environment variables (API keys, ports, model paths, geocoding provider). |
| `.gitignore` | Git exclusions for secrets, local dependencies (`node_modules`), caches, and compiled weights. |
| `.devcontainer/` | Development container configuration for GitHub Codespaces and local VS Code dev containers. |
| `CONTRIBUTING.md` | Guidelines for code quality, branch workflows, and PR standards. |
| `LICENSE` | MIT Open-Source software license. |
| `README.md` | Comprehensive project overview, quickstart instructions, and architecture guide. |
| `PROJECT_STRUCTURE.md` | Complete architectural index mapping every directory and file to its purpose. |
| `DISCRETE_MATH_SPEC.md` | Formal mathematical specification for discrete math concepts implemented in EcoSort. |
| `IMPLEMENTATION_AUDIT.md` | Verification audit validating requirements, test coverage, and mathematical invariants. |
| `IMPLEMENTATION_CHANGELOG.md` | Engineering changelog tracking architectural enhancements, features, and fixes. |

---

## 2. Backend Service (`/backend`)

The backend is built with **FastAPI**, **PyTorch**, **Ultralytics YOLOv8**, **HiGHS MILP Optimizer**, and **NetworkX**.

### Root Files
* `run_server.py`: Standalone CLI runner to start the Uvicorn ASGI server (`uvicorn.run("app.main:app")`).
* `requirements.txt`: Python package dependencies (FastAPI, PyTorch, torchvision, ultralytics, scipy, networkx, etc.).
* `yolov8n.pt`: Pretrained YOLOv8 nano model weights for bounding box multi-object scene detection.

### Core Application (`backend/app/`)
* **`main.py`**: FastAPI application entrypoint, CORS middleware setup, lifespan handlers, and API router mounting.
* **`config.py`**: Central settings module loading environment variables, file paths, model thresholds, and API keys.
* **`schemas.py`**: Pydantic data schemas for classification requests, bounding boxes, facilities, routes, and responses.

#### Submodules:
* **`api/`** (HTTP REST Endpoints):
  * `routes_classify.py`: Waste image classification, multi-object detection, and uncertainty processing.
  * `routes_centres.py`: Pune/PCMC collection centre queries, Haversine geospatial radius filtering, and category matching.
  * `routes_batch_research.py`: High-throughput batch research endpoint for mixed municipal waste optimization.
  * `routes_recommendations.py`: Statutory disposal recommendations, EPR guidance, and handling checklists.
  * `routes_geocoding.py`: Forward and reverse geocoding endpoints supporting Pune coordinates and addresses.
  * `routes_feedback.py`: Human-in-the-loop validation feedback and continuous model telemetry logging.
  * `routes_retraining.py`: Autonomous retraining triggers and active learning candidate curation.
  * `routes_health.py`: Healthcheck and system readiness probes for uptime monitoring.

* **`rules/`** (Statutory Rule Engine & Discrete Math Foundations):
  * `set_theory.py`: Set universe $\mathcal{U}$, disjoint segregation constraints ($\mathcal{C}_{\text{rec}} \cap \mathcal{C}_{\text{spec}} = \emptyset$), relational compositions ($\mathcal{R}_{\text{route}} \circ \mathcal{R}_{\text{fac}}$), and BFS reachability DAG.
  * `predicates.py`: First-order predicate logic ($\text{Accepts}$, $\text{IsHazardous}$, $\text{IsAuthorized}$) and quantifiers ($\forall, \exists$).
  * `logic.py`: Propositional logic solver converting statutory mandates into Boolean formulas in Conjunctive Normal Form (CNF).
  * `relations.py`: Formal relation mappings connecting waste categories, hazard levels, and authorized processing facilities.
  * `graph.py`: Directed Acyclic Graph (DAG) generation representing the 4-layer regulatory disposal chain.
  * `complexity.py`: Algorithmic time and space complexity benchmarking for rule-engine computations.
  * `versioned_rules.py`: Statutory rule definitions encoding CPCB 2016, E-Waste 2022, and Battery Waste Rules 2022.

* **`optimizer/`** (Mathematical Optimization & Decision Theory):
  * `batch_optimizer.py`: Exact Mixed-Integer Linear Programming (MILP) formulation solved with HiGHS for multi-item segregation.
  * `clarification_engine.py`: Expected Value of Information (EVOI) and Shannon entropy calculations for active clarification queries.

* **`detection/`** (Object Detection & Bounding Boxes):
  * `yolo_detector.py`: EcoSort Deep Neural Vision Multi-Object Waste Detector fusing YOLOv8 Medium macro-object proposals with dedicated litter detection and dual-vision MobileNetV3/EfficientNet-B0 material verification.
  * `multi_object_detector.py`: Saliency and morphological proposal engine with Non-Maximum Suppression (NMS).

* **`ml/`** (Machine Learning & Classification):
  * `classifier.py`: Inference pipeline wrapper supporting MobileNetV3 and ImageNet transfer learning.
  * `model.py`: PyTorch neural network model definition for fine-tuned waste classification.
  * `categories.py`: Canonical 10-stream waste taxonomy definitions and descriptions.
  * `imagenet_mapping.py`: Mapping layer projecting ImageNet synset IDs to EcoSort waste taxonomy streams.
  * `dataset_generator.py`: Synthetic benchmark dataset generation for multi-class training and testing.
  * `train.py`: PyTorch model training and validation loops with metric calculation.
  * `retraining.py`: Continuous retraining engine updating weights based on verified user feedback.

* **`geospatial/`** (Location & Route Planning):
  * `centres_db.py`: Verified geospatial database of 18 Pune and PCMC collection centres and recyclers.
  * `collection_planner.py`: TSP route solver and set-cover optimizer computing minimum-distance tours across collection hubs.
  * `distance.py`: Vectorized Haversine spherical distance calculations between geographic coordinates.
  * `geocoding.py`: Geocoding service with local Pune caching and fallback providers.
  * `provider.py`: Abstract geospatial provider interfaces.

* **`agent/`** (Decision Agents & Multi-Modal Verification):
  * `segregation_agent.py`: Autonomous workflow coordinator synthesizing ML, statutory rules, and geospatial routes into user actions.
  * `llm_verifier.py`: Multi-modal LLM fallback verifier for high-uncertainty or ambiguous classifications.

* **`recommendations/`**:
  * `engine.py`: Statutory recommendation synthesis generating clear, step-by-step citizen handling actions.

### Data & Evaluation (`backend/data/` & `backend/evaluation/`)
* `data/models/`: Model weights (`mobilenetv3_ecosort.pt`), version history, and `models_registry.json`.
* `evaluation/run_experiments.py`: Automated benchmarking and empirical validation test harness.

### Test Suite (`backend/tests/`)
* `test_api_endpoints.py`: Unit tests for all REST API endpoints.
* `test_batch_research.py`: High-throughput multi-item batch research and optimization tests.
* `test_centres_search.py`: Geospatial centre search and category compatibility tests.
* `test_discrete_math.py`: Validation tests for set operations, relations, logic predicates, and graph reachability.
* `test_geocoding.py`: Geocoding service tests.
* `test_image_validation.py`: Image size, format, and corruption guard tests.
* `test_ml_inference.py`: Machine learning model classification accuracy and confidence tests.
* `test_system_requirements.py`: Comprehensive end-to-end integration suite verifying the 12 core system requirements.
* `test_pune_mixed_waste_integration.py`: End-to-end multi-waste Pune city routing integration tests.
* `test_recommendations.py`: Statutory advice and handling recommendation tests.
* `test_segregation_agent.py`: Agent state machine and decision flow unit tests.

---

## 3. Frontend Application (`/frontend`)

The frontend is a single-page React application built with **React 18**, **TypeScript**, **Vite**, and **Tailwind CSS**.

### Root Files
* `index.html`: Web entrypoint HTML and application root element.
* `vite.config.ts`: Vite bundler configuration including proxy rules, host bindings, and Tailwind plugins.
* `package.json`: NPM package dependencies (React, Lucide icons, Tailwind CSS, Leaflet/MapLibre).
* `tsconfig.json`: TypeScript compiler options and path mappings.

### Application Source (`frontend/src/`)
* **`main.tsx`**: React DOM root mounting and application bootstrap.
* **`App.tsx`**: Top-level application layout, navigation state, and view routing.
* **`App.css` / `index.css`**: Tailwind CSS styling and theme definitions.

#### Component Modules:
* **`components/Navigation/`**:
  * `AppHeader.tsx`: Sticky application header with brand logo, online status badge, and location trigger.
  * `Sidebar.tsx`: Workspace navigation sidebar for switching between analysis modes.
* **`components/Scanner/`**:
  * `ScannerContainer.tsx`: Waste upload container coordinating camera capture, file upload, and samples.
  * `UploadInput.tsx`: Drag-and-drop file upload component.
  * `CameraInput.tsx`: Live camera streaming and snapshot capture interface.
  * `SampleGallery.tsx`: Pre-loaded sample images for instant demonstrations.
* **`components/Results/`**:
  * `ResultsDashboard.tsx`: Primary result overview displaying classification, compliance, and recommendations.
  * `WasteCard.tsx`: Detailed card showcasing identified material, confidence score, and hazard status.
  * `ActionChecklist.tsx`: Step-by-step statutory citizen handling directives.
  * `ClarificationCard.tsx`: Interactive questionnaire for resolving ambiguous items via EVOI decision logic.
  * `DiscreteMathAuditView.tsx`: Real-time mathematical audit pane displaying set relations and graph proofs.
  * `MultiObjectBanner.tsx`: Multi-item batch detection breakdown.
  * `FeedbackModal.tsx`: User feedback submission modal for continuous model retraining.
* **`components/Map/`**:
  * `CentresMap.tsx`: Interactive map showing user location and nearby collection centres.
  * `CentreCard.tsx`: Detailed facility card showing accepted materials, distance, contact info, and directions.
* **`components/BatchOptimizer/`**:
  * `BatchAnalysisView.tsx`: High-level batch analysis dashboard showing set-partitioning and TSP route tours.
* **`components/CentresExplorer/`**:
  * `CentresExplorerView.tsx`: Dedicated directory and filter search for all Pune/PCMC recyclers and centres.
* **`components/Guide/`**:
  * `DisposalGuideView.tsx`: Statutory encyclopedia of CPCB waste segregation rules and best practices.
* **`components/Public/`**:
  * `LandingPageView.tsx`: Public landing page explaining EcoSort's mission and capabilities.
  * `HowItWorksView.tsx`: Educational walkthrough of AI detection, rule evaluation, and route planning.
  * `AboutProjectView.tsx`: Research context, discrete math foundation, and academic references.
* **`components/Workspace/`**:
  * `AnalysisStudioView.tsx`: Deep-dive multi-modal analysis studio for advanced users.
  * `AnalysisHistoryView.tsx`: Persistent session history tracking previously scanned items.
  * `OverviewView.tsx`: Summary dashboard displaying recycling statistics and impact metrics.
  * `SettingsView.tsx`: Preferences panel for model thresholds, geocoding providers, and privacy.
* **`components/Location/`**:
  * `LocationModal.tsx`: Precise location selection dialog with GPS detection and manual Pune area search.
* **`components/ModelTransparency/`**:
  * `ModelTransparencyModal.tsx`: Model transparency modal showing model architecture, training data, and metrics.
* **`components/common/`**:
  * Reusable UI primitives: `Alert.tsx`, `Badge.tsx`, `Button.tsx`, `Card.tsx`, `EmptyState.tsx`, `WorkflowBreadcrumb.tsx`.

#### State, Services & Utilities:
* `context/LocationContext.tsx`: React Context managing user coordinates, Pune area name, and location modals.
* `services/api.ts`: Central Axios/fetch API client handling all requests to the FastAPI backend.
* `types/index.ts`: TypeScript interfaces for classification, facilities, routes, and UI state.
* `utils/formatters.ts`: Helper functions for distance, confidence percentages, and timestamps.
* `utils/sessionStore.ts`: Local storage persistence for scan history and preferences.

---

## 4. Documentation & Research (`/docs`)

* `ARCHITECTURE.md`: High-level system architecture and data flow diagrams.
* `MATHEMATICAL_MODEL.md`: Mathematical formulation of the classification, rule engine, MILP optimizer, and TSP routing.
* `RESEARCH_QUESTION.md`: Academic research questions and hypotheses addressed by EcoSort.
* `EVALUATION_PROTOCOL.md`: Experimental methodology, evaluation metrics, and benchmarking guidelines.
* `RELATED_WORK.md`: Literature review of automated waste sorting and combinatorial routing systems.
* `RESULTS.md`: Empirical performance benchmarks, inference latency, and optimization results.
* `results_benchmark.csv` & `results_benchmark.json`: Raw experimental benchmark numbers and evaluation logs.
* `SAFETY_AND_DATA.md`: Ethical AI considerations, data privacy, and statutory compliance framework.
* `DECISIONS.md`: Architectural Decision Records (ADR) documenting design tradeoffs.
