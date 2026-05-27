#!/usr/bin/env python3
"""
M02 — Conversation Intelligence deep smoke tests.

Mirrors: _audit/m02_deep_smoke.mjs
"""

from __future__ import annotations

import argparse
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List

from _http import SmokeResult, print_result, run_case

DEFAULT_BASE = os.environ.get("M02_API_URL", "http://localhost:3001/api/v1")
TENANT_A = os.environ.get("M02_TENANT_A", "00000000-0000-0000-0000-000000000001")
TENANT_B = os.environ.get("M02_TENANT_B", "00000000-0000-0000-0000-0000000000ff")
USER_A = os.environ.get("M02_USER_A", "00000000-0000-0000-0000-000000000002")

TEST_PHASES = [
    "A — Auth & tenant guard",
    "B — Conversations list & filters",
    "C — Hybrid search",
    "D — Saved searches",
    "E — Trackers",
    "F — Topic taxonomy & tags",
    "G — Translation",
    "H — Vocabulary corrections",
    "I — Concurrency stress",
]


def _url(path: str) -> str:
    if path.startswith("http"):
        return path
    return f"{DEFAULT_BASE.rstrip('/')}{path}"


def _conversations(path: str) -> str:
    return _url(f"/conversation-intelligence{path}")


def _m02(path: str) -> str:
    return _url(f"/m02-conversation-intelligence{path}")


def run_all(base: str) -> List[SmokeResult]:
    global DEFAULT_BASE
    DEFAULT_BASE = base
    results: List[SmokeResult] = []

    def add(r: SmokeResult) -> SmokeResult:
        print_result(r)
        results.append(r)
        return r

    def section(title: str) -> None:
        print(f"\n=== {title} ===")

    # ── Phase A ──────────────────────────────────────────────────────────────
    section("Phase A — Auth & Tenant guard")
    add(
        run_case(
            "GET /conversations w/o tenant -> 401",
            "GET",
            _conversations("/conversations"),
            expect=(401,),
        )
    )
    add(
        run_case(
            "GET /conversations w/ tenant A -> 200",
            "GET",
            _conversations("/conversations"),
            tenant=TENANT_A,
            predicate=lambda b, s: s == 200
            and isinstance(b, dict)
            and (isinstance(b.get("conversations"), list) or isinstance(b, list)),
        )
    )
    add(
        run_case(
            "GET /conversations w/ tenant B -> empty",
            "GET",
            _conversations("/conversations"),
            tenant=TENANT_B,
            predicate=lambda b, _: (
                isinstance((b or {}).get("conversations", b), list)
                and len((b or {}).get("conversations", b) or []) == 0
            ),
        )
    )
    add(
        run_case(
            "GET /vocabulary w/o tenant -> 401",
            "GET",
            _conversations("/vocabulary"),
            expect=(401,),
        )
    )
    add(
        run_case(
            "GET /trackers w/o tenant -> 401",
            "GET",
            _conversations("/trackers"),
            expect=(401,),
        )
    )
    add(
        run_case(
            "POST /saved-searches w/o tenant -> 401",
            "POST",
            _conversations("/saved-searches"),
            body={"name": "x"},
            expect=(401,),
        )
    )

    # ── Phase B ──────────────────────────────────────────────────────────────
    section("Phase B — Conversations list & filters")
    add(
        run_case(
            "GET /conversations limit=5 page=1",
            "GET",
            _conversations("/conversations?limit=5&page=1"),
            tenant=TENANT_A,
            predicate=lambda b, _: len((b or {}).get("conversations", [])) <= 5,
        )
    )
    add(
        run_case(
            "GET /conversations sentiment=Positive",
            "GET",
            _conversations("/conversations?sentiment=Positive&limit=3"),
            tenant=TENANT_A,
            predicate=lambda b, _: all(
                c.get("sentiment") == "Positive"
                for c in (b or {}).get("conversations", [])
            ),
        )
    )
    add(
        run_case(
            "GET /conversations channel=email",
            "GET",
            _conversations("/conversations?channel=email&limit=3"),
            tenant=TENANT_A,
            predicate=lambda b, _: all(
                c.get("channel") == "email" for c in (b or {}).get("conversations", [])
            ),
        )
    )
    add(
        run_case(
            "GET /conversations topic=Pricing Strategy",
            "GET",
            _conversations("/conversations?topic=Pricing%20Strategy&limit=3"),
            tenant=TENANT_A,
            predicate=lambda b, _: isinstance((b or {}).get("conversations"), list),
        )
    )
    add(
        run_case(
            "GET /conversations beyond page -> empty",
            "GET",
            _conversations("/conversations?page=9999&limit=10"),
            tenant=TENANT_A,
            predicate=lambda b, _: len((b or {}).get("conversations", [])) == 0,
        )
    )

    # ── Phase C ──────────────────────────────────────────────────────────────
    section("Phase C — Hybrid search")
    add(
        run_case(
            'GET /search "pricing" -> has results',
            "GET",
            _conversations("/conversations/search?query=pricing"),
            tenant=TENANT_A,
            predicate=lambda b, _: isinstance(b, list) and len(b) > 0,
        )
    )
    add(
        run_case(
            "GET /search case-insensitive",
            "GET",
            _conversations("/conversations/search?query=PRICING"),
            tenant=TENANT_A,
            predicate=lambda b, _: isinstance(b, list) and len(b) > 0,
        )
    )
    add(
        run_case(
            "GET /search empty query -> empty/all",
            "GET",
            _conversations("/conversations/search?query="),
            tenant=TENANT_A,
            predicate=lambda b, _: isinstance(b, list),
        )
    )
    add(
        run_case(
            "GET /search nonsense -> 0 results",
            "GET",
            _conversations("/conversations/search?query=zxqwerty12345"),
            tenant=TENANT_A,
            predicate=lambda b, _: isinstance(b, list) and len(b) == 0,
        )
    )
    add(
        run_case(
            "GET /search paginated (limit=3)",
            "GET",
            _conversations("/conversations/search?query=demo&limit=3&page=1"),
            tenant=TENANT_A,
            predicate=lambda b, _: isinstance(b, list) and len(b) <= 3,
        )
    )
    add(
        run_case(
            "GET /search multi-word query",
            "GET",
            _conversations("/conversations/search?query=onboarding%20training"),
            tenant=TENANT_A,
            predicate=lambda b, _: isinstance(b, list) and len(b) > 0,
        )
    )
    add(
        run_case(
            "GET /search tenant B -> empty",
            "GET",
            _conversations("/conversations/search?query=pricing"),
            tenant=TENANT_B,
            predicate=lambda b, _: isinstance(b, list) and len(b) == 0,
        )
    )

    # ── Phase D ──────────────────────────────────────────────────────────────
    section("Phase D — Saved searches")
    ts = int(time.time() * 1000)
    add(
        run_case(
            "POST /saved-searches",
            "POST",
            _conversations("/saved-searches"),
            tenant=TENANT_A,
            user=USER_A,
            body={
                "name": f"smoke-{ts}",
                "queryString": "pricing demo",
                "filters": {"sentiment": "Positive"},
            },
            expect=(200, 201),
            predicate=lambda b, _: isinstance(b, dict)
            and b.get("tenantId") == TENANT_A
            and b.get("userId") == USER_A,
        )
    )
    add(
        run_case(
            "GET /saved-searches",
            "GET",
            _conversations("/saved-searches"),
            tenant=TENANT_A,
            user=USER_A,
            predicate=lambda b, _: isinstance(b, list),
        )
    )
    add(
        run_case(
            "GET /saved-searches w/o user -> 401",
            "GET",
            _conversations("/saved-searches"),
            tenant=TENANT_A,
            expect=(401,),
        )
    )

    # ── Phase E ──────────────────────────────────────────────────────────────
    section("Phase E — Trackers")
    tracker_body = {
        "name": f"smoke-tracker-{ts}",
        "keywords": ["pricing", "demo"],
    }
    add(
        run_case(
            "POST /trackers",
            "POST",
            _conversations("/trackers"),
            tenant=TENANT_A,
            body=tracker_body,
            expect=(200, 201),
            predicate=lambda b, _: isinstance(b, dict) and (b.get("id") or b.get("tenantId")),
        )
    )
    add(
        run_case(
            "GET /trackers",
            "GET",
            _conversations("/trackers"),
            tenant=TENANT_A,
            predicate=lambda b, _: isinstance(b, list),
        )
    )
    add(
        run_case(
            "GET /trackers/stats",
            "GET",
            _conversations("/trackers/stats"),
            tenant=TENANT_A,
            predicate=lambda b, _: isinstance(b, dict) and isinstance(b.get("totalTrackers"), int),
        )
    )
    add(
        run_case(
            "GET /trackers/detections",
            "GET",
            _conversations("/trackers/detections"),
            tenant=TENANT_A,
            predicate=lambda b, _: isinstance(b, list),
        )
    )

    # ── Phase F ──────────────────────────────────────────────────────────────
    section("Phase F — Topic taxonomy & tags")
    add(
        run_case(
            "POST /topics/seed (idempotent)",
            "POST",
            _m02("/topics/seed"),
            tenant=TENANT_A,
            body={},
            expect=(200, 201),
        )
    )
    add(
        run_case(
            "GET /topics",
            "GET",
            _m02("/topics"),
            tenant=TENANT_A,
            predicate=lambda b, _: isinstance(b, list),
        )
    )
    add(
        run_case(
            "GET /topics w/o tenant -> 401",
            "GET",
            _m02("/topics"),
            expect=(401,),
        )
    )
    add(
        run_case(
            "GET /conversations/:id/topics w/o tenant -> 401",
            "GET",
            _m02("/conversations/some-id/topics"),
            expect=(401,),
        )
    )

    # ── Phase G ──────────────────────────────────────────────────────────────
    section("Phase G — Translation")
    add(
        run_case(
            "GET /translate/settings",
            "GET",
            _m02("/translate/settings"),
            tenant=TENANT_A,
            predicate=lambda b, _: isinstance(b, dict) and isinstance(b.get("defaultLanguage"), str),
        )
    )
    add(
        run_case(
            "POST /translate/settings",
            "POST",
            _m02("/translate/settings"),
            tenant=TENANT_A,
            body={
                "defaultLanguage": "English",
                "supportedLanguages": ["English", "Spanish"],
            },
            expect=(200, 201),
            predicate=lambda b, _: isinstance(b, dict),
        )
    )
    add(
        run_case(
            "GET /translate/settings w/o tenant -> 401",
            "GET",
            _m02("/translate/settings"),
            expect=(401,),
        )
    )

    # ── Phase H ──────────────────────────────────────────────────────────────
    section("Phase H — Vocabulary corrections")
    vocab_body = {
        "incorrectTerm": f"revenoose-{ts}",
        "correctTerm": "RevenueOS",
        "language": "en",
        "category": "Product",
        "mispronunciations": ["revenoose"],
        "variations": ["rev-os"],
    }
    add(
        run_case(
            "POST /vocabulary",
            "POST",
            _conversations("/vocabulary"),
            tenant=TENANT_A,
            body=vocab_body,
            expect=(200, 201),
            predicate=lambda b, _: isinstance(b, dict) and (b.get("id") or b.get("correctTerm")),
        )
    )
    add(
        run_case(
            "GET /vocabulary",
            "GET",
            _conversations("/vocabulary"),
            tenant=TENANT_A,
            predicate=lambda b, _: isinstance(b, list),
        )
    )
    add(
        run_case(
            "GET /vocabulary/stats",
            "GET",
            _conversations("/vocabulary/stats"),
            tenant=TENANT_A,
            predicate=lambda b, _: isinstance(b, dict) and isinstance(b.get("termsCount"), int),
        )
    )

    # ── Phase I ──────────────────────────────────────────────────────────────
    section("Phase I — Concurrency stress")
    N = 5

    def post_saved(i: int) -> bool:
        r = run_case(
            f"parallel saved-search {i}",
            "POST",
            _conversations("/saved-searches"),
            tenant=TENANT_A,
            user=USER_A,
            body={
                "name": f"smoke-parallel-{ts}-{i}",
                "queryString": "p" + str(i),
                "filters": {},
            },
            expect=(200, 201),
        )
        return r.passed

    ok_saved = 0
    with ThreadPoolExecutor(max_workers=N) as ex:
        futs = [ex.submit(post_saved, i) for i in range(N)]
        ok_saved = sum(1 for f in as_completed(futs) if f.result())

    passed_saved = ok_saved == N
    print(
        f"[{'PASS' if passed_saved else 'FAIL'}] "
        f"{'5 parallel /saved-searches':<52} POST    ----  {ok_saved}/{N} 2xx"
    )
    results.append(
        SmokeResult(
            name="5 parallel /saved-searches",
            method="POST",
            path="/saved-searches",
            status=ok_saved,
            ms=0,
            expected="201 x5",
            passed=passed_saved,
        )
    )

    keywords = ["pricing", "demo", "onboarding", "support", "contract"]
    ok_search = 0
    with ThreadPoolExecutor(max_workers=N) as ex:
        def search_one(q: str) -> bool:
            r = run_case(
                f"parallel search {q}",
                "GET",
                _conversations(f"/conversations/search?query={q}"),
                tenant=TENANT_A,
                predicate=lambda b, _: isinstance(b, list),
            )
            return r.passed

        futs = [ex.submit(search_one, q) for q in keywords]
        ok_search = sum(1 for f in as_completed(futs) if f.result())

    passed_search = ok_search == 5
    print(
        f"[{'PASS' if passed_search else 'FAIL'}] "
        f"{'5 parallel /search varied keywords':<52} GET     ----  {ok_search}/5 2xx"
    )
    results.append(
        SmokeResult(
            name="5 parallel /search varied keywords",
            method="GET",
            path="/conversations/search",
            status=ok_search,
            ms=0,
            expected="200 x5",
            passed=passed_search,
        )
    )

    return results


def main() -> int:
    parser = argparse.ArgumentParser(description="M02 deep smoke tests")
    parser.add_argument(
        "--base-url",
        default=DEFAULT_BASE,
        help="API base (default http://localhost:3001/api/v1)",
    )
    args = parser.parse_args()

    print("M02 Deep Smoke — Conversation Intelligence")
    print(f"Base: {args.base_url}")
    results = run_all(args.base_url)

    print("\n=== Summary ===")
    total = len(results)
    passed = sum(1 for r in results if r.passed)
    failed = total - passed
    print(f"Total: {total}   PASS: {passed}   FAIL: {failed}")
    if failed:
        for r in results:
            if not r.passed:
                print(f"  - {r.name}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
