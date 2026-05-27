#!/usr/bin/env python3
"""M03 — AI Summaries & GenAI backend deep smoke tests."""

from __future__ import annotations

import os
import sys
from typing import List

from _http import SmokeResult, print_result, request, run_case

BASE = os.environ.get("M03_API_URL", "http://localhost:3001/api/v1/ai-summaries-genai")
HEADERS = {
    "X-User-Id": "c0000000-0000-0000-0000-000000000001",
    "X-Org-Id": "a0000000-0000-0000-0000-000000000001",
    "X-Role": "SALES_MANAGER",
    "X-Team-Id": "b0000000-0000-0000-0000-000000000001",
}


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

    def section(title: str) -> None:
        print(f"\n=== {title} ===")

    section("Phase A — Health")
    add(
        run_case(
            "GET /test/health",
            "GET",
            _url("/test/health"),
            expect=(200,),
            extra_headers=HEADERS,
            predicate=lambda b, _: b.get("success") is True,
        )
    )

    section("Phase B — Workspace")
    add(
        run_case(
            "GET /workspace",
            "GET",
            _url("/workspace"),
            expect=(200,),
            extra_headers=HEADERS,
            predicate=lambda b, _: isinstance(b.get("deals"), list),
        )
    )

    section("Phase C — Ask Anything")
    add(
        run_case(
            "POST /query",
            "POST",
            _url("/query"),
            expect=(200, 201),
            extra_headers=HEADERS,
            body={"query": "What objections were raised?", "contextType": "ACCOUNT"},
            predicate=lambda b, _: len((b.get("answer") or "")) > 10,
        )
    )

    section("Phase D — Research job")
    st, body, _ = request(
        "POST",
        _url("/research/jobs"),
        extra_headers=HEADERS,
        body={
            "query": "Summarize Acme deal risks",
            "contextType": "ACCOUNT",
            "contextId": "acct-1",
        },
    )
    job_id = body.get("jobId") if isinstance(body, dict) else None
    add(
        SmokeResult(
            name="POST /research/jobs",
            method="POST",
            path=_url("/research/jobs"),
            status=st,
            ms=0,
            expected="200,201,202",
            passed=st in (200, 201, 202) and bool(job_id),
            body_preview=str(body)[:200],
        )
    )
    print_result(results[-1])

    if job_id:
        import time

        time.sleep(1.2)
        add(
            run_case(
                "GET /research/jobs/:id",
                "GET",
                _url(f"/research/jobs/{job_id}"),
                expect=(200,),
                extra_headers=HEADERS,
                predicate=lambda b, _: b.get("status") in ("COMPLETED", "PROCESSING", "QUEUED"),
            )
        )

    section("Phase E — AI briefs")
    add(
        run_case(
            "POST /briefs/deal/deal-1/generate",
            "POST",
            _url("/briefs/deal/deal-1/generate"),
            expect=(200, 201),
            extra_headers=HEADERS,
            predicate=lambda b, _: b.get("success") is True,
        )
    )
    add(
        run_case(
            "GET /briefs/deal/deal-1",
            "GET",
            _url("/briefs/deal/deal-1"),
            expect=(200,),
            extra_headers=HEADERS,
            predicate=lambda b, _: b.get("success") is True,
        )
    )

    section("Phase F — Orchestrated smoke")
    add(
        run_case(
            "POST /test/smoke",
            "POST",
            _url("/test/smoke"),
            expect=(200, 201),
            extra_headers=HEADERS,
            predicate=lambda b, _: b.get("success") is True,
        )
    )

    section("Phase G — Tenant isolation")
    bad_headers = {**HEADERS, "X-Org-Id": "00000000-0000-0000-0000-000000009999"}
    add(
        run_case(
            "GET brief wrong org",
            "GET",
            _url("/briefs/deal/deal-1"),
            expect=(200,),
            extra_headers=bad_headers,
            predicate=lambda b, _: b.get("data") is None,
        )
    )

    passed = sum(1 for r in results if r.passed)
    print(f"\n=== M03 SUMMARY: {passed}/{len(results)} PASS ===")
    return results


def main() -> int:
    import argparse

    p = argparse.ArgumentParser()
    p.add_argument("--base", default=BASE)
    args = p.parse_args()
    results = run_all(args.base)
    return 0 if all(r.passed for r in results) else 1


if __name__ == "__main__":
    sys.exit(main())
