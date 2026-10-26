"""
EcoSort Discrete Mathematics — Module 6: Algorithm Analysis & Complexity Profiler
Documents formal asymptotic time & space complexities for all discrete engine operations
and provides a runtime profiler for empirical verification.
"""

import time
from typing import Dict, Any, Callable, Tuple


ALGORITHM_COMPLEXITY_SPEC = {
    "set_universe_membership": {
        "operation": "Category in WASTE_UNIVERSE",
        "time_complexity": "O(1) average / O(1) worst-case (FrozenSet hashing)",
        "space_complexity": "O(1)",
        "rationale": "Python frozenset hash table lookup on fixed-size universe (|U| = 10)."
    },
    "centre_set_intersection": {
        "operation": "{category} ∩ centre_accepted_types",
        "time_complexity": "O(min(|A_i|, 1)) = O(1)",
        "space_complexity": "O(1)",
        "rationale": "Target set has cardinality 1; facility accepted set |A_i| <= 10."
    },
    "predicate_filtering": {
        "operation": "Filter eligible centres across N directory entries",
        "time_complexity": "O(N)",
        "space_complexity": "O(K) where K <= N is number of eligible facilities",
        "rationale": "Single linear pass evaluating Accepts(c, w) and IsWithinRadius(c, u, r)."
    },
    "graph_bfs_traversal": {
        "operation": "Find reachable disposal subgraph from start node",
        "time_complexity": "O(|V| + |E|)",
        "space_complexity": "O(|V|)",
        "rationale": "Standard queue-based BFS visiting every reachable node and outgoing edge once."
    },
    "spatial_distance_ranking": {
        "operation": "Haversine distance computation & Timsort ranking",
        "time_complexity": "O(K log K) where K is eligible facilities",
        "space_complexity": "O(K)",
        "rationale": "Haversine is O(1) per facility; Timsort achieves O(K log K) sorting."
    },
    "rule_registry_evaluation": {
        "operation": "Evaluate R propositional rules with Boolean ASTs",
        "time_complexity": "O(R * D) where R is total rules and D is max AST depth (D <= 4)",
        "space_complexity": "O(R) for evaluation logs",
        "rationale": "Short-circuit boolean tree evaluation across registered rules."
    }
}


class ExecutionProfiler:
    """Measures actual execution time of discrete mathematical operations in milliseconds."""

    @staticmethod
    def profile(operation_name: str, fn: Callable[[], Any]) -> Tuple[Any, float]:
        start = time.perf_counter()
        result = fn()
        duration_ms = (time.perf_counter() - start) * 1000.0
        return result, round(duration_ms, 3)
