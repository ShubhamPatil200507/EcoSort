# Empirical Evaluation Protocol

## 1. Experimental Setup & Controls

To ensure strict reproducibility, all experiments are executed through an automated test harness (`backend/evaluation/run_experiments.py`) across a fixed benchmark suite containing 6 representative multi-item waste scenarios comprising clean recyclables, hazardous chemicals, damaged batteries, paper/organic contamination pairs, degenerate single streams, and capacity-constrained electronic peripherals.

### Experimental Controls
1. **Identical Input Batch**: All 4 strategies are tested on the exact same input items, bounding boxes, and initial visual confidence distributions.
2. **Deterministic Solver State**: The HiGHS MIP solver is configured with fixed tolerance (`mip_rel_gap = 1e-4`), eliminating non-deterministic stochastic variations.
3. **No Retraining or Data Leakage**: Evaluation scenarios are strictly evaluated zero-shot against frozen backbone weights and statutory rule definitions.

---

## 2. Baseline Strategies

1. **Strategy A (Independent Baseline)**:
   - Employs greedy prediction plus static rule evaluation.
   - Solves the batch with zero user interaction (questions = 0).
   - Serves as the operational lower bound on user effort.

2. **Strategy B (Confidence-Based Clarification)**:
   - Queries the user about the item with the lowest predicted confidence:
     $$i^* = \arg\min_{i \in \mathcal{I}} \text{Conf}(i)$$
   - Standard industry benchmark for active learning.

3. **Strategy C (Information Entropy-Based Clarification)**:
   - Queries the user about the item with maximum Shannon entropy across its 10-class probability distribution:
     $$i^* = \arg\max_{i \in \mathcal{I}} H(P_i)$$

4. **Strategy D (Decision-Aware EVOI - Proposed)**:
   - Computes Expected Value of Information:
     $$\text{EVOI}(i) = \mathbb{E}_{c \sim P_i} [\text{OptObjective}(\mathcal{I} \mid Y_i = c)] - \text{BaseObjective}(\mathcal{I})$$
   - Queries the user only when $\text{EVOI}(i) \cdot \text{SafetyWeight}(i) > 0.05$; suppresses questions otherwise.

---

## 3. Metric Definitions

- **Correct Assignment Rate (%)**:
  $$\frac{\sum_{i \in \text{Assigned}} \mathbb{I}(\text{stream}(i) = \text{ground\_truth}(i))}{|\mathcal{I}|} \times 100$$
- **Invalid Assignment Rate (%)**:
  $$\frac{\sum_{i \in \text{Assigned}} \mathbb{I}(\text{stream}(i) \notin \mathcal{E}(i))}{|\mathcal{I}|} \times 100$$
- **Review Diversion Rate (%)**:
  $$\frac{\sum_{i \in \mathcal{I}} r_i}{|\mathcal{I}|} \times 100$$
- **Mean Questions per Batch**:
  $$\frac{\text{Total Clarification Queries Asked}}{\text{Total Batches Evaluated}}$$
- **Batch Feasibility Rate (%)**:
  $$\frac{\text{Batches where Solver Status } \in \{\text{optimal}, \text{degenerate\_trivial}\}}{\text{Total Batches Evaluated}} \times 100$$
- **Planning Latency (ms)**:
  Elapsed wall-clock time from batch submission to MILP solver termination.

---

## 4. Reproducing Results

To execute the automated evaluation pipeline and regenerate the benchmark outputs:

```powershell
cd backend
python evaluation/run_experiments.py
```

Outputs are automatically written to:
- `docs/results_benchmark.json`
- `docs/results_benchmark.csv`
- `docs/RESULTS.md`
