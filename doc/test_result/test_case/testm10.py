#!/usr/bin/env python3
"""M10 — Data & Compliance backend deep smoke."""

from __future__ import annotations

import os
import sys
from typing import List

from _http import SmokeResult, print_result, run_case

BASE = os.environ.get("M10_API_URL", "http://localhost:3001")
PREFIX = "/api/v1/m10-data-compliance"
TENANT = os.environ.get("M10_TENANT", "00000000-0000-0000-0000-000000000001")


def _url(path: str) -> str:
    return f"{BASE.rstrip('/')}{PREFIX}{path}"


def _headers() -> dict:
    return {"x-tenant-id": TENANT}


def run_all(base: str) -> List[SmokeResult]:
    global BASE
    BASE = base.rstrip("/").removesuffix(PREFIX) if base.endswith(PREFIX) else base
    results: List[SmokeResult] = []

    def add(r: SmokeResult) -> SmokeResult:
        print_result(r)
        results.append(r)
        return r

    add(
        run_case(
            "GET /test/health",
            "GET",
            _url("/test/health"),
            tenant=TENANT,
            extra_headers=_headers(),
            expect=(200,),
            predicate=lambda b, _: isinstance(b, dict) and b.get("success"),
        )
    )
    add(
        run_case(
            "POST /test/smoke (entity engine)",
            "POST",
            _url("/test/smoke"),
            tenant=TENANT,
            extra_headers=_headers(),
            expect=(200, 201),
            predicate=lambda b, _: b.get("success") and b.get("entityResolution", {}).get("bestMatch"),
        )
    )
    add(
        run_case(
            "GET /test/accounts",
            "GET",
            _url("/test/accounts"),
            tenant=TENANT,
            extra_headers=_headers(),
            expect=(200,),
            predicate=lambda b, _: isinstance(b, dict) and "data" in b,
        )
    )
    add(
        run_case(
            "GET /accounts (JWT guarded — 401)",
            "GET",
            _url("/accounts"),
            tenant=TENANT,
            extra_headers=_headers(),
            expect=(401, 403),
        )
    )
    add(
        run_case(
            "GET legacy /data-compliance stub",
            "GET",
            f"{BASE.rstrip('/')}/api/v1/data-compliance",
            tenant=TENANT,
            extra_headers=_headers(),
            expect=(200,),
        )
    )
    add(
        run_case(
            "POST /exports/replay invalid body",
            "POST",
            _url("/exports/replay"),
            tenant=TENANT,
            extra_headers=_headers(),
            body={},
            expect=(400, 401, 403),
        )
    )

    return results


def main() -> int:
    results = run_all(BASE)
    passed = sum(1 for r in results if r.passed)
    print(f"\nM10 backend smoke: {passed}/{len(results)} passed")
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())
