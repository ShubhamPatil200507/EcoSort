"""
Research Clarification Engine (EcoSort Research Upgrade)
Implements and compares four human-in-the-loop clarification strategies:
1. Strategy A: Independent Prediction (Baseline, no interactive queries)
2. Strategy B: Confidence-Based Clarification (Picks lowest confidence item)
3. Strategy C: Information-Entropy-Based Clarification (Picks highest Shannon entropy)
4. Strategy D: Decision-Aware Clarification (Expected Value of Information / EVOI)
   Estimates downstream impact on batch feasibility, constraint violations,
   and objective gain per unit of user effort.
"""

import math
from typing import List, Dict, Any, Optional, Tuple
from pydantic import BaseModel

from app.schemas import (
    DetectedWasteItem,
    ClarificationOptionSchema,
    ClarificationQuestionCandidate,
    ClarificationComparisonResult,
    BatchOptimizationRequest
)
from app.ml.categories import CATEGORY_METADATA
from app.optimizer.batch_optimizer import BatchSortingOptimizer

class ClarificationEngine:
    """
    Evaluates, ranks, and synthesizes clarification queries across all four strategies.
    """
    _instance: Optional["ClarificationEngine"] = None

    def __init__(self):
        self.optimizer = BatchSortingOptimizer.get_instance()

    @classmethod
    def get_instance(cls) -> "ClarificationEngine":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _build_options_for_item(self, item: DetectedWasteItem) -> List[ClarificationOptionSchema]:
        options: List[ClarificationOptionSchema] = []

        # Option 1: Top prediction
        meta_top = CATEGORY_METADATA.get(item.predicted_category, {})
        options.append(ClarificationOptionSchema(
            id=f"opt_{item.predicted_category}",
            label=f"Yes, it is {meta_top.get('display_name', item.predicted_category)}",
            description=f"Model primary prediction ({item.confidence * 100:.1f}%)",
            target_category=item.predicted_category,
            attributes=item.material_attributes
        ))

        # Options for plausible alternatives
        for alt in item.alternatives[:2]:
            meta_alt = CATEGORY_METADATA.get(alt.category, {})
            options.append(ClarificationOptionSchema(
                id=f"opt_{alt.category}",
                label=f"Actually it is {meta_alt.get('display_name', alt.category)}",
                description=f"Alternative candidate ({alt.confidence * 100:.1f}%)",
                target_category=alt.category,
                attributes={"user_confirmed_alternative": True}
            ))

        # Standard Fallbacks
        options.append(ClarificationOptionSchema(
            id="opt_dont_know",
            label="I don't know / Not sure",
            description="Route item to conservative manual inspection",
            target_category="general_residual",
            attributes={"uncertain_user": True}
        ))
        options.append(ClarificationOptionSchema(
            id="opt_none_of_these",
            label="None of these",
            description="Specify other or send to safe residual waste",
            target_category="general_residual",
            attributes={"none_of_these": True}
        ))

        return options

    def evaluate_all_strategies(
        self,
        items: List[DetectedWasteItem],
        selected_strategy: str = "decision_aware"
    ) -> ClarificationComparisonResult:
        """
        Executes parallel ranking of all candidates under strategies A, B, C, D.
        """
        if not items:
            return ClarificationComparisonResult(
                selected_strategy=selected_strategy,
                question=None,
                strategy_rankings={},
                comparative_notes="No items present in the current batch."
            )

        # Baseline: Solve initial batch with current predictions
        base_req = BatchOptimizationRequest(items=items)
        base_res = self.optimizer.optimize_batch(base_req)
        base_obj = base_res.objective_value

        strategy_b_rankings: List[Dict[str, Any]] = []
        strategy_c_rankings: List[Dict[str, Any]] = []
        strategy_d_rankings: List[Dict[str, Any]] = []

        # Evaluate each item across strategies B, C, D
        for item in items:
            # 1. Strategy B: Confidence metric (lower confidence = higher query priority)
            b_priority = round(1.0 - item.confidence, 4)
            strategy_b_rankings.append({
                "item_id": item.item_id,
                "metric_name": "Inverted Confidence (1 - conf)",
                "priority_score": b_priority,
                "confidence": item.confidence,
                "category": item.predicted_category
            })

            # 2. Strategy C: Information Entropy metric (higher entropy = more uncertain distribution)
            c_priority = round(item.entropy, 4)
            strategy_c_rankings.append({
                "item_id": item.item_id,
                "metric_name": "Shannon Entropy H(P)",
                "priority_score": c_priority,
                "entropy": item.entropy,
                "confidence": item.confidence,
                "category": item.predicted_category
            })

            # 3. Strategy D: Decision-Aware Expected Value of Information (EVOI)
            # Simulate resolving item to each plausible candidate category
            plausible_cats = [item.predicted_category] + [alt.category for alt in item.alternatives[:2]]
            expected_obj_after_clarification = 0.0

            for cand_cat in plausible_cats:
                cand_prob = item.calibrated_probabilities.get(cand_cat, 0.20)
                # Clone batch with candidate assigned as confirmed
                sim_items = []
                for other in items:
                    if other.item_id == item.item_id:
                        sim_it = other.model_copy(deep=True)
                        sim_it.user_corrected_category = cand_cat
                        sim_it.confidence = 0.98
                        sim_items.append(sim_it)
                    else:
                        sim_items.append(other)

                sim_res = self.optimizer.optimize_batch(BatchOptimizationRequest(items=sim_items))
                expected_obj_after_clarification += cand_prob * sim_res.objective_value

            evoi = max(0.0, expected_obj_after_clarification - base_obj)
            # High-risk safety items (batteries, hazardous) get safety multiplier in decision awareness
            safety_multiplier = 2.0 if item.predicted_category in ["hazardous", "batteries"] else 1.0
            d_priority = round(evoi * safety_multiplier, 4)

            strategy_d_rankings.append({
                "item_id": item.item_id,
                "metric_name": "Expected Value of Clarification (EVOI * SafetyWeight)",
                "priority_score": d_priority,
                "evoi_raw": round(evoi, 4),
                "confidence": item.confidence,
                "entropy": item.entropy,
                "category": item.predicted_category
            })

        # Sort rankings descending by priority score
        strategy_b_rankings.sort(key=lambda r: r["priority_score"], reverse=True)
        strategy_c_rankings.sort(key=lambda r: r["priority_score"], reverse=True)
        strategy_d_rankings.sort(key=lambda r: r["priority_score"], reverse=True)

        rankings_dict = {
            "strategy_a_independent": [{"note": "No clarification queries generated under Strategy A (Independent Baseline)"}],
            "strategy_b_confidence": strategy_b_rankings,
            "strategy_c_entropy": strategy_c_rankings,
            "strategy_d_decision_aware": strategy_d_rankings
        }

        # Select target question based on chosen strategy
        target_item_id = None
        target_priority = 0.0
        reason = ""

        if selected_strategy == "independent":
            return ClarificationComparisonResult(
                selected_strategy="independent",
                question=None,
                strategy_rankings=rankings_dict,
                comparative_notes="Strategy A (Independent): Batch proceeds directly to optimization without user querying."
            )
        elif selected_strategy == "confidence":
            top_b = strategy_b_rankings[0]
            target_item_id = top_b["item_id"]
            target_priority = top_b["priority_score"]
            reason = f"Confidence Strategy selected {target_item_id} because it has the lowest classification confidence ({top_b['confidence'] * 100:.1f}%)."
        elif selected_strategy == "entropy":
            top_c = strategy_c_rankings[0]
            target_item_id = top_c["item_id"]
            target_priority = top_c["priority_score"]
            reason = f"Information Strategy selected {target_item_id} because it possesses the highest prediction entropy ({top_c['entropy']:.2f} bits)."
        else:  # decision_aware
            top_d = strategy_d_rankings[0]
            if top_d["priority_score"] <= 0.05 and top_d["confidence"] >= 0.85:
                # EVOI is negligible; asking a question would waste user effort without changing decisions
                return ClarificationComparisonResult(
                    selected_strategy="decision_aware",
                    question=None,
                    strategy_rankings=rankings_dict,
                    comparative_notes=(
                        "Strategy D (Decision-Aware) determined that all candidate clarifications have near-zero "
                        "expected decision impact (EVOI ≤ 0.05). Unnecessary questions suppressed to optimize user effort."
                    )
                )
            target_item_id = top_d["item_id"]
            target_priority = top_d["priority_score"]
            reason = (
                f"Decision-Aware Strategy selected {target_item_id} because resolving its uncertainty yields "
                f"the highest downstream batch optimization improvement (EVOI={top_d['evoi_raw']:.3f}, weighted={target_priority:.3f})."
            )

        # Assemble the chosen question candidate
        chosen_item = next((it for it in items if it.item_id == target_item_id), None)
        question_candidate = None
        if chosen_item:
            meta = CATEGORY_METADATA.get(chosen_item.predicted_category, {})
            display_name = meta.get("display_name", chosen_item.predicted_category)
            plausible_cats = [chosen_item.predicted_category] + [alt.category for alt in chosen_item.alternatives[:2]]

            question_candidate = ClarificationQuestionCandidate(
                item_id=chosen_item.item_id,
                question=f"Could you confirm the material for {chosen_item.item_id} ({display_name})?",
                strategy=selected_strategy,
                priority_score=target_priority,
                confidence=chosen_item.confidence,
                entropy=chosen_item.entropy,
                expected_decision_improvement=target_priority,
                plausible_categories=plausible_cats,
                options=self._build_options_for_item(chosen_item),
                reason=reason,
                thumbnail=chosen_item.thumbnail
            )

        comp_notes = (
            f"Strategy '{selected_strategy}' prioritized {target_item_id}. "
            f"Strategy B prioritized {strategy_b_rankings[0]['item_id']} (conf={strategy_b_rankings[0]['confidence'] * 100:.1f}%); "
            f"Strategy C prioritized {strategy_c_rankings[0]['item_id']} (entropy={strategy_c_rankings[0]['entropy']:.2f}); "
            f"Strategy D prioritized {strategy_d_rankings[0]['item_id']} (EVOI={strategy_d_rankings[0]['evoi_raw']:.3f})."
        )

        return ClarificationComparisonResult(
            selected_strategy=selected_strategy,
            question=question_candidate,
            strategy_rankings=rankings_dict,
            comparative_notes=comp_notes
        )
