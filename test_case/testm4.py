#!/usr/bin/env python3
"""M04 — Deal Intelligence deep smoke (memory-backed Prisma cutover)."""

from __future__ import annotations

import os
import sys
from typing import List

from _http import SmokeResult, print_result, request, run_case

BASE = os.environ.get("M04_API_URL", "http://localhost:3001")


def _url(path: str) -> str:
    return f"{BASE.rstrip('/')}{path}"


def run_all(base: str) -> List[SmokeResult]:
    global BASE
    BASE = base
    results: List[SmokeResult] = []

    def add(r: SmokeResult) -> SmokeResult:
        print_result(r)
        results.append(r)
        return r

    add(run_case("GET /m04-test/health", "GET", _url("/m04-test/health"), expect=(200,), predicate=lambda b, _: b.get("success")))
    add(run_case("POST /m04-test/smoke", "POST", _url("/m04-test/smoke"), expect=(200, 201), predicate=lambda b, _: b.get("success")))

    st, body, _ = request("GET", _url("/boards"), extra_headers={"x-user-id": "00000000-0000-0000-0000-000000000004", "x-role": "MANAGER"})
    add(
        SmokeResult(
            name="GET /boards",
            method="GET",
            path="/boards",
            status=st,
            ms=0,
            expected="200",
            passed=st == 200,
            body_preview=str(body)[:200],
        )
    )
    print_result(results[-1])

    st2, deals_body, _ = request("GET", _url("/deals?limit=5"), extra_headers={"x-user-id": "00000000-0000-0000-0000-000000000004", "x-role": "MANAGER"})
    add(
        SmokeResult(
            name="GET /deals",
            method="GET",
            path="/deals",
            status=st2,
            ms=0,
            expected="200",
            passed=st2 == 200,
            body_preview=str(deals_body)[:200],
        )
    )
    print_result(results[-1])

    passed = sum(1 for r in results if r.passed)
    print(f"\n=== M04 SUMMARY: {passed}/{len(results)} PASS ===")
    return results


def main() -> int:
    results = run_all(BASE)
    return 0 if all(r.passed for r in results) else 1


if __name__ == "__main__":
    sys.exit(main())
