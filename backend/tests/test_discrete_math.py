import pytest
from app.rules.set_theory import (
    WASTE_UNIVERSE,
    RECYCLABLE_SET,
    SPECIALIZED_FACILITY_SET,
    COMPOSTABLE_SET,
    WasteSetEngine
)
from app.rules.relations import (
    BinaryRelation,
    CATEGORY_TO_ROUTE,
    ROUTE_TO_FACILITY,
    CATEGORY_TO_FACILITY_TYPE,
    CategoryMappingFunction
)
from app.rules.logic import (
    Severity,
    Atom,
    And,
    Or,
    Not,
    Implies,
    Rule,
    RuleRegistry
)
from app.rules.predicates import Predicates
from app.rules.graph import DISPOSAL_GRAPH
from app.rules.complexity import ALGORITHM_COMPLEXITY_SPEC, ExecutionProfiler


# --- 1. Set Theory Tests ---

def test_set_universe_membership():
    assert WasteSetEngine.is_valid_category("plastic") is True
    assert WasteSetEngine.is_valid_category("e_waste") is True
    assert WasteSetEngine.is_valid_category("batteries") is True
    assert WasteSetEngine.is_valid_category("radioactive_uranium") is False

def test_set_algebraic_operations():
    set_a = {"plastic", "glass", "metal"}
    set_b = {"metal", "paper_cardboard"}
    
    # Intersection A ∩ B = {metal}
    assert WasteSetEngine.set_intersection(set_a, set_b) == {"metal"}
    
    # Union A ∪ B = {plastic, glass, metal, paper_cardboard}
    assert WasteSetEngine.set_union(set_a, set_b) == {"plastic", "glass", "metal", "paper_cardboard"}
    
    # Difference A \ B = {plastic, glass}
    assert WasteSetEngine.set_difference(set_a, set_b) == {"plastic", "glass"}

def test_centre_compatibility_via_intersection():
    accepted_facility_types = {"plastic", "metal", "paper_cardboard"}
    assert WasteSetEngine.is_compatible_centre(accepted_facility_types, "plastic") is True
    assert WasteSetEngine.is_compatible_centre(accepted_facility_types, "hazardous") is False

def test_jaccard_similarity():
    s1 = {"a", "b", "c"}
    s2 = {"b", "c", "d"}
    # |{b, c}| / |{a, b, c, d}| = 2 / 4 = 0.5
    assert WasteSetEngine.calculate_jaccard_similarity(s1, s2) == 0.5


# --- 2. Relations & Functions Tests ---

def test_binary_relation_and_composition():
    r1 = BinaryRelation("R1", "X", "Y")
    r1.add_pair("item_phone", "cat_ewaste")
    r1.add_pair("item_cable", "cat_ewaste")

    r2 = BinaryRelation("R2", "Y", "Z")
    r2.add_pair("cat_ewaste", "depot_ewaste_shredder")

    # Composition R1 ∘ R2
    comp = r1.compose(r2)
    assert "depot_ewaste_shredder" in comp.image("item_phone")
    assert "depot_ewaste_shredder" in comp.image("item_cable")

def test_category_to_facility_type_composition():
    # E-Waste should reach Authorized E-Waste Collection Centre
    facilities = CATEGORY_TO_FACILITY_TYPE.image("e_waste")
    assert "Authorized E-Waste Collection Centre" in facilities

def test_category_mapping_total_function():
    # Valid category maps to itself
    assert CategoryMappingFunction.map_category("plastic") == "plastic"
    # Unknown input maps to general_residual (total function completion)
    assert CategoryMappingFunction.map_category("unknown_substance_xyz") == "general_residual"


# --- 3. Propositional Logic & Rule Registry Tests ---

def test_boolean_expression_ast():
    ctx_true = {"a": True, "b": False}
    
    # A ∧ ¬B = True ∧ ¬False = True
    expr1 = And(Atom("a"), Not(Atom("b")))
    assert expr1.evaluate(ctx_true) is True

    # A ∧ B = True ∧ False = False
    expr2 = And(Atom("a"), Atom("b"))
    assert expr2.evaluate(ctx_true) is False

    # Implication: B → A (False → True is True)
    impl = Implies(Atom("b"), Atom("a"))
    assert impl.evaluate(ctx_true) is True

def test_rule_registry_battery_safety_evaluation():
    registry = RuleRegistry()
    
    # Normal battery
    normal_ctx = {"category": "batteries", "is_damaged": False, "location_available": True}
    res_normal = registry.evaluate_all(normal_ctx)
    matched_ids_normal = [r["rule_id"] for r in res_normal["matched_rules"]]
    assert "RULE-BATT-02" in matched_ids_normal
    assert "RULE-BATT-01" not in matched_ids_normal

    # Damaged/swollen battery (CRITICAL thermal safety)
    damaged_ctx = {"category": "batteries", "is_damaged": True, "location_available": True}
    res_damaged = registry.evaluate_all(damaged_ctx)
    matched_ids_damaged = [r["rule_id"] for r in res_damaged["matched_rules"]]
    assert "RULE-BATT-01" in matched_ids_damaged
    assert any(w["severity"] == "CRITICAL" for w in res_damaged["safety_warnings"])


# --- 4. Predicate Logic Tests ---

def test_predicates_accepts():
    dummy_centre = {
        "id": "c1",
        "accepted_waste_types": ["plastic", "glass"]
    }
    assert Predicates.accepts(dummy_centre, "plastic") is True
    assert Predicates.accepts(dummy_centre, "batteries") is False

def test_predicates_is_hazardous():
    assert Predicates.is_hazardous("hazardous") is True
    assert Predicates.is_hazardous("plastic") is False
    assert Predicates.is_hazardous("batteries", {"is_damaged": True}) is True
    assert Predicates.is_hazardous("batteries", {"is_damaged": False}) is False

def test_predicates_quantifiers():
    centres = [
        {"id": "c1", "verification_status": "OFFICIALLY_VERIFIED", "latitude": 12.97, "longitude": 77.59, "accepted_waste_types": ["plastic"]},
        {"id": "c2", "verification_status": "OFFICIALLY_VERIFIED", "latitude": 12.98, "longitude": 77.60, "accepted_waste_types": ["glass"]}
    ]
    assert Predicates.for_all_centres_authorized(centres) is True
    # Existential check
    assert Predicates.exists_eligible_centre(centres, "plastic", 12.971, 77.591, 5.0) is True
    assert Predicates.exists_eligible_centre(centres, "hazardous", 12.971, 77.591, 5.0) is False


# --- 5. Graph Theory Tests ---

def test_disposal_graph_reachability():
    # E-Waste should reach Authorized E-Waste Collection Centre
    reachable = DISPOSAL_GRAPH.find_reachable_subgraph("cat_ewaste")
    assert reachable["total_reachable"] > 0
    assert "Authorized E-Waste Collection Centre" in reachable["reachable_facility_types"]

def test_disposal_graph_plastic_reachability():
    reachable = DISPOSAL_GRAPH.find_reachable_subgraph("cat_plastic")
    assert "Municipal Dry Waste Sorting Centre" in reachable["reachable_facility_types"]


# --- 6. Complexity Specification Verification ---

def test_complexity_spec_presence():
    assert "set_universe_membership" in ALGORITHM_COMPLEXITY_SPEC
    assert "graph_bfs_traversal" in ALGORITHM_COMPLEXITY_SPEC
    assert "predicate_filtering" in ALGORITHM_COMPLEXITY_SPEC
