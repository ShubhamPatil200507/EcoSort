# Discrete Mathematics and Optimization Formulation

## 1. Set Theory Foundations

We formalize the batch sorting problem through discrete universe sets:

- **Detected Items Set**:
  $$\mathcal{I} = \{i_1, i_2, \dots, i_n\}$$
  where $n = |\mathcal{I}|$ represents the count of distinct physical items localized in the batch.

- **Candidate Disposal Streams Universe**:
  $$\mathcal{S} = \{s_1, s_2, \dots, s_m\}$$
  where $m = |\mathcal{S}| = 8$ represents statutory recovery channels:
  $$\mathcal{S} = \{\text{municipal\_recycling}, \text{e\_waste\_dropoff}, \text{battery\_reclamation}, \text{specialized\_hazardous}, \text{organic\_composting}, \text{glass\_deposit\_reclamation}, \text{textile\_donation\_recycling}, \text{general\_landfill}\}$$

- **Waste Material Categories**:
  $$\mathcal{C} = \{\text{plastic}, \text{paper\_cardboard}, \text{glass}, \text{metal}, \text{e\_waste}, \text{batteries}, \text{organic\_food}, \text{hazardous}, \text{textile}, \text{general\_residual}\}$$

- **Verified Facilities Collection**:
  $$\mathcal{F} = \{f_1, f_2, \dots, f_k\}$$
  representing certified collection and processing hubs registered with national pollution control authorities.

---

## 2. Relations and Eligibility Mapping

### A. Regulatory Stream Eligibility Relation
Let $\mathcal{E} \subseteq \mathcal{I} \times \mathcal{S}$ denote the binary eligibility relation defined by statutory rules $\mathcal{R}$:
$$(i, s) \in \mathcal{E} \iff \text{RuleEngine}(i, s) = \text{ELIGIBLE}$$

If $(i, s) \notin \mathcal{E}$, assignment of item $i$ to stream $s$ is strictly forbidden by environmental law.

### B. Facility Stream Acceptance Relation
Let $\mathcal{A} \subseteq \mathcal{F} \times \mathcal{S}$ denote the facility capability relation:
$$(f, s) \in \mathcal{A} \iff \text{Facility } f \text{ is licensed and equipped to process stream } s$$

### C. Stream Incompatibility Relation
Let $\mathcal{R}_{\text{incompat}} \subseteq \mathcal{S} \times \mathcal{S}$ be the symmetric cross-contamination relation:
$$(s_a, s_b) \in \mathcal{R}_{\text{incompat}} \iff \text{Stream } s_a \text{ and } s_b \text{ cannot co-mingle without separate containment}$$
For example:
$$(\text{organic\_composting}, \text{municipal\_recycling}) \in \mathcal{R}_{\text{incompat}}$$
$$(\text{specialized\_hazardous}, \text{municipal\_recycling}) \in \mathcal{R}_{\text{incompat}}$$

---

## 3. Functions & Information Entropy

### A. Probability Distribution Function
For each item $i \in \mathcal{I}$, the vision pipeline defines a total probability mass function $P_i : \mathcal{C} \to [0, 1]$ satisfying:
$$\sum_{c \in \mathcal{C}} P_i(c) = 1.0$$

### B. Shannon Information Entropy
The uncertainty of item $i$'s classification is quantified by its information entropy $H(P_i)$:
$$H(P_i) = -\sum_{c \in \mathcal{C}} P_i(c) \log_2(P_i(c) + 10^{-9})$$
where $H(P_i) \in [0, \log_2(10)] \approx [0, 3.322]$ bits. High entropy indicates an ambiguous item with multiple plausible classes.

---

## 4. Mixed Integer Linear Programming (MILP) Formulation

### A. Decision Variables
1. **Assignment Variables**:
   $$x_{i,s} \in \{0, 1\} \quad \forall i \in \mathcal{I}, \forall s \in \mathcal{S}$$
   $x_{i,s} = 1$ if item $i$ is assigned to disposal stream $s$; 0 otherwise.

2. **Review Variables**:
   $$r_i \in \{0, 1\} \quad \forall i \in \mathcal{I}$$
   $r_i = 1$ if item $i$ is diverted to human inspection due to uncertainty or infeasibility; 0 otherwise.

3. **Stream Deployment Variables**:
   $$y_s \in \{0, 1\} \quad \forall s \in \mathcal{S}$$
   $y_s = 1$ if stream $s$ is activated in the batch (incurring fixed collection cost $F_s$); 0 otherwise.

### B. Objective Function
Maximize net circular recovery value minus review and operational penalties:
$$\max \quad \sum_{i \in \mathcal{I}} \sum_{s \in \mathcal{S}} \left( \text{Conf}_i \cdot \mathcal{U}_s \right) x_{i,s} - \sum_{i \in \mathcal{I}} P_{\text{rev}} \cdot r_i - \sum_{s \in \mathcal{S}} F_s \cdot y_s$$

where:
- $\text{Conf}_i \in [0, 1]$: prediction confidence of item $i$.
- $\mathcal{U}_s \in \mathbb{R}^+$: circular utility score of stream $s$ (e.g., $\mathcal{U}_{\text{e\_waste}} = 3.2$, $\mathcal{U}_{\text{battery}} = 3.0$, $\mathcal{U}_{\text{municipal}} = 2.2$, $\mathcal{U}_{\text{landfill}} = 0.2$).
- $P_{\text{rev}} = 2.0$: documented review penalty for diverting an item to human inspection.
- $F_s = 0.5$: fixed deployment cost for activating stream $s$.

### C. Constraints
1. **Completeness Partitioning**:
   $$\sum_{s \in \mathcal{S}} x_{i,s} + r_i = 1 \quad \forall i \in \mathcal{I}$$
   Every item must be assigned to exactly one stream or diverted for review.

2. **Regulatory Eligibility**:
   $$x_{i,s} = 0 \quad \forall (i, s) \notin \mathcal{E}$$
   Forbidden streams cannot receive assignments under any circumstances.

3. **Stream Coupling**:
   $$x_{i,s} \le y_s \quad \forall i \in \mathcal{I}, \forall s \in \mathcal{S}$$
   Item $i$ cannot be placed in stream $s$ unless stream $s$ is active.

4. **Capacity Bounds** (when operational limits $\mathcal{K}_s$ are defined):
   $$\sum_{i \in \mathcal{I}} w_i x_{i,s} \le \mathcal{K}_s \cdot y_s \quad \forall s \in \mathcal{S}$$

### D. Degenerate Case Detection
Let $D(i) = \{s \in \mathcal{S} \mid (i, s) \in \mathcal{E}\}$ be the set of permitted streams for item $i$.
If:
$$\forall i \in \mathcal{I}, \quad |D(i)| = 1 \quad \land \quad \text{No capacity or incompatibility constraints bind}$$
then the optimization problem is strictly **degenerate trivial**, reducing to $x_{i, s^*} = 1$ where $\{s^*\} = D(i)$. The solver explicitly flags and reports this status.

---

## 5. Expected Value of Information (EVOI) Clarification

Under Decision-Aware Clarification (Strategy D), we estimate the expected downstream gain in batch objective before querying the user:

$$\text{EVOI}(i) = \sum_{c \in \text{Plausible}(i)} P_i(c) \cdot \left[ \text{OptObjective}(\mathcal{I} \mid Y_i = c) - \text{BaseObjective}(\mathcal{I}) \right]$$

The query priority score is:
$$\text{Priority}(i) = \frac{\text{EVOI}(i) \cdot \text{SafetyWeight}(i)}{\text{UserEffort}(i)}$$

If $\max_i \text{Priority}(i) \le 0.05$, the system suppresses questions, proving that resolving uncertainty would not alter the feasible downstream batch allocation.

---

## 6. Algorithm Complexity Analysis

| Subsystem | Algorithm / Method | Time Complexity | Empirical Latency |
| :--- | :--- | :--- | :--- |
| **Object Localization** | Adaptive thresholding + Contour NMS | $\mathcal{O}(W \cdot H + K \log K)$ | $12 - 25 \text{ ms}$ |
| **Vision Inference** | Batched dual-backbone tensor forward pass | $\mathcal{O}(B \cdot \text{FLOPs})$ | $18 - 35 \text{ ms}$ |
| **Rule Engine** | Relational hash-table lookup | $\mathcal{O}(n \cdot |\mathcal{R}|)$ | $< 1 \text{ ms}$ |
| **Batch Optimizer** | SciPy HiGHS Branch-and-Cut (MIP) | $\mathcal{O}(2^{n \cdot m})$ worst-case, $\mathcal{O}(\text{poly})$ avg | $2 - 9 \text{ ms}$ ($n \le 10$) |
| **Clarification Ranking** | EVOI Simulation across plausible branches | $\mathcal{O}(n \cdot |\text{Plausible}| \cdot T_{\text{MIP}})$ | $5 - 15 \text{ ms}$ |
| **Collection Tour** | Exact branch-and-bound TSP | $\mathcal{O}(k!)$ where $k \le 5$ stops | $< 2 \text{ ms}$ |
