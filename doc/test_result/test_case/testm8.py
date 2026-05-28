#!/usr/bin/env python3
"""M08 — Sales Engagement backend deep smoke (API, workflows, tasks, queues)."""

from __future__ import annotations

import os
import sys
from typing import List

from _http import SmokeResult, print_result, run_case

BASE = os.environ.get("M08_API_URL", "http://localhost:3001")
PREFIX = "/api/v1/sales-engagement"
TENANT_A = os.environ.get("M08_TENANT_A", "00000000-0000-0000-0000-000000000001")
TENANT_B = os.environ.get("M08_TENANT_B", "00000000-0000-0000-0000-000000000099")
USER = os.environ.get("M08_USER", "00000000-0000-0000-0000-000000000002")


def _url(path: str) -> str:
    return f"{BASE.rstrip('/')}{PREFIX}{path}"


def _headers(role: str = "admin", user: str = USER) -> dict:
    return {
        "x-tenant-id": TENANT_A,
        "x-user-id": user,
        "x-user-role": role,
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
            "GET /test/health",
            "GET",
            _url("/test/health"),
            tenant=TENANT_A,
            extra_headers=_headers(),
            expect=(200,),
            predicate=lambda b, _: isinstance(b, dict) and b.get("success"),
        )
    )
    add(
        run_case(
            "POST /test/smoke",
            "POST",
            _url("/test/smoke"),
            tenant=TENANT_A,
            extra_headers=_headers(),
            expect=(200, 201),
            predicate=lambda b, _: b.get("success"),
        )
    )
    add(
        run_case(
            "GET /workflows",
            "GET",
            _url("/workflows"),
            tenant=TENANT_A,
            extra_headers=_headers(),
            expect=(200,),
            predicate=lambda b, _: isinstance(b, list),
        )
    )
    add(
        run_case(
            "GET /workflows/approvals (static route)",
            "GET",
            _url("/workflows/approvals"),
            tenant=TENANT_A,
            extra_headers=_headers(),
            expect=(200,),
            predicate=lambda b, _: isinstance(b, list),
        )
    )
    add(
        run_case(
            "POST /workflows/trigger invalid body",
            "POST",
            _url("/workflows/trigger"),
            tenant=TENANT_A,
            extra_headers=_headers(),
            body={},
            expect=(400,),
        )
    )
    add(
        run_case(
            "POST /workflows (rep forbidden)",
            "POST",
            _url("/workflows"),
            tenant=TENANT_A,
            extra_headers=_headers(role="representative"),
            body={"name": "x", "triggerType": "deal.stage.changed", "definition": {"steps": []}},
            expect=(403,),
        )
    )
    add(
        run_case(
            "GET /tasks",
            "GET",
            _url("/tasks"),
            tenant=TENANT_A,
            extra_headers=_headers(role="representative"),
            expect=(200,),
            predicate=lambda b, _: isinstance(b, list),
        )
    )
    add(
        run_case(
            "GET /tasks/my-tasks",
            "GET",
            _url("/tasks/my-tasks"),
            tenant=TENANT_A,
            extra_headers=_headers(role="representative"),
            expect=(200,),
            predicate=lambda b, _: isinstance(b, list),
        )
    )
    add(
        run_case(
            "GET /tasks/overdue",
            "GET",
            _url("/tasks/overdue"),
            tenant=TENANT_A,
            extra_headers=_headers(role="representative"),
            expect=(200,),
            predicate=lambda b, _: isinstance(b, list),
        )
    )
    add(
        run_case(
            "GET /plays",
            "GET",
            _url("/plays"),
            tenant=TENANT_A,
            extra_headers={"x-tenant-id": TENANT_A},
            expect=(200, 401, 403),
        )
    )
    add(
        run_case(
            "M04 /tasks/my-tasks removed (expect 404)",
            "GET",
            f"{BASE.rstrip('/')}/tasks/my-tasks",
            tenant=TENANT_A,
            expect=(404,),
        )
    )
    add(
        run_case(
            "GET /workflows tenant B isolation",
            "GET",
            _url("/workflows"),
            tenant=TENANT_B,
            extra_headers={"x-tenant-id": TENANT_B, "x-user-id": USER, "x-user-role": "admin"},
            expect=(200,),
            predicate=lambda b, _: isinstance(b, list),
        )
    )

    return results


def main() -> int:
    results = run_all(BASE)
    passed = sum(1 for r in results if r.passed)
    print(f"\nM08 backend smoke: {passed}/{len(results)} passed")
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())
