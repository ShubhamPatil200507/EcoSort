# EcoSort Research Question and Experimental Hypotheses

## 1. Core Research Question

> **Primary Research Question:**
> *Can an integrated framework coupling deterministic statutory waste rules, constraint-validated batch optimization (MILP), and decision-aware uncertainty clarification (EVOI) measurably reduce unnecessary user queries and prevent statutory disposal violations compared to conventional independent single-image classification?*

---

## 2. Formal Hypotheses

### Hypothesis 1: User Effort Minimization via EVOI
- **Statement:** A clarification strategy prioritizing the *Expected Value of Information (EVOI)* on downstream batch decisions queries the user significantly fewer times than greedy confidence-based or entropy-based clarification without sacrificing final batch assignment accuracy.
- **Null Hypothesis ($H_{1,0}$):** The mean number of clarification questions asked under EVOI is equal to or greater than that under lowest-confidence clarification.
- **Alternative Hypothesis ($H_{1,1}$):** EVOI suppresses questions for ambiguous items whose resolution cannot alter feasible batch allocation or objective value, resulting in a statistically significant decrease in query frequency ($\bar{q}_{\text{EVOI}} < \bar{q}_{\text{conf}}$).

### Hypothesis 2: Regulatory Compliance Guarantee
- **Statement:** Formulating batch sorting under a versioned statutory rule engine and 0-1 linear inequality constraints achieves a 0% statutory cross-contamination violation rate, whereas naive independent classification produces regulatory violations in composite waste scenes.
- **Null Hypothesis ($H_{2,0}$):** MILP constraint enforcement produces an equivalent statutory violation rate to greedy single-item prediction.
- **Alternative Hypothesis ($H_{2,1}$):** By enforcing strict constraints ($x_{i,s} = 0 \quad \forall (i,s) \notin \mathcal{E}$ and cross-contamination limits), statutory violations are provably zeroed.

---

## 3. Scope & Research Boundary Assumptions

1. **Deterministic Regulatory Base**: Environmental statutes (e.g., CPCB E-Waste Rules 2022, SWM Rules 2016, 40 CFR 273) represent hard ground-truth constraints that computer vision models cannot override.
2. **Batch Granularity**: Household and enterprise waste disposal operates on batches of items generated concurrently (e.g., clearing a desk, sorting packaging after delivery, or cleaning a kitchen), making batch-level optimization operationally meaningful.
3. **No Retraining Claims**: User feedback and corrections in this prototype serve as active session overrides and persistent audit logs; they do not trigger automated unverified model retraining.
