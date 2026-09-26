"""Shared rule-tree and safe rich-description operations."""
from __future__ import annotations

from collections import defaultdict
from html import unescape
from typing import Any

import nh3
from bs4 import BeautifulSoup

from models.vocabulary import Rule


ALLOWED_RULE_TAGS = frozenset({"p", "br", "strong", "em", "u", "ul", "ol", "li", "table", "tbody", "tr", "td", "span"})
FONT_SIZE_ATTRIBUTE = "data-font-size"
ALLOWED_FONT_SIZES = frozenset({"14", "20"})


class RuleDescriptionError(ValueError):
    """The cleaned description does not meet the required content contract."""


def _clean_rule_html(value: str) -> str:
    cleaned = nh3.clean(
        value,
        tags=ALLOWED_RULE_TAGS,
        attributes={"span": {FONT_SIZE_ATTRIBUTE}},
        strip_comments=True,
        link_rel=None,
    )
    soup = BeautifulSoup(cleaned, "html.parser")
    for span in soup.find_all("span"):
        font_size = span.get(FONT_SIZE_ATTRIBUTE)
        # nh3 can allow the attribute by name only.  Its value remains part of
        # this narrow contract, so reconstruct the attributes rather than
        # merely trusting an already persisted fragment.
        span.attrs = {FONT_SIZE_ATTRIBUTE: font_size} if font_size in ALLOWED_FONT_SIZES else {}
    # Keep nh3 as the canonical serializer after the value-aware attribute pass.
    # BeautifulSoup emits XHTML-style <br/>, whereas the rest of this sanitizer
    # consistently emits HTML-style <br>.
    return nh3.clean(
        str(soup),
        tags=ALLOWED_RULE_TAGS,
        attributes={"span": {FONT_SIZE_ATTRIBUTE}},
        strip_comments=True,
        link_rel=None,
    )


def sanitize_rule_description(value: str, *, strict: bool) -> str:
    """Return canonical allowed HTML, silently stripping unsupported markup.

    Strict mode applies only to the visible-content check used by admin writes.
    """
    cleaned = _clean_rule_html(value).strip()
    text_only = unescape(nh3.clean(cleaned, tags=set(), attributes={}, strip_comments=True)).replace("\xa0", " ")
    if strict and not text_only.strip():
        raise RuleDescriptionError("Описание должно содержать видимый текст.")
    return cleaned


def rule_sort_key(rule: Rule) -> tuple[bool, int, str, int]:
    return (rule.ordering is None, rule.ordering if rule.ordering is not None else 0, rule.title, rule.id)


def children_by_parent(rules: list[Rule]) -> dict[int, list[Rule]]:
    known_ids = {rule.id for rule in rules}
    result: dict[int, list[Rule]] = defaultdict(list)
    for rule in rules:
        if rule.parent_rule_id in known_ids:
            result[rule.parent_rule_id].append(rule)
    return result


def root_rule_id(rules: list[Rule], rule_id: int) -> int | None:
    by_id = {rule.id: rule for rule in rules}
    current = by_id.get(rule_id)
    if current is None:
        return None
    lineage: list[int] = []
    while current.parent_rule_id is not None and current.parent_rule_id in by_id:
        if current.id in lineage:
            return min(lineage)
        lineage.append(current.id)
        current = by_id[current.parent_rule_id]
    return current.id


def subtree_ids(rules: list[Rule], root_id: int) -> set[int]:
    children = children_by_parent(rules)
    result: set[int] = set()
    pending = [root_id]
    while pending:
        current = pending.pop()
        if current in result:
            continue
        result.add(current)
        pending.extend(child.id for child in children.get(current, []))
    return result


def rule_projection(rule: Rule, children: dict[int, list[Rule]], *, include_ids: bool, ancestors: frozenset[int] = frozenset()) -> dict[str, Any]:
    lineage = ancestors | {rule.id}
    result: dict[str, Any] = {
        "title": rule.title,
        "description": sanitize_rule_description(rule.description, strict=False),
        "children": [
            rule_projection(child, children, include_ids=include_ids, ancestors=lineage)
            for child in sorted(children.get(rule.id, []), key=rule_sort_key)
            if child.id not in lineage
        ],
    }
    if include_ids:
        result = {"id": rule.id, **result}
    return result


def build_rule_forest(rules: list[Rule], *, include_admin_fields: bool = False) -> list[dict[str, Any]]:
    """Build every rule once, including malformed legacy roots, without cycles."""
    by_id = {rule.id: rule for rule in rules}
    children = children_by_parent(rules)
    roots = [rule for rule in rules if rule.parent_rule_id is None or rule.parent_rule_id not in by_id]
    emitted: set[int] = set()

    def build(rule: Rule, ancestors: frozenset[int] = frozenset()) -> dict[str, Any]:
        emitted.add(rule.id)
        lineage = ancestors | {rule.id}
        result: dict[str, Any] = {
            "id": rule.id,
            "title": rule.title,
            "description": sanitize_rule_description(rule.description, strict=False),
            "children": [build(child, lineage) for child in sorted(children.get(rule.id, []), key=rule_sort_key) if child.id not in lineage],
        }
        if include_admin_fields:
            result = {**result, "parent_rule_id": rule.parent_rule_id, "ordering": rule.ordering}
        return result

    result = [build(rule) for rule in sorted(roots, key=rule_sort_key)]
    for rule in sorted(rules, key=rule_sort_key):
        if rule.id not in emitted:
            result.append(build(rule))
    return result


def _safe_rule_hint_node(value: Any) -> dict[str, Any]:
    """Clean one descendant node; it deliberately has no root-rule metadata."""
    if not isinstance(value, dict):
        return {"title": "", "description": "", "children": []}
    children = value.get("children")
    return {
        "title": value.get("title", ""),
        "description": sanitize_rule_description(str(value.get("description", "")), strict=False),
        "children": [_safe_rule_hint_node(child) for child in children] if isinstance(children, list) else [],
    }


def safe_rule_hint_snapshot(value: Any) -> dict[str, Any]:
    """Clean a persisted hint while retaining root_rule_id on its root only."""
    result = _safe_rule_hint_node(value)
    root_id = value.get("root_rule_id") if isinstance(value, dict) else None
    if isinstance(root_id, int):
        result["root_rule_id"] = root_id
    return result
