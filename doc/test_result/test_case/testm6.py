#!/usr/bin/env python3
"""M06 — Forecasting & Prediction deep smoke."""

from __future__ import annotations

import os
import sys
from typing import List

from _http import SmokeResult, print_result, run_case

BASE = os.environ.get("M06_API_URL", "http://localhost:3001")
PREFIX = "/api/v1/forecasting"
TENANT = os.environ.get("M06_TENANT_A", "demo-tenant-01")


def _url(path: str) -> str:
    return f"{BASE.rstrip('/')}{PREFIX}{path}"


def run_all(base: str) -> List[SmokeResult]:
    global BASE
    BASE = base
    results: List[SmokeResult] = []

    def add(r: SmokeResult) -> SmokeResult:
        print_result(r)
        results.append(r)
        return r

    h = {"x-tenant-id": TENANT}

    add(
        run_case(
            "GET executive snapshot",
            "GET",
            _url("/executive/snapshot?period=Q2%20FY26"),
            tenant=TENANT,
            expect=(200, 404),
        )
    )
    add(
        run_case(
            "GET ai-prediction status",
            "GET",
            _url("/periods/current/ai-prediction/status"),
            tenant=TENANT,
            expect=(200, 403, 404),
        )
    )
    add(
        run_case(
            "POST ai-prediction run",
            "POST",
            _url("/periods/current/ai-prediction/run"),
            tenant=TENANT,
            expect=(200, 201, 403, 404),
        )
    )
    add(
        run_case(
            "GET hubspot status",
            "GET",
            "http://localhost:3001/api/v1/hubspot/status",
            tenant=TENANT,
            expect=(200, 403),
        )
    )

    return results


def main() -> int:
    results = run_all(BASE)
    passed = sum(1 for r in results if r.passed)
    print(f"\n=== M06 SUMMARY: {passed}/{len(results)} PASS ===")
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())
