"""
EcoSort Autonomous Waste Segregation Agent
Manages the end-to-end decision-making workflow:
  1. Receives ML classification & alternatives
  2. Extracts & validates waste attributes
  3. Detects ambiguity or safety hazards requiring user clarification
  4. Manages workflow states: IMAGE_RECEIVED -> CLASSIFYING -> NEEDS_CLARIFICATION -> RULE_EVALUATION -> CLASSIFIED / UNRESOLVED
  5. Executes Discrete Mathematics Rule Engine (Set Theory, Propositional Logic, Predicates, Graph Traversal)
  6. Returns structured, explainable decision with mathematical audit trail.
"""

from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

from app.rules.set_theory import (
    WASTE_UNIVERSE,
    RECYCLABLE_SET,
    SPECIALIZED_FACILITY_SET,
    WasteSetEngine
)
from app.rules.relations import CategoryMappingFunction
from app.rules.logic import RuleRegistry, Severity
from app.rules.predicates import Predicates
from app.rules.graph import DISPOSAL_GRAPH
from app.rules.complexity import ExecutionProfiler, ALGORITHM_COMPLEXITY_SPEC
from app.schemas import ClassificationResult, DisposalRecommendation


class AgentState(str, Enum):
    IMAGE_RECEIVED = "IMAGE_RECEIVED"
    CLASSIFYING = "CLASSIFYING"
    NEEDS_CLARIFICATION = "NEEDS_CLARIFICATION"
    RULE_EVALUATION = "RULE_EVALUATION"
    CLASSIFIED = "CLASSIFIED"
    UNRESOLVED = "UNRESOLVED"


class ClarificationOption(BaseModel):
    id: str
    label: str
    description: Optional[str] = None
    target_category: Optional[str] = None
    attributes: Dict[str, Any] = Field(default_factory=dict)


class ClarificationPrompt(BaseModel):
    clarification_id: str
    question: str
    reason: str
    candidate_categories: List[str] = Field(default_factory=list)
    options: List[ClarificationOption] = Field(default_factory=list)
    affects_safety: bool = False


class EvidenceBreakdown(BaseModel):
    image_classifier_evidence: Dict[str, Any]
    user_provided_attributes: Dict[str, Any]
    discrete_rule_conclusions: Dict[str, Any]
    external_facility_info: Dict[str, Any]


class SegregationDecision(BaseModel):
    state: AgentState
    final_category: str
    display_name: str
    subtype: Optional[str] = None
    confidence: float
    is_confident: bool
    explanation: str
    reasons: List[str] = Field(default_factory=list)
    safety_warnings: List[Dict[str, str]] = Field(default_factory=list)
    preparation_steps: List[str] = Field(default_factory=list)
    disposal_route: str
    facility_types_needed: List[str] = Field(default_factory=list)
    separate_from_regular_trash: bool = True
    specialized_facility_required: bool = False
    clarification_prompt: Optional[ClarificationPrompt] = None
    unresolved_assumptions: List[str] = Field(default_factory=list)
    evidence_breakdown: EvidenceBreakdown
    mathematical_audit: Dict[str, Any] = Field(default_factory=dict)
    is_multi_object: bool = False
    detected_objects: List[Any] = Field(default_factory=list)
    separation_instructions: Optional[str] = None


class SegregationAgent:
    """
    Autonomous Waste Segregation Agent with discrete mathematics reasoning.
    """
    def __init__(self):
        self.rule_registry = RuleRegistry()

    def process(
        self,
        classification: ClassificationResult,
        user_attributes: Optional[Dict[str, Any]] = None,
        location_available: bool = False,
        user_lat: Optional[float] = None,
        user_lon: Optional[float] = None
    ) -> SegregationDecision:
        """
        Executes the full agentic decision workflow.
        """
        user_attrs = user_attributes.copy() if user_attributes else {}
        initial_state = AgentState.CLASSIFYING

        # Step 1: Detect ambiguity or safety-critical unknowns requiring clarification
        clarification = self._detect_clarification_need(classification, user_attrs)
        if clarification is not None and not user_attrs.get("_clarification_resolved"):
            return self._build_clarification_decision(classification, clarification, user_attrs, location_available)

        # Step 2: Transition to RULE_EVALUATION
        # Normalize category via discrete mapping function
        raw_category = user_attrs.get("override_category") or classification.predicted_category
        verified_category = CategoryMappingFunction.map_category(raw_category)

        # Step 3: Construct fact context for Propositional Logic evaluation
        facts = {
            "category": verified_category,
            "confidence": classification.confidence,
            "location_available": location_available,
            "is_damaged": user_attrs.get("is_damaged", False),
            "is_broken": user_attrs.get("is_broken", False),
            "food_contaminated": user_attrs.get("food_contaminated", False),
            "contains_toxic_chemicals": user_attrs.get("contains_toxic_chemicals", False),
            "is_pure_stream": not classification.is_multi_object,
            "is_multi_object": classification.is_multi_object
        }

        # Step 4: Evaluate Rule Registry (Propositional Logic)
        rule_eval_results, eval_time_ms = ExecutionProfiler.profile(
            "rule_evaluation",
            lambda: self.rule_registry.evaluate_all(facts)
        )

        # Step 5: Evaluate Predicates
        is_hazardous_pred = Predicates.is_hazardous(verified_category, user_attrs)
        requires_special_pred = Predicates.requires_special_handling(verified_category, user_attrs)

        # Step 6: Query Graph Theory Disposal Pathways
        graph_start_node = f"cat_{verified_category.replace('paper_cardboard', 'paper').replace('organic_food', 'organic').replace('general_residual', 'general').replace('e_waste', 'ewaste')}"
        reachable_graph, graph_time_ms = ExecutionProfiler.profile(
            "graph_traversal",
            lambda: DISPOSAL_GRAPH.find_reachable_subgraph(graph_start_node)
        )

        # Step 7: Resolve Facility Types via Relations & Graph
        relation_facilities = CategoryMappingFunction.get_eligible_facility_types(verified_category)
        final_facility_types = sorted(list(set(relation_facilities).union(reachable_graph.get("reachable_facility_types", []))))

        # Step 8: Assemble Synthesis & Explanations
        reasons = [
            f"Image classification identified '{classification.display_name}' ({classification.confidence:.1%}) with verified subtype '{classification.subtype or 'standard'}'.",
            f"Set theory engine mapped item to stream universe subset: {'Recyclable' if verified_category in RECYCLABLE_SET else 'Specialized/Compostable'}.",
            f"Predicate logic evaluated: IsHazardous={is_hazardous_pred}, RequiresSpecialHandling={requires_special_pred}.",
            f"Graph path reachability verified {reachable_graph.get('total_reachable', 0)} pipeline processing nodes."
        ]

        # Gather preparation steps from base recommendation + matched rules
        prep_steps = [
            "Keep dry and separate from incompatible waste streams."
        ]
        adjustments = rule_eval_results.get("adjustments", {})
        if "preparation_steps" in adjustments:
            prep_steps.extend(adjustments["preparation_steps"])

        separation_instructions = None
        if classification.is_multi_object:
            sec_display = classification.secondary_category.replace("_", " ").title() if classification.secondary_category else "secondary material"
            separation_instructions = (
                f"Multi-material image detected: {classification.display_name} and {sec_display}. "
                f"Physically separate these items before disposal to prevent batch contamination."
            )
            reasons.append(f"Spatial proposal decomposition identified {len(classification.detected_objects)} distinct waste objects.")
            prep_steps.insert(0, f"MANDATORY SEPARATION: Detach {classification.display_name} components from {sec_display} items before binning.")

        # Determine primary action and route
        route_mapping = {
            "plastic": "Curbside Recyclables or Plastic Reclaimer Drop-off",
            "paper_cardboard": "Dry Paper Curbside Recycling or Bale Center",
            "glass": "Glass Bottle Bank or Municipal Bottle Drop-off",
            "metal": "Scrap Metal Merchant or Clean Can Recycling",
            "organic_food": "Home Aerobic Composter or Municipal Wet Waste",
            "general_residual": "Sanitary Landfill Stream (Non-Recyclable)",
            "e_waste": "Authorized E-Waste Dismantler / Take-Back Kiosk",
            "batteries": "Dedicated Battery Collection Point",
            "textile": "Textile Thrift / Garment Donation Depot",
            "hazardous": "Authorized Hazardous Waste Depot (Mandatory)"
        }
        primary_route = route_mapping.get(verified_category, "Municipal Residual Stream")

        primary_action = (
            f"Deposit into {primary_route}."
            if not is_hazardous_pred else
            f"CRITICAL SAFETY DISPOSAL: Isolate immediately and deliver exclusively to an authorized hazardous collection centre."
        )

        safety_warnings = rule_eval_results.get("safety_warnings", [])

        # Unresolved assumptions
        unresolved = []
        if verified_category == "plastic" and not user_attrs.get("resin_code"):
            unresolved.append("Resin identification code (#1, #2, #5 vs #3, #7) not visually confirmed; inspect packaging stamp.")
        if verified_category == "batteries" and "is_damaged" not in user_attrs:
            unresolved.append("Battery internal casing integrity assumed intact without thermal/swelling report.")
        if verified_category == "glass" and "is_broken" not in user_attrs:
            unresolved.append("Glass assumed unbroken container.")

        # Step 9: Mathematical Audit Structure
        math_audit = {
            "set_theory": {
                "category": verified_category,
                "in_universe": WasteSetEngine.is_valid_category(verified_category),
                "stream_partition": (
                    "recyclable" if verified_category in RECYCLABLE_SET else
                    "specialized" if verified_category in SPECIALIZED_FACILITY_SET else "other"
                )
            },
            "propositional_logic": {
                "evaluated_rules_count": rule_eval_results.get("total_evaluated"),
                "matched_rules_count": rule_eval_results.get("matched_count"),
                "matched_rules": rule_eval_results.get("matched_rules"),
                "evaluated_log": rule_eval_results.get("evaluated_log")
            },
            "predicate_logic": {
                "is_hazardous": is_hazardous_pred,
                "requires_special_handling": requires_special_pred,
                "is_authorized_centre_required": (verified_category in ("e_waste", "batteries", "hazardous"))
            },
            "graph_theory": {
                "start_node": graph_start_node,
                "reachable_nodes_count": reachable_graph.get("total_reachable"),
                "reachable_facility_types": final_facility_types,
                "traversed_edges": reachable_graph.get("edges", [])[:8]
            },
            "complexity_profile_ms": {
                "rule_evaluation_ms": eval_time_ms,
                "graph_traversal_ms": graph_time_ms
            }
        }

        # Step 10: Formulate Evidence Breakdown
        evidence_breakdown = EvidenceBreakdown(
            image_classifier_evidence={
                "predicted_category": classification.predicted_category,
                "confidence": classification.confidence,
                "subtype": classification.subtype,
                "explanation": classification.explanation,
                "inference_time_ms": classification.inference_time_ms,
                "image_metadata": classification.image_metadata
            },
            user_provided_attributes=user_attrs,
            discrete_rule_conclusions={
                "matched_rules": [r["rule_id"] for r in rule_eval_results.get("matched_rules", [])],
                "predicates": {"is_hazardous": is_hazardous_pred, "requires_special_handling": requires_special_pred},
                "graph_reachability": f"{reachable_graph.get('total_reachable', 0)} nodes traversed"
            },
            external_facility_info={
                "location_available": location_available,
                "eligible_facility_types": final_facility_types
            }
        )

        return SegregationDecision(
            state=AgentState.CLASSIFIED,
            final_category=verified_category,
            display_name=classification.display_name,
            subtype=classification.subtype,
            confidence=classification.confidence,
            is_confident=classification.is_confident,
            explanation=classification.explanation,
            reasons=reasons,
            safety_warnings=safety_warnings,
            preparation_steps=prep_steps,
            disposal_route=primary_route,
            facility_types_needed=final_facility_types,
            separate_from_regular_trash=(verified_category != "general_residual"),
            specialized_facility_required=(verified_category in SPECIALIZED_FACILITY_SET),
            clarification_prompt=None,
            unresolved_assumptions=unresolved,
            evidence_breakdown=evidence_breakdown,
            mathematical_audit=math_audit,
            is_multi_object=classification.is_multi_object,
            detected_objects=classification.detected_objects,
            separation_instructions=separation_instructions
        )

    def _detect_clarification_need(
        self,
        classification: ClassificationResult,
        user_attrs: Dict[str, Any]
    ) -> Optional[ClarificationPrompt]:
        """
        Determines whether the agent must ask a targeted clarifying question before classification.
        Triggers when:
        1. Low confidence (< 0.60) or close alternative race between distinct disposal routes.
        2. Critical safety attribute is unknown (e.g. Battery swelling, chemical bottle residue, broken glass).
        """
        top_cat = classification.predicted_category
        conf = classification.confidence

        # Case A: Battery Safety Clarification (Swelling / Puncture risk)
        if top_cat == "batteries" and "is_damaged" not in user_attrs:
            return ClarificationPrompt(
                clarification_id="CLARIFY-BATT-01",
                question="Is this battery swollen, punctured, corroded, or warm to the touch?",
                reason="Damaged lithium or lead-acid batteries pose severe fire hazards and cannot be stored in standard collection containers.",
                candidate_categories=["batteries"],
                affects_safety=True,
                options=[
                    ClarificationOption(
                        id="damaged",
                        label="Yes — Battery is swollen, leaking, or damaged",
                        description="Requires immediate non-flammable sand isolation and hazardous protocol.",
                        target_category="batteries",
                        attributes={"is_damaged": True, "_clarification_resolved": True}
                    ),
                    ClarificationOption(
                        id="intact",
                        label="No — Battery casing is intact and dry",
                        description="Safe for standard terminal-taped battery collection bin.",
                        target_category="batteries",
                        attributes={"is_damaged": False, "_clarification_resolved": True}
                    )
                ]
            )

        # Case B: Hazardous Chemical vs Household Plastic
        if top_cat == "hazardous" and "contains_toxic_chemicals" not in user_attrs:
            return ClarificationPrompt(
                clarification_id="CLARIFY-HAZ-01",
                question="Did this container hold industrial solvents, motor oil, or agricultural chemicals?",
                reason="Containers with chemical or automotive residue cannot enter municipal plastic recycling streams.",
                candidate_categories=["hazardous", "plastic"],
                affects_safety=True,
                options=[
                    ClarificationOption(
                        id="toxic",
                        label="Yes — It contained motor oil, paint, solvent, or pesticide",
                        description="Classified strictly as Hazardous Household Waste.",
                        target_category="hazardous",
                        attributes={"contains_toxic_chemicals": True, "_clarification_resolved": True}
                    ),
                    ClarificationOption(
                        id="clean_plastic",
                        label="No — It was a standard beverage or food container",
                        description="Can be rinsed and diverted to Plastic recycling.",
                        target_category="plastic",
                        attributes={"contains_toxic_chemicals": False, "override_category": "plastic", "_clarification_resolved": True}
                    )
                ]
            )

        # Case C: Broken Glass Safety
        if top_cat == "glass" and "is_broken" not in user_attrs:
            return ClarificationPrompt(
                clarification_id="CLARIFY-GLASS-01",
                question="Is this glass intact or shattered into sharp fragments?",
                reason="Broken glass requires cardboard shielding to safeguard collection workers.",
                candidate_categories=["glass"],
                affects_safety=True,
                options=[
                    ClarificationOption(
                        id="broken",
                        label="Shattered / Broken Glass",
                        description="Must be wrapped in thick cardboard or sealed in a rigid container.",
                        target_category="glass",
                        attributes={"is_broken": True, "_clarification_resolved": True}
                    ),
                    ClarificationOption(
                        id="intact",
                        label="Intact Bottle / Jar",
                        description="Rinse and place in glass bank or curbside collection.",
                        target_category="glass",
                        attributes={"is_broken": False, "_clarification_resolved": True}
                    )
                ]
            )

        # Case D: Ambiguous Multi-Class Race with Marginal Confidence (< 0.65)
        alts = classification.alternative_predictions
        if conf < 0.65 and alts:
            alt1 = alts[0]
            # If top 2 are close in confidence
            if (conf - alt1.confidence) < 0.20:
                cat1, cat2 = top_cat, alt1.category
                return ClarificationPrompt(
                    clarification_id=f"CLARIFY-AMBIGUOUS-{cat1}-{cat2}",
                    question=f"Which best describes this object: {classification.display_name} or {alt1.display_name}?",
                    reason=f"Visual evidence is closely balanced between {classification.display_name} ({conf:.0%}) and {alt1.display_name} ({alt1.confidence:.0%}).",
                    candidate_categories=[cat1, cat2],
                    affects_safety=False,
                    options=[
                        ClarificationOption(
                            id=f"select_{cat1}",
                            label=f"It is primarily {classification.display_name}",
                            target_category=cat1,
                            attributes={"override_category": cat1, "_clarification_resolved": True}
                        ),
                        ClarificationOption(
                            id=f"select_{cat2}",
                            label=f"It is primarily {alt1.display_name}",
                            target_category=cat2,
                            attributes={"override_category": cat2, "_clarification_resolved": True}
                        )
                    ]
                )

        return None

    def _build_clarification_decision(
        self,
        classification: ClassificationResult,
        clarification: ClarificationPrompt,
        user_attrs: Dict[str, Any],
        location_available: bool
    ) -> SegregationDecision:
        """Constructs an intermediate decision object awaiting user clarification."""
        return SegregationDecision(
            state=AgentState.NEEDS_CLARIFICATION,
            final_category=classification.predicted_category,
            display_name=classification.display_name,
            subtype=classification.subtype,
            confidence=classification.confidence,
            is_confident=classification.is_confident,
            explanation=f"Awaiting user clarification: {clarification.question}",
            reasons=[
                f"Preliminary visual evidence suggests {classification.display_name} ({classification.confidence:.1%}).",
                f"Safety/material condition requires confirmation: {clarification.reason}"
            ],
            safety_warnings=[{"rule_id": clarification.clarification_id, "severity": "WARNING", "warning": clarification.reason}] if clarification.affects_safety else [],
            preparation_steps=["Please answer the clarification prompt above to receive precise safety instructions."],
            disposal_route="Pending Clarification",
            facility_types_needed=[],
            separate_from_regular_trash=True,
            specialized_facility_required=clarification.affects_safety,
            clarification_prompt=clarification,
            unresolved_assumptions=["User input required to resolve critical attribute."],
            evidence_breakdown=EvidenceBreakdown(
                image_classifier_evidence={
                    "predicted_category": classification.predicted_category,
                    "confidence": classification.confidence,
                    "subtype": classification.subtype
                },
                user_provided_attributes=user_attrs,
                discrete_rule_conclusions={"state": "NEEDS_CLARIFICATION"},
                external_facility_info={"location_available": location_available}
            ),
            mathematical_audit={
                "state": "NEEDS_CLARIFICATION",
                "clarification_id": clarification.clarification_id
            }
        )


# Global Agent Singleton
_agent_instance: Optional[SegregationAgent] = None

def get_segregation_agent() -> SegregationAgent:
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = SegregationAgent()
    return _agent_instance
