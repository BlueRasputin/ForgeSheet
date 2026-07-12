#!/usr/bin/env python3
"""Build a copyright-safe PHB companion index for ForgeSheet.

The generated SQLite database stores derived metadata only: page anchors,
detected topics, controlled keywords, short original summaries, and app
implementation hooks. It intentionally does not store PHB body text.
"""

from __future__ import annotations

import datetime as dt
import json
import re
import sqlite3
import sys
from collections import Counter
from pathlib import Path

try:
    from pypdf import PdfReader
except Exception as exc:  # pragma: no cover - dependency check helper
    raise SystemExit(f"pypdf is required to build the reference database: {exc}")


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PDF = Path("/Users/bluerasputin/Downloads/Player's Handbook.pdf")
DB_PATH = ROOT / "data" / "phb_reference.sqlite"

KEYWORD_GROUPS = {
    "character_creation": [
        "character", "race", "class", "background", "alignment", "experience",
        "level", "proficiency", "ability score", "hit points"
    ],
    "ability_checks": [
        "ability check", "saving throw", "skill", "advantage", "disadvantage",
        "proficiency bonus", "difficulty class"
    ],
    "equipment": [
        "armor", "weapon", "equipment", "adventuring gear", "tool", "mount",
        "vehicle", "coin", "weight", "encumbrance"
    ],
    "combat": [
        "initiative", "turn", "action", "reaction", "bonus action", "attack",
        "damage", "cover", "grapple", "shove", "opportunity attack"
    ],
    "spellcasting": [
        "spell", "cantrip", "spell slot", "prepared", "ritual", "concentration",
        "casting time", "range", "components", "duration"
    ],
    "adventuring": [
        "travel", "movement", "rest", "light", "vision", "food", "water",
        "exhaustion", "environment"
    ],
    "conditions": [
        "blinded", "charmed", "deafened", "frightened", "grappled", "incapacitated",
        "invisible", "paralyzed", "petrified", "poisoned", "prone", "restrained",
        "stunned", "unconscious"
    ],
    "customization": [
        "multiclass", "feat", "optional", "ability score improvement"
    ],
}


CONCEPTS = [
    ("character-builder-flow", "Character Builder Flow", "character_creation", "guided builder", "Use a step tracker for identity, class, abilities, background, equipment, spells, and review.", "Drive the Builder tab checklist and validation warnings."),
    ("class-level-progression", "Class Level Progression", "character_creation", "class table", "Represent class tables as machine-readable level rows with proficiencies, resources, spellcasting, and feature unlocks.", "Upgrade level-up automation with per-class source data and review prompts."),
    ("background-personality", "Background And Personality", "character_creation", "background", "Track proficiencies, languages, equipment notes, personality traits, ideals, bonds, and flaws separately.", "Improve imports and make roleplay prompts printable and shareable."),
    ("ability-checks-skills", "Ability Checks And Skills", "ability_checks", "skills", "Ability checks combine ability modifiers with proficiency, expertise-like bonuses, and situational modifiers.", "Add one-click skill rolls with custom bonus fields and DM-visible roll history."),
    ("saving-throws", "Saving Throws", "ability_checks", "saving throws", "Saving throws use ability modifiers and selected proficiencies, often triggered by spells, traps, and hazards.", "Add save buttons beside each ability and condition-based reminders."),
    ("equipment-weight", "Equipment Weight And Containers", "equipment", "encumbrance", "Inventory should track quantity, weight, carried state, containers, coins, armor, weapons, and gear notes.", "Expand equipment cards with attunement, carried/equipped toggles, and weight math."),
    ("weapon-attacks", "Weapon And Attack Rows", "combat", "attacks", "Attack rows need ability selection, proficiency toggle, range, damage dice, damage type, and notes.", "Generate attack actions from equipped weapons and class features."),
    ("turn-economy", "Turn Economy", "combat", "actions", "Combat turns revolve around movement plus actions, bonus actions, reactions, and limited special options.", "Group Play tab actions by action type and reset reaction on turn advance."),
    ("damage-healing-rests", "Damage Healing And Rests", "adventuring", "rests", "Short and long rests recover different pools and should update hit dice, HP, slots, and class resources.", "Continue rest automation with resource-specific recovery rules."),
    ("conditions-reference", "Conditions Reference", "conditions", "conditions", "Conditions are compact status rules that affect movement, senses, attacks, checks, and actions.", "Keep condition cards, then add condition-linked roll modifiers and reminders."),
    ("spell-preparation", "Spell Preparation", "spellcasting", "prepared spells", "Prepared spell counts depend on class rules, level, ability modifiers, and sometimes subclass or feature exceptions.", "Add per-class preparation formulas and warnings when over-prepared."),
    ("spell-slot-casting", "Spell Slots And Casting", "spellcasting", "spell slots", "Casting consumes slots at the chosen level unless the spell is a cantrip, ritual, or special feature cast.", "Refine cast buttons with pact slots, free casts, ritual casting, and upcast notes."),
    ("spell-components", "Spell Components", "spellcasting", "components", "Spell components and concentration affect whether a spell can be cast and what must be tracked afterward.", "Add concentration conflict prompts and material component reminders."),
    ("multiclass-planning", "Multiclass Planning", "customization", "multiclass", "Multiclassing needs prerequisite checks, combined spell slot handling, and class feature tracking per class level.", "Build a real class-level stack instead of a single class/level pair."),
    ("feat-planning", "Feat Planning", "customization", "feats", "Feats are optional character customization choices often tied to ability score improvement levels.", "Add a feat library with prerequisites, granted bonuses, and action/resource hooks."),
]


FEATURE_SUGGESTIONS = [
    ("P0", "Class progression data editor", "class-level-progression", "Add a DM/player editable table builder for every class level, including resources, spell slots, known/prepared spells, and feature grants."),
    ("P0", "True multiclass character model", "multiclass-planning", "Store class levels as a list, calculate total level separately, and combine spellcasting slots from class entries."),
    ("P0", "Roll buttons everywhere", "ability-checks-skills,saving-throws,weapon-attacks", "Add roll controls to skills, saves, attacks, death saves, hit dice, and custom actions with history shared to DM mode."),
    ("P1", "Equipment cards with equipped state", "equipment-weight,weapon-attacks", "Let items be carried, equipped, containered, attuned, and consumed; generate AC and attacks from equipped items."),
    ("P1", "Resource recovery rules", "damage-healing-rests,class-level-progression", "Let each resource define recovery behavior for short rest, long rest, dawn, turn start, or manual reset."),
    ("P1", "Spellcasting rules engine", "spell-preparation,spell-slot-casting,spell-components", "Separate cantrips, prepared spells, known spells, rituals, pact magic, free casts, concentration, and component warnings."),
    ("P1", "Condition-aware roll modifiers", "conditions-reference,ability-checks-skills,combat", "When conditions are toggled, surface relevant reminders near attacks, saves, movement, and actions."),
    ("P2", "Background and origin builder", "background-personality", "Make background proficiencies, languages, tools, equipment, and roleplay traits structured and importable."),
    ("P2", "Adventure clock and travel tools", "adventuring", "Track marching order, travel pace, light, exhaustion, food, water, watches, and daily resource changes."),
    ("P2", "Feat and boon library", "feat-planning", "Add a local custom feat system with prerequisites, passive bonuses, resources, actions, and notes."),
]


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip().lower()


def detected_keywords(text: str) -> tuple[str, str]:
    hits: list[str] = []
    categories = Counter()
    for category, keywords in KEYWORD_GROUPS.items():
        for keyword in keywords:
            if keyword in text:
                hits.append(keyword)
                categories[category] += 1
    top_category = categories.most_common(1)[0][0] if categories else "general"
    return top_category, ", ".join(sorted(set(hits))[:12])


def detect_chapter(text: str, previous: str) -> str:
    chapter_match = re.search(r"chapter\s+(\d+)\s*[:.]\s*([a-z][a-z\s,&'-]{3,60})", text)
    if chapter_match:
        return f"Chapter {chapter_match.group(1)}: {chapter_match.group(2).title()}"
    appendix_match = re.search(r"appendix\s+([a-z])\s*[:.]\s*([a-z][a-z\s,&'-]{3,60})", text)
    if appendix_match:
        return f"Appendix {appendix_match.group(1).upper()}: {appendix_match.group(2).title()}"
    return previous


def page_note(category: str, keywords: str) -> str:
    if not keywords:
        return "Indexed for navigation; no controlled rules keywords were detected confidently."
    readable = keywords.replace(", ", ", ")
    return f"Derived index page for {category.replace('_', ' ')} topics: {readable}."


def connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(DB_PATH)
    con.execute("PRAGMA foreign_keys = ON")
    return con


def reset_schema(con: sqlite3.Connection) -> None:
    con.executescript(
        """
        DROP TABLE IF EXISTS feature_suggestions;
        DROP TABLE IF EXISTS rule_concepts;
        DROP TABLE IF EXISTS page_index;
        DROP TABLE IF EXISTS source_documents;

        CREATE TABLE source_documents (
          id INTEGER PRIMARY KEY,
          title TEXT NOT NULL,
          path TEXT NOT NULL,
          page_count INTEGER NOT NULL,
          indexed_at TEXT NOT NULL,
          copyright_note TEXT NOT NULL
        );

        CREATE TABLE page_index (
          id INTEGER PRIMARY KEY,
          source_id INTEGER NOT NULL REFERENCES source_documents(id),
          pdf_page INTEGER NOT NULL,
          inferred_chapter TEXT NOT NULL,
          category TEXT NOT NULL,
          keywords TEXT NOT NULL,
          note TEXT NOT NULL,
          UNIQUE(source_id, pdf_page)
        );

        CREATE TABLE rule_concepts (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          keywords TEXT NOT NULL,
          summary TEXT NOT NULL,
          app_hook TEXT NOT NULL,
          related_pages TEXT NOT NULL
        );

        CREATE TABLE feature_suggestions (
          id INTEGER PRIMARY KEY,
          priority TEXT NOT NULL,
          title TEXT NOT NULL,
          source_concepts TEXT NOT NULL,
          implementation_note TEXT NOT NULL
        );

        CREATE INDEX idx_page_index_category ON page_index(category);
        CREATE INDEX idx_page_index_chapter ON page_index(inferred_chapter);
        CREATE INDEX idx_rule_concepts_category ON rule_concepts(category);
        """
    )


def related_pages(page_rows: list[dict[str, str]], category: str, keywords: str) -> str:
    terms = [term.strip() for term in keywords.split(",") if term.strip()]
    matches: list[int] = []
    for row in page_rows:
        row_text = f"{row['category']} {row['keywords']}"
        if row["category"] == category or any(term in row_text for term in terms):
            matches.append(row["pdf_page"])
        if len(matches) >= 12:
            break
    return json.dumps(matches)


def build(pdf_path: Path) -> None:
    if not pdf_path.exists():
        raise SystemExit(f"PDF not found: {pdf_path}")

    reader = PdfReader(str(pdf_path))
    page_rows: list[dict[str, str]] = []
    current_chapter = "Front Matter"

    for index, page in enumerate(reader.pages, start=1):
        text = clean_text(page.extract_text() or "")
        current_chapter = detect_chapter(text, current_chapter)
        category, keywords = detected_keywords(text)
        page_rows.append(
            {
                "pdf_page": index,
                "inferred_chapter": current_chapter,
                "category": category,
                "keywords": keywords,
                "note": page_note(category, keywords),
            }
        )

    con = connect()
    with con:
        reset_schema(con)
        cur = con.execute(
            """
            INSERT INTO source_documents (title, path, page_count, indexed_at, copyright_note)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                "Player's Handbook companion index",
                str(pdf_path),
                len(reader.pages),
                dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
                "Derived metadata only. PHB body text is not stored in this database.",
            ),
        )
        source_id = cur.lastrowid
        con.executemany(
            """
            INSERT INTO page_index (source_id, pdf_page, inferred_chapter, category, keywords, note)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            [
                (
                    source_id,
                    row["pdf_page"],
                    row["inferred_chapter"],
                    row["category"],
                    row["keywords"],
                    row["note"],
                )
                for row in page_rows
            ],
        )
        con.executemany(
            """
            INSERT INTO rule_concepts (id, name, category, keywords, summary, app_hook, related_pages)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            [
                (id_, name, category, keywords, summary, app_hook, related_pages(page_rows, category, keywords))
                for id_, name, category, keywords, summary, app_hook in CONCEPTS
            ],
        )
        con.executemany(
            """
            INSERT INTO feature_suggestions (priority, title, source_concepts, implementation_note)
            VALUES (?, ?, ?, ?)
            """,
            FEATURE_SUGGESTIONS,
        )
    con.close()
    print(f"Wrote {DB_PATH}")
    print(f"Indexed {len(reader.pages)} pages, {len(CONCEPTS)} rule concepts, {len(FEATURE_SUGGESTIONS)} app suggestions.")


def main(argv: list[str]) -> int:
    pdf_path = Path(argv[1]).expanduser() if len(argv) > 1 else DEFAULT_PDF
    build(pdf_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
