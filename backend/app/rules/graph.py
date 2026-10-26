"""
EcoSort Discrete Mathematics — Module 5: Graph Theory
Constructs a Directed Acyclic Graph (DAG) representing the disposal workflow:
  Vertices V = Waste Categories ∪ Material Conditions ∪ Disposal Routes ∪ Facility Types
  Edges E = Valid transitions indicating processing pipelines.
Implements Breadth-First Search (BFS) reachability and complete route pathfinding.
"""

from typing import Dict, List, Set, Tuple, Optional, Any
from collections import deque


class GraphNode:
    """Represents a vertex in the Waste Disposal Graph."""
    def __init__(self, node_id: str, label: str, node_type: str):
        self.node_id = node_id
        self.label = label
        self.node_type = node_type  # 'category', 'condition', 'route', 'facility_type'

    def to_dict(self) -> Dict[str, str]:
        return {
            "node_id": self.node_id,
            "label": self.label,
            "node_type": self.node_type
        }


class WasteDisposalGraph:
    """
    Directed Graph G = (V, E) modeling valid disposal pathways.
    """
    def __init__(self):
        self.nodes: Dict[str, GraphNode] = {}
        self.adj: Dict[str, List[str]] = {}
        self._build_canonical_graph()

    def add_node(self, node_id: str, label: str, node_type: str) -> None:
        if node_id not in self.nodes:
            self.nodes[node_id] = GraphNode(node_id, label, node_type)
            self.adj[node_id] = []

    def add_edge(self, u: str, v: str) -> None:
        """Adds a directed transition edge (u, v) in E."""
        if u in self.nodes and v in self.nodes:
            if v not in self.adj[u]:
                self.adj[u].append(v)

    def find_reachable_subgraph(self, start_node_id: str) -> Dict[str, Any]:
        """
        Performs Breadth-First Search (BFS) starting at start_node_id.
        Returns all reachable nodes grouped by layer and all traversed edges.
        """
        if start_node_id not in self.nodes:
            return {"nodes": [], "edges": [], "reachable_facility_types": []}

        visited: Set[str] = {start_node_id}
        queue = deque([start_node_id])
        traversed_edges: List[Tuple[str, str]] = []
        reachable_facility_types: List[str] = []

        while queue:
            curr = queue.popleft()
            curr_node = self.nodes[curr]
            if curr_node.node_type == "facility_type":
                reachable_facility_types.append(curr_node.label)

            for neighbor in self.adj.get(curr, []):
                traversed_edges.append((curr, neighbor))
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)

        return {
            "start_node": start_node_id,
            "total_reachable": len(visited),
            "nodes": [self.nodes[nid].to_dict() for nid in visited],
            "edges": [{"from": u, "to": v} for u, v in traversed_edges],
            "reachable_facility_types": sorted(list(set(reachable_facility_types)))
        }

    def find_all_paths(self, start_node_id: str, target_type: str = "facility_type") -> List[List[Dict[str, str]]]:
        """
        Depth-First Search (DFS) to find all valid disposal pathways from a category to a target layer.
        """
        if start_node_id not in self.nodes:
            return []

        paths: List[List[Dict[str, str]]] = []

        def dfs(current: str, current_path: List[str]):
            curr_node = self.nodes[current]
            if curr_node.node_type == target_type:
                paths.append([self.nodes[nid].to_dict() for nid in current_path])
                return

            for nxt in self.adj.get(current, []):
                if nxt not in current_path:  # Prevent cycle
                    dfs(nxt, current_path + [nxt])

        dfs(start_node_id, [start_node_id])
        return paths

    def _build_canonical_graph(self) -> None:
        """Constructs the canonical EcoSort disposal graph."""
        # 1. Categories
        categories = [
            ("cat_plastic", "Plastic", "category"),
            ("cat_paper", "Paper & Cardboard", "category"),
            ("cat_glass", "Glass", "category"),
            ("cat_metal", "Metal", "category"),
            ("cat_organic", "Organic Food Waste", "category"),
            ("cat_general", "General Residual Trash", "category"),
            ("cat_ewaste", "Electronic Waste", "category"),
            ("cat_batteries", "Batteries", "category"),
            ("cat_textile", "Textile & Clothing", "category"),
            ("cat_hazardous", "Hazardous Household Waste", "category")
        ]
        for nid, lbl, t in categories:
            self.add_node(nid, lbl, t)

        # 2. Material Conditions
        conditions = [
            ("cond_clean_dry", "Clean & Dry", "condition"),
            ("cond_rinsed", "Rinsed & Drained", "condition"),
            ("cond_broken_wrapped", "Wrapped / Secured", "condition"),
            ("cond_swollen_isolated", "Fire-Safe Isolated", "condition"),
            ("cond_data_wiped", "Factory Reset / Wiped", "condition"),
            ("cond_raw_organic", "Raw Food Scraps", "condition"),
            ("cond_sealed_chemical", "Tightly Sealed Container", "condition")
        ]
        for nid, lbl, t in conditions:
            self.add_node(nid, lbl, t)

        # 3. Disposal Routes
        routes = [
            ("route_curbside_recycling", "Curbside Recyclables Stream", "route"),
            ("route_composting", "Decentralized Aerobic Composter", "route"),
            ("route_authorized_dismantler", "Authorized E-Waste Dismantler", "route"),
            ("route_battery_takeback", "Dedicated Battery Drop Box", "route"),
            ("route_cullet_recycler", "Cullet & Bottle Recovery Bank", "route"),
            ("route_textile_donation", "Textile Reuse / Donation", "route"),
            ("route_chemical_treatment", "Hazardous Incinerator / Neutralizer", "route"),
            ("route_sanitary_landfill", "Engineered Sanitary Landfill", "route")
        ]
        for nid, lbl, t in routes:
            self.add_node(nid, lbl, t)

        # 4. Facility Types
        facility_types = [
            ("fac_mrf", "Municipal Dry Waste Sorting Centre", "facility_type"),
            ("fac_composter", "Decentralized Community Composter", "facility_type"),
            ("fac_ewaste_depot", "Authorized E-Waste Collection Centre", "facility_type"),
            ("fac_battery_drop", "Battery Drop-off Point", "facility_type"),
            ("fac_glass_point", "Glass & Bottle Collection Point", "facility_type"),
            ("fac_textile_thrift", "Textile Donation & Thrift Centre", "facility_type"),
            ("fac_haz_depot", "Household Hazardous Waste Depot", "facility_type"),
            ("fac_transfer_station", "Municipal Transfer Station", "facility_type")
        ]
        for nid, lbl, t in facility_types:
            self.add_node(nid, lbl, t)

        # 5. Edges: Category -> Condition
        self.add_edge("cat_plastic", "cond_rinsed")
        self.add_edge("cat_paper", "cond_clean_dry")
        self.add_edge("cat_glass", "cond_broken_wrapped")
        self.add_edge("cat_glass", "cond_rinsed")
        self.add_edge("cat_metal", "cond_rinsed")
        self.add_edge("cat_organic", "cond_raw_organic")
        self.add_edge("cat_general", "cond_clean_dry")
        self.add_edge("cat_ewaste", "cond_data_wiped")
        self.add_edge("cat_batteries", "cond_swollen_isolated")
        self.add_edge("cat_textile", "cond_clean_dry")
        self.add_edge("cat_hazardous", "cond_sealed_chemical")

        # 6. Edges: Condition -> Route
        self.add_edge("cond_rinsed", "route_curbside_recycling")
        self.add_edge("cond_clean_dry", "route_curbside_recycling")
        self.add_edge("cond_clean_dry", "route_textile_donation")
        self.add_edge("cond_clean_dry", "route_sanitary_landfill")
        self.add_edge("cond_broken_wrapped", "route_cullet_recycler")
        self.add_edge("cond_raw_organic", "route_composting")
        self.add_edge("cond_data_wiped", "route_authorized_dismantler")
        self.add_edge("cond_swollen_isolated", "route_battery_takeback")
        self.add_edge("cond_sealed_chemical", "route_chemical_treatment")

        # 7. Edges: Route -> Facility Type
        self.add_edge("route_curbside_recycling", "fac_mrf")
        self.add_edge("route_cullet_recycler", "fac_glass_point")
        self.add_edge("route_composting", "fac_composter")
        self.add_edge("route_authorized_dismantler", "fac_ewaste_depot")
        self.add_edge("route_battery_takeback", "fac_battery_drop")
        self.add_edge("route_textile_donation", "fac_textile_thrift")
        self.add_edge("route_chemical_treatment", "fac_haz_depot")
        self.add_edge("route_sanitary_landfill", "fac_transfer_station")


# Global Graph Instance
DISPOSAL_GRAPH = WasteDisposalGraph()
