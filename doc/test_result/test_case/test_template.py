#!/usr/bin/env python3
"""
M0N — <Module name> deep smoke tests (template).

Copy to testmN.py when stabilizing module M0N.
Mirror cases from _audit/m0N_deep_smoke.* when available.
"""

from __future__ import annotations

import argparse
import os
import sys
from typing import List

from _http import SmokeResult, run_case, print_result

MODULE = "M0N"
DEFAULT_BASE = os.environ.get(f"{MODULE}_API_URL", "http://localhost:3001/api/v1/<module-path>")
TENANT_A = os.environ.get(f"{MODULE}_TENANT_A", "00000000-0000-0000-0000-000000000001")


def _url(path: str, base: str) -> str:
    return f"{base.rstrip('/')}{path}"


def run_all(base: str) -> List[SmokeResult]:
    results: List[SmokeResult] = []

    def add(r: SmokeResult) -> None:
        print_result(r)
        results.append(r)

    print(f"\n=== Phase A — Example ===")
    add(
        run_case(
            "GET /health w/ tenant",
            "GET",
            _url("/health", base),
            tenant=TENANT_A,
            expect=(200,),
        )
    )
    # Add more run_case(...) calls — one per row in testN.md

    return results


def main() -> int:
    parser = argparse.ArgumentParser(description=f"{MODULE} deep smoke tests")
    parser.add_argument("--base-url", default=DEFAULT_BASE)
    args = parser.parse_args()
    print(f"{MODULE} Deep Smoke")
    results = run_all(args.base_url)
    passed = sum(1 for r in results if r.passed)
    failed = len(results) - passed
    print(f"\n=== Summary ===\nTotal: {len(results)}   PASS: {passed}   FAIL: {failed}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
