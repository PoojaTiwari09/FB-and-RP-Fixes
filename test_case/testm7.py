#!/usr/bin/env python3
"""M07 — Revenue Dashboards deep smoke."""

from __future__ import annotations

import os
import sys
from typing import List

from _http import SmokeResult, print_result, request, run_case

BASE = os.environ.get("M07_API_URL", "http://localhost:3001")
PREFIX = "/api/v1/revenue-dashboards"
TENANT = os.environ.get("M07_TENANT", "00000000-0000-0000-0000-000000000001")
USER = os.environ.get("M07_USER", "00000000-0000-0000-0000-000000000002")


def _url(path: str) -> str:
    return f"{BASE.rstrip('/')}{PREFIX}{path}"


def _headers() -> dict:
    return {
        "x-tenant-id": TENANT,
        "x-user-id": USER,
    }


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
            "GET module health (unguarded)",
            "GET",
            _url(""),
            tenant=TENANT,
            extra_headers=_headers(),
            expect=(200,),
            predicate=lambda b, _: isinstance(b, dict)
            and b.get("module") == "m07-revenue-dashboards"
            and b.get("message") == "OK",
        )
    )

    add(
        run_case(
            "POST module accept (unguarded)",
            "POST",
            _url(""),
            tenant=TENANT,
            extra_headers=_headers(),
            body={"probe": True},
            expect=(201, 200),
            predicate=lambda b, _: isinstance(b, dict)
            and b.get("module") == "m07-revenue-dashboards",
        )
    )

    add(
        run_case(
            "GET widgets/catalog (no JWT — expect 401)",
            "GET",
            _url("/widgets/catalog"),
            tenant=TENANT,
            extra_headers=_headers(),
            expect=(401, 403),
        )
    )

    add(
        run_case(
            "GET sample-builder (unguarded)",
            "GET",
            _url("/sample-builder"),
            tenant=TENANT,
            extra_headers=_headers(),
            expect=(200,),
            predicate=lambda b, _: isinstance(b, dict),
        )
    )

    add(
        run_case(
            "GET datasets (guarded — expect 401 without JWT)",
            "GET",
            _url("/datasets"),
            tenant=TENANT,
            extra_headers=_headers(),
            expect=(401, 403),
        )
    )

    return results


def main() -> int:
    results = run_all(BASE)
    passed = sum(1 for r in results if r.passed)
    total = len(results)
    print(f"\nM07 smoke: {passed}/{total} passed")
    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(main())
