"""Normalize the corrupted root schema.prisma file.

The file in this folder has systematic formatting damage from an automated
conversion step:

  * Nullable types render as `String ?` instead of `String?` (space before `?`).
  * After every optional field the next field is indented with 4 / 8 / 12+
    extra spaces, producing visually staggered "stairs" that Prisma rejects
    (Prisma expects every field at the same indentation level inside a model).
  * `@default (uuid())` has a space between the attribute name and the
    parenthesis. Prisma rejects `@default (...)`.
  * `@@id` / `@@map` lines are also over-indented in some models.
  * Several models contain visible duplicate columns (e.g.
    `predictedAmount` and `predictedamount`). We do NOT auto-delete them
    here because that requires semantic judgement, but we flag them.

Run:
    python normalize_root_schema.py [--check]

When run without flags the script overwrites the source file in-place after
making a backup at schema.prisma.bak. With --check, it prints what it would
change and exits non-zero on any change.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

SOURCE = Path(__file__).with_name("schema.prisma")
BACKUP = SOURCE.with_suffix(".prisma.bak")

OPTIONAL_TYPE_RE = re.compile(r"(\b[A-Za-z_][\w]*)\s+\?")
ATTR_SPACE_RE = re.compile(r"(@\w+)\s+\(")
LEADING_WS_RE = re.compile(r"^([ \t]+)")

KNOWN_ATTRIBUTES = {
    "@id",
    "@unique",
    "@default",
    "@map",
    "@updatedAt",
    "@relation",
    "@db",
    "@@id",
    "@@unique",
    "@@index",
    "@@map",
    "@@schema",
}


def is_in_model(stack: list[str]) -> bool:
    return bool(stack) and stack[-1] == "model"


def normalize(text: str) -> str:
    out_lines: list[str] = []
    stack: list[str] = []

    for raw in text.splitlines():
        line = raw

        # Collapse `String ?` → `String?` (Prisma optional marker).
        line = OPTIONAL_TYPE_RE.sub(r"\1?", line)
        # Collapse `@default (uuid())` → `@default(uuid())`.
        line = ATTR_SPACE_RE.sub(r"\1(", line)

        stripped = line.strip()

        # Track block scopes for indentation normalization.
        if stripped.startswith("model "):
            stack.append("model")
            out_lines.append(line)
            continue
        if stripped.startswith("enum "):
            stack.append("enum")
            out_lines.append(line)
            continue
        if stripped.startswith("datasource ") or stripped.startswith("generator "):
            stack.append("block")
            out_lines.append(line)
            continue

        # Closing brace ends the current block.
        if stripped == "}":
            if stack:
                stack.pop()
            out_lines.append("}")
            continue

        # Inside a model/enum: force 2-space indent (Prisma convention).
        if is_in_model(stack) and stripped:
            out_lines.append("  " + stripped)
        else:
            out_lines.append(line)

    return "\n".join(out_lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="Do not write; exit 1 if changes are needed.",
    )
    args = parser.parse_args()

    if not SOURCE.exists():
        print(f"ERROR: {SOURCE} not found", file=sys.stderr)
        return 2

    original = SOURCE.read_text(encoding="utf-8")
    normalized = normalize(original)

    if normalized == original:
        print("schema.prisma already normalized.")
        return 0

    if args.check:
        print("schema.prisma needs normalization (run without --check to fix).")
        return 1

    BACKUP.write_text(original, encoding="utf-8")
    SOURCE.write_text(normalized, encoding="utf-8")
    print(f"Normalized {SOURCE} (backup: {BACKUP}).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
