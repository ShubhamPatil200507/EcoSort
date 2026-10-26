"""
EcoSort Discrete Mathematics — Module 3: Propositional Logic & Rule Registry
Implements formal Boolean algebra (AND, OR, NOT, IMPLIES), truth evaluations,
and an auditable, extensible Rule Registry with safety severities and explanations.
"""

from enum import Enum
from typing import Dict, Any, List, Optional
from abc import ABC, abstractmethod


class Severity(str, Enum):
    CRITICAL = "CRITICAL"   # High risk (toxic, explosive, battery fire hazard)
    WARNING = "WARNING"     # Moderate risk (contamination, broken glass, sharp edges)
    ADVISORY = "ADVISORY"   # Standard procedural advice (clean & dry, compress)


class BooleanExpr(ABC):
    """Abstract Base Class for Propositional Logic Expressions."""

    @abstractmethod
    def evaluate(self, context: Dict[str, Any]) -> bool:
        """Evaluates truth value under the given variable assignment context."""
        pass

    @abstractmethod
    def to_formal_string(self) -> str:
        """Returns mathematical propositional formula string using logical symbols."""
        pass


class Atom(BooleanExpr):
    """Propositional variable (atom)."""
    def __init__(self, key: str, expected: Any = True):
        self.key = key
        self.expected = expected

    def evaluate(self, context: Dict[str, Any]) -> bool:
        val = context.get(self.key)
        if isinstance(self.expected, bool):
            return bool(val) == self.expected
        return val == self.expected

    def to_formal_string(self) -> str:
        if isinstance(self.expected, bool):
            return f"{self.key}" if self.expected else f"¬({self.key})"
        return f"({self.key} = {self.expected})"


class And(BooleanExpr):
    """Logical Conjunction: A ∧ B"""
    def __init__(self, left: BooleanExpr, right: BooleanExpr):
        self.left = left
        self.right = right

    def evaluate(self, context: Dict[str, Any]) -> bool:
        return self.left.evaluate(context) and self.right.evaluate(context)

    def to_formal_string(self) -> str:
        return f"({self.left.to_formal_string()} ∧ {self.right.to_formal_string()})"


class Or(BooleanExpr):
    """Logical Disjunction: A ∨ B"""
    def __init__(self, left: BooleanExpr, right: BooleanExpr):
        self.left = left
        self.right = right

    def evaluate(self, context: Dict[str, Any]) -> bool:
        return self.left.evaluate(context) or self.right.evaluate(context)

    def to_formal_string(self) -> str:
        return f"({self.left.to_formal_string()} ∨ {self.right.to_formal_string()})"


class Not(BooleanExpr):
    """Logical Negation: ¬A"""
    def __init__(self, operand: BooleanExpr):
        self.operand = operand

    def evaluate(self, context: Dict[str, Any]) -> bool:
        return not self.operand.evaluate(context)

    def to_formal_string(self) -> str:
        return f"¬({self.operand.to_formal_string()})"


class Implies(BooleanExpr):
    """Material Implication: A → B ≡ ¬A ∨ B"""
    def __init__(self, antecedent: BooleanExpr, consequent: BooleanExpr):
        self.antecedent = antecedent
        self.consequent = consequent

    def evaluate(self, context: Dict[str, Any]) -> bool:
        # A -> B is True if A is False, or both are True
        if not self.antecedent.evaluate(context):
            return True
        return self.consequent.evaluate(context)

    def to_formal_string(self) -> str:
        return f"({self.antecedent.to_formal_string()} → {self.consequent.to_formal_string()})"


class Rule:
    """
    Formal Auditable Decision Rule.
    Contains: unique ID, condition expression, consequence actions, severity, and human explanation.
    """
    def __init__(
        self,
        rule_id: str,
        name: str,
        condition: BooleanExpr,
        category: str,
        severity: Severity,
        explanation: str,
        consequences: Dict[str, Any]
    ):
        self.rule_id = rule_id
        self.name = name
        self.condition = condition
        self.category = category
        self.severity = severity
        self.explanation = explanation
        self.consequences = consequences

    def evaluate(self, context: Dict[str, Any]) -> bool:
        return self.condition.evaluate(context)

    def get_formula(self) -> str:
        return f"{self.rule_id}: {self.condition.to_formal_string()} ⟹ {self.name}"


class RuleRegistry:
    """
    Registry and Evaluation Engine for Propositional Waste Rules.
    """
    def __init__(self):
        self._rules: List[Rule] = []
        self._register_default_rules()

    def register(self, rule: Rule) -> None:
        self._rules.append(rule)

    def evaluate_all(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluates all registered rules against the decision context.
        Returns matched rules, evaluated rules log, safety warnings, and action adjustments.
        """
        evaluated_log = []
        matched_rules = []
        safety_warnings = []
        action_adjustments = {}

        for rule in self._rules:
            is_matched = rule.evaluate(context)
            record = {
                "rule_id": rule.rule_id,
                "name": rule.name,
                "formula": rule.get_formula(),
                "severity": rule.severity.value,
                "matched": is_matched,
                "explanation": rule.explanation
            }
            evaluated_log.append(record)

            if is_matched:
                matched_rules.append(record)
                if rule.severity in (Severity.CRITICAL, Severity.WARNING):
                    safety_warnings.append({
                        "rule_id": rule.rule_id,
                        "severity": rule.severity.value,
                        "warning": rule.explanation
                    })
                # Merge consequences
                for k, v in rule.consequences.items():
                    if isinstance(v, list):
                        action_adjustments.setdefault(k, []).extend(v)
                    else:
                        action_adjustments[k] = v

        return {
            "total_evaluated": len(self._rules),
            "matched_count": len(matched_rules),
            "evaluated_log": evaluated_log,
            "matched_rules": matched_rules,
            "safety_warnings": safety_warnings,
            "adjustments": action_adjustments
        }

    def _register_default_rules(self) -> None:
        """Registers the standard propositional disposal rules."""

        # RULE-EWASTE-01: (category = e_waste) ∧ location_available -> specialized centre search enabled
        self.register(Rule(
            rule_id="RULE-EWASTE-01",
            name="Mandatory Authorized E-Waste Drop-Off",
            condition=And(
                Atom("category", "e_waste"),
                Atom("location_available", True)
            ),
            category="e_waste",
            severity=Severity.WARNING,
            explanation="Electronic items contain lead, mercury, and halogenated flame retardants. Must be routed to authorized e-waste recyclers.",
            consequences={
                "require_authorized_centre": True,
                "data_security_wipe_recommended": True,
                "preparation_steps": ["Remove personal data and factory reset memory chips before disposal.", "Keep all cables and adapters bundled together."]
            }
        ))

        # RULE-BATT-01: (category = batteries) ∧ is_damaged -> CRITICAL lithium thermal safety
        self.register(Rule(
            rule_id="RULE-BATT-01",
            name="Swollen/Damaged Lithium Battery Fire Hazard",
            condition=And(
                Atom("category", "batteries"),
                Atom("is_damaged", True)
            ),
            category="batteries",
            severity=Severity.CRITICAL,
            explanation="CRITICAL SAFETY: Swollen or pierced lithium batteries can experience thermal runaway and explosive combustion. Isolate in a non-flammable sandbox or vermiculite bucket immediately.",
            consequences={
                "prohibit_standard_bin": True,
                "immediate_isolation_required": True,
                "preparation_steps": ["Do NOT puncture, squeeze, or apply water.", "Place battery in a container with sand or dry baking soda.", "Contact certified hazardous material responders."]
            }
        ))

        # RULE-BATT-02: (category = batteries) ∧ ¬(is_damaged) -> Standard battery drop-off
        self.register(Rule(
            rule_id="RULE-BATT-02",
            name="Standard Battery Terminal Taping",
            condition=And(
                Atom("category", "batteries"),
                Not(Atom("is_damaged", True))
            ),
            category="batteries",
            severity=Severity.WARNING,
            explanation="Tape active battery terminals with non-conductive electrical tape to prevent short circuits during transport.",
            consequences={
                "tape_terminals": True,
                "preparation_steps": ["Cover exposed (+ / -) electrical terminals with clear scotch or electrical tape."]
            }
        ))

        # RULE-GLASS-01: (category = glass) ∧ is_broken -> Broken glass puncture hazard
        self.register(Rule(
            rule_id="RULE-GLASS-01",
            name="Broken Glass Handling & Puncture Safeguards",
            condition=And(
                Atom("category", "glass"),
                Atom("is_broken", True)
            ),
            category="glass",
            severity=Severity.WARNING,
            explanation="Broken glass poses severe laceration risks to municipal sanitary workers. Never discard loose in bin bags.",
            consequences={
                "wrap_required": True,
                "preparation_steps": ["Wrap broken glass securely in double-layer thick cardboard or puncture-resistant container.", "Clearly label 'SHARP GLASS' on outer wrap."]
            }
        ))

        # RULE-PLASTIC-01: (category = plastic) ∧ food_contaminated -> Rinse required
        self.register(Rule(
            rule_id="RULE-PLASTIC-01",
            name="Plastic Food Residue Decontamination",
            condition=And(
                Atom("category", "plastic"),
                Atom("food_contaminated", True)
            ),
            category="plastic",
            severity=Severity.ADVISORY,
            explanation="Organic residue spoils entire recyclable baling batches and attracts vermin at sorting facilities. Must rinse clean.",
            consequences={
                "rinse_required": True,
                "preparation_steps": ["Scrape remaining solids and rinse with greywater.", "Allow to air-dry before placing into dry recycling bin."]
            }
        ))

        # RULE-HAZ-01: (category = hazardous) -> Complete prohibition from domestic streams
        self.register(Rule(
            rule_id="RULE-HAZ-01",
            name="Toxic/Hazardous Universal Prohibition",
            condition=Atom("category", "hazardous"),
            category="hazardous",
            severity=Severity.CRITICAL,
            explanation="Hazardous chemicals, automotive fluids, and pesticides severely contaminate groundwater and release toxic fumes. Never pour down drains or put in curbside bins.",
            consequences={
                "strictly_prohibit_curbside": True,
                "specialized_depot_required": True,
                "preparation_steps": ["Keep in original labeled container with cap tightly sealed.", "Never mix distinct chemical products together."]
            }
        ))

        # RULE-ORGANIC-01: (category = organic_food) -> Home composting / municipal wet waste
        self.register(Rule(
            rule_id="RULE-ORGANIC-01",
            name="Organic Diversion to Aerobic Composting",
            condition=Atom("category", "organic_food"),
            category="organic_food",
            severity=Severity.ADVISORY,
            explanation="Diverting organic waste from landfills prevents anaerobic decomposition and reduces potent methane gas emissions.",
            consequences={
                "prefer_compost": True,
                "preparation_steps": ["Separate any plastic wrappers, stickers, or packaging before composting.", "Chop large fibrous scraps into smaller pieces for faster decomposition."]
            }
        ))

        # RULE-MULTI-01: (is_multi_object = True) -> Multi-Material Segregation Directive
        self.register(Rule(
            rule_id="RULE-MULTI-01",
            name="Multi-Material Physical Separation Directive",
            condition=Atom("is_multi_object", True),
            category="general_residual",
            severity=Severity.WARNING,
            explanation="Multiple waste streams detected in one image. Materials must be detached and sorted into their respective stream bins to prevent sorting plant contamination.",
            consequences={
                "require_disassembly": True,
                "preparation_steps": ["Physically detach distinct materials (e.g. separate metal caps from plastic bottles, or remove plastic film from paper boxes)."]
            }
        ))
