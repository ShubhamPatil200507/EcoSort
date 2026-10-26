"""
EcoSort Discrete Mathematics Rules Package
Exports set theory, relations, logic rule registry, predicates, and graph algorithms.
"""

from app.rules.set_theory import (
    WASTE_UNIVERSE,
    RECYCLABLE_SET,
    SPECIALIZED_FACILITY_SET,
    COMPOSTABLE_SET,
    REUSABLE_SET,
    RESIDUAL_SET,
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
    BooleanExpr,
    Atom,
    And,
    Or,
    Not,
    Implies,
    Rule,
    RuleRegistry
)
from app.rules.predicates import Predicates
from app.rules.graph import DISPOSAL_GRAPH, WasteDisposalGraph
from app.rules.complexity import ALGORITHM_COMPLEXITY_SPEC, ExecutionProfiler

__all__ = [
    "WASTE_UNIVERSE",
    "RECYCLABLE_SET",
    "SPECIALIZED_FACILITY_SET",
    "COMPOSTABLE_SET",
    "REUSABLE_SET",
    "RESIDUAL_SET",
    "WasteSetEngine",
    "BinaryRelation",
    "CATEGORY_TO_ROUTE",
    "ROUTE_TO_FACILITY",
    "CATEGORY_TO_FACILITY_TYPE",
    "CategoryMappingFunction",
    "Severity",
    "BooleanExpr",
    "Atom",
    "And",
    "Or",
    "Not",
    "Implies",
    "Rule",
    "RuleRegistry",
    "Predicates",
    "DISPOSAL_GRAPH",
    "WasteDisposalGraph",
    "ALGORITHM_COMPLEXITY_SPEC",
    "ExecutionProfiler"
]
