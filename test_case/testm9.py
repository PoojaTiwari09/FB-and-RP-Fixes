#!/usr/bin/env python3
"""
M09 — Coaching & Training backend deep smoke tests.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any, List, Optional

from _http import SmokeResult, print_result, request, run_case

BASE = os.environ.get("M09_API_URL", "http://localhost:3001/api/v1/coaching-training")
TEST_EMAIL = os.environ.get("M09_TEST_EMAIL", "rep@example.com")
TEST_PASSWORD = os.environ.get("M09_TEST_PASSWORD", "password123")


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

    token: Optional[str] = None
    rep_id: Optional[str] = None
    org_id: Optional[str] = None

    # Phase A — Runtime / health
    section("Phase A — Runtime & health")
    add(
        run_case(
            "GET /test/health",
            "GET",
            _url("/test/health"),
            expect=(200,),
            predicate=lambda b, _: b.get("success") and b.get("database") == "up",
        )
    )
    add(
        run_case(
            "GET / (module root)",
            "GET",
            _url(""),
            expect=(200,),
        )
    )

    # Phase B — Seed & built-in smoke
    section("Phase B — Seed & orchestrated smoke")
    add(
        run_case(
            "POST /test/seed",
            "POST",
            _url("/test/seed"),
            expect=(200, 201),
            predicate=lambda b, _: b.get("success") and b.get("repId"),
        )
    )
    seed_st, seed_body, _ = request("POST", _url("/test/seed"))
    if seed_st in (200, 201) and isinstance(seed_body, dict):
        rep_id = seed_body.get("repId")
        org_id = seed_body.get("orgId")

    add(
        run_case(
            "POST /test/smoke (E2E session flow)",
            "POST",
            _url("/test/smoke"),
            expect=(200, 201),
            predicate=lambda b, _: b.get("success") and b.get("sessionId"),
        )
    )

    # Phase C — Auth
    section("Phase C — Auth")
    st, body, _ = request(
        "POST",
        _url("/auth/login"),
        body={"email": TEST_EMAIL, "password": TEST_PASSWORD},
    )
    if st == 200 or st == 201:
        if isinstance(body, dict):
            token = body.get("token")
            rep_id = body.get("user", {}).get("id") or rep_id
            org_id = body.get("user", {}).get("org_id") or org_id
    add(
        SmokeResult(
            name="POST /auth/login",
            method="POST",
            path="/auth/login",
            status=st,
            ms=0,
            expected="200",
            passed=st in (200, 201) and bool(token),
            body_preview=str(body)[:200],
        )
    )
    print_result(results[-1])

    add(
        run_case(
            "POST /auth/login invalid password -> 401",
            "POST",
            _url("/auth/login"),
            body={"email": TEST_EMAIL, "password": "wrong-password"},
            expect=(401,),
        )
    )
    add(
        run_case(
            "GET /scenarios w/o token -> 401",
            "GET",
            _url("/scenarios"),
            expect=(401,),
        )
    )

    auth_headers = {"Authorization": f"Bearer {token}"} if token else {}

    # Phase D — Scenarios (authenticated)
    section("Phase D — Scenarios")
    add(
        run_case(
            "GET /scenarios with JWT",
            "GET",
            _url("/scenarios"),
            extra_headers=auth_headers,
            expect=(200,),
            predicate=lambda b, _: isinstance(b, list) and len(b) > 0,
        )
    )

    scenario_id = None
    st_sc, sc_body, _ = request("GET", _url("/scenarios"), extra_headers=auth_headers)
    if st_sc == 200 and isinstance(sc_body, list) and sc_body:
        scenario_id = sc_body[0].get("id")

    if token and rep_id and org_id and scenario_id:
        section("Phase E — Session lifecycle")
        st_start, start_body, _ = request(
            "POST",
            _url("/sessions/start"),
            extra_headers=auth_headers,
            body={"scenarioId": scenario_id},
        )
        session_id = start_body.get("sessionId") if isinstance(start_body, dict) else None
        add(
            SmokeResult(
                name="POST /sessions/start",
                method="POST",
                path="/sessions/start",
                status=st_start,
                ms=0,
                expected="200,201",
                passed=st_start in (200, 201) and bool(session_id),
            )
        )
        print_result(results[-1])

        if session_id:
            add(
                run_case(
                    "POST /sessions/send-message",
                    "POST",
                    _url("/sessions/send-message"),
                    extra_headers=auth_headers,
                    body={
                        "sessionId": session_id,
                        "message": "We help teams ramp faster with AI coaching. What is your top priority?",
                    },
                    expect=(200, 201),
                    predicate=lambda b, _: isinstance(b, dict) and ("reply" in b or "message" in b),
                )
            )
            add(
                run_case(
                    "POST /sessions/end",
                    "POST",
                    _url("/sessions/end"),
                    extra_headers=auth_headers,
                    body={"sessionId": session_id},
                    expect=(200, 201),
                    predicate=lambda b, _: isinstance(b, dict),
                )
            )
            add(
                run_case(
                    "GET /sessions/:id",
                    "GET",
                    _url(f"/sessions/{session_id}"),
                    extra_headers=auth_headers,
                    expect=(200,),
                )
            )
    else:
        print("  [SKIP] session lifecycle — missing token/scenario")

    # Phase F — Provider / voices
    section("Phase F — Voices & public routes")
    add(
        run_case(
            "GET /sessions/voices (public)",
            "GET",
            _url("/sessions/voices"),
            expect=(200,),
            predicate=lambda b, _: isinstance(b, list),
        )
    )

    # Phase G — Concurrency on health
    section("Phase G — Concurrency")
    ok = 0
    with ThreadPoolExecutor(max_workers=5) as ex:
        futs = [
            ex.submit(lambda: request("GET", _url("/test/health"))[0])
            for _ in range(5)
        ]
        ok = sum(1 for f in as_completed(futs) if f.result() == 200)
    passed = ok == 5
    print(f"[{'PASS' if passed else 'FAIL'}] 5 parallel GET /test/health  ----  {ok}/5")
    results.append(
        SmokeResult(
            name="5 parallel GET /test/health",
            method="GET",
            path="/test/health",
            status=ok,
            ms=0,
            expected="200 x5",
            passed=passed,
        )
    )

    if token and rep_id:
        add(
            run_case(
                "POST /test/token (signed JWT)",
                "POST",
                _url("/test/token"),
                body={"userId": rep_id},
                expect=(200, 201),
                predicate=lambda b, _: isinstance(b.get("token"), str) and len(b["token"]) > 20,
            )
        )

    return results


def main() -> int:
    parser = argparse.ArgumentParser(description="M09 backend deep smoke")
    parser.add_argument("--base-url", default=BASE)
    args = parser.parse_args()
    print("M09 Deep Smoke — Coaching & Training (backend only)")
    print(f"Base: {args.base_url}")
    results = run_all(args.base_url)
    passed = sum(1 for r in results if r.passed)
    failed = len(results) - passed
    print(f"\n=== Summary ===\nTotal: {len(results)}   PASS: {passed}   FAIL: {failed}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
