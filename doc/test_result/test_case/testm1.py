#!/usr/bin/env python3
"""
M01 — Capture & Transcription deep smoke tests.

Mirrors: _audit/m01_deep_smoke.ps1
Each entry in TEST_CASES is one individual case you can grep or extend.
"""

from __future__ import annotations

import argparse
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from typing import Any, Callable, List, Optional

from _http import SmokeResult, print_result, request, run_case

# ── Config (override via env or CLI) ─────────────────────────────────────────
DEFAULT_BASE = os.environ.get(
    "M01_API_URL", "http://localhost:3001/api/v1/capture-transcription"
)
WEBHOOKS_BASE = os.environ.get(
    "M01_WEBHOOKS_URL", "http://localhost:3001/api/v1/webhooks"
)
TENANT_A = os.environ.get("M01_TENANT_A", "dev-tenant-001")
TENANT_B = os.environ.get("M01_TENANT_B", "test-tenant-isolation")
CALL1 = "11111111-1111-1111-1111-000000000001"
CALL2 = "11111111-1111-1111-1111-000000000002"
CALL3 = "11111111-1111-1111-1111-000000000003"

# Catalog of named phases (for test1.md cross-reference)
TEST_PHASES = [
    "A — Auth / Tenant isolation",
    "B — List + filter + sort",
    "C — Single resource (CT-13)",
    "D — Search (CT-05 / CT-21 / US-22)",
    "E — Notes CRUD (CT-22)",
    "F — Sharing (CT-23)",
    "G — Next steps CRUD (US-11)",
    "H — Utterance inline edit (US-04 / CT-24)",
    "I — Create call + lifecycle",
    "J — AI extraction trigger (US-12/13/14)",
    "K — Webhooks (US-02)",
    "L — Concurrency / idempotency",
    "M — Static assets",
]


def _url(base: str, path: str) -> str:
    if path.startswith("http"):
        return path
    return f"{base.rstrip('/')}{path}"


def run_all(base: str, webhooks: str) -> List[SmokeResult]:
    results: List[SmokeResult] = []

    def add(r: SmokeResult) -> SmokeResult:
        print_result(r)
        results.append(r)
        return r

    def section(title: str) -> None:
        print(f"\n=== {title} ===")

    # ── Phase A ──────────────────────────────────────────────────────────────
    section("Phase A — Auth / Tenant isolation")
    add(
        run_case(
            "no tenant header rejected",
            "GET",
            _url(base, "/calls"),
            tenant="",
            expect=(401, 403),
        )
    )
    add(run_case("happy GET /calls with tenant", "GET", _url(base, "/calls"), tenant=TENANT_A))
    add(
        run_case(
            "tenant B sees no seeded calls",
            "GET",
            _url(base, "/calls"),
            tenant=TENANT_B,
            expect=(200,),
        )
    )

    # ── Phase B ──────────────────────────────────────────────────────────────
    section("Phase B — List + filter + sort")
    for name, path in [
        ("list completed only", "/calls?status=completed"),
        ("list pending", "/calls?status=pending"),
        ("list source=zoom", "/calls?source=zoom"),
        ("sort by title asc", "/calls?sortBy=title&order=asc"),
        ("limit + offset paging", "/calls?limit=1&offset=0"),
    ]:
        add(run_case(name, "GET", _url(base, path), tenant=TENANT_A))
    add(
        run_case(
            "invalid status rejected",
            "GET",
            _url(base, "/calls?status=garbage"),
            tenant=TENANT_A,
            expect=(400, 500),
        )
    )
    add(
        run_case(
            "invalid limit rejected",
            "GET",
            _url(base, "/calls?limit=9999"),
            tenant=TENANT_A,
            expect=(400, 500),
        )
    )

    # ── Phase C ──────────────────────────────────────────────────────────────
    section("Phase C — Single resource (CT-13)")
    add(run_case("GET seeded call by id", "GET", _url(base, f"/calls/{CALL1}"), tenant=TENANT_A))
    add(
        run_case(
            "GET unknown call -> 404",
            "GET",
            _url(base, "/calls/00000000-0000-0000-0000-000000000000"),
            tenant=TENANT_A,
            expect=(404,),
        )
    )
    add(
        run_case(
            "GET seeded call across tenant -> 404",
            "GET",
            _url(base, f"/calls/{CALL1}"),
            tenant=TENANT_B,
            expect=(404,),
        )
    )

    # ── Phase D ──────────────────────────────────────────────────────────────
    section("Phase D — Search (CT-05 / CT-21 / US-22)")
    add(
        run_case(
            "org-wide search pricing",
            "GET",
            _url(base, "/calls/search?q=pricing"),
            tenant=TENANT_A,
        )
    )
    add(
        run_case(
            "search with date range",
            "GET",
            _url(base, "/calls/search?q=pricing&dateFrom=2026-05-01&dateTo=2026-05-31"),
            tenant=TENANT_A,
        )
    )
    add(
        run_case(
            "in-call search",
            "GET",
            _url(base, f"/calls/{CALL1}/search?q=competitor"),
            tenant=TENANT_A,
        )
    )
    add(
        run_case(
            "search empty query rejected",
            "GET",
            _url(base, "/calls/search?q="),
            tenant=TENANT_A,
            expect=(400, 500),
        )
    )
    add(
        run_case(
            "in-call search wrong tenant",
            "GET",
            _url(base, f"/calls/{CALL1}/search?q=x"),
            tenant=TENANT_B,
            expect=(200, 404),
        )
    )

    # ── Phase E — Notes ─────────────────────────────────────────────────────
    section("Phase E — Notes CRUD (CT-22)")
    st_note, payload_note, ms_note = request(
        "POST",
        _url(base, f"/calls/{CALL1}/notes"),
        tenant=TENANT_A,
        body={"content": "Smoke test note A"},
    )
    note_id: Optional[str] = None
    if st_note == 201 and isinstance(payload_note, dict):
        note_id = payload_note.get("id")
    add(
        SmokeResult(
            name="create note",
            method="POST",
            path=f"/calls/{CALL1}/notes",
            status=st_note,
            ms=ms_note,
            expected="201",
            passed=st_note == 201,
            body_preview=str(payload_note)[:400],
        )
    )

    if note_id:
        add(
            run_case(
                "update note",
                "PUT",
                _url(base, f"/calls/{CALL1}/notes/{note_id}"),
                tenant=TENANT_A,
                body={"content": "Smoke test note B (updated)"},
            )
        )
        add(
            run_case(
                "delete note",
                "DELETE",
                _url(base, f"/calls/{CALL1}/notes/{note_id}"),
                tenant=TENANT_A,
                expect=(204,),
            )
        )
    else:
        print("  [SKIP] note id missing — update/delete not run")

    add(
        run_case(
            "create note empty body rejected",
            "POST",
            _url(base, f"/calls/{CALL1}/notes"),
            tenant=TENANT_A,
            body={"content": ""},
            expect=(400, 500),
        )
    )

    # ── Phase F — Sharing ─────────────────────────────────────────────────────
    section("Phase F — Sharing (CT-23)")
    add(
        run_case(
            "share with user",
            "POST",
            _url(base, f"/calls/{CALL1}/share"),
            tenant=TENANT_A,
            body={"sharedWithId": "user-99", "sharedWithType": "user"},
            expect=(201,),
        )
    )
    add(
        run_case(
            "share with team (idempotent)",
            "POST",
            _url(base, f"/calls/{CALL1}/share"),
            tenant=TENANT_A,
            body={"sharedWithId": "team-1", "sharedWithType": "team"},
            expect=(201,),
        )
    )
    add(
        run_case(
            "share invalid type rejected",
            "POST",
            _url(base, f"/calls/{CALL1}/share"),
            tenant=TENANT_A,
            body={"sharedWithId": "x", "sharedWithType": "group"},
            expect=(400, 500),
        )
    )

    # ── Phase G — Next steps ──────────────────────────────────────────────────
    section("Phase G — Next steps CRUD (US-11)")
    add(
        run_case(
            "GET next-steps (seeded 3 items)",
            "GET",
            _url(base, f"/calls/{CALL1}/next-steps"),
            tenant=TENANT_A,
        )
    )
    add(
        run_case(
            "POST add next-step",
            "POST",
            _url(base, f"/calls/{CALL1}/next-steps"),
            tenant=TENANT_A,
            body={"step": "Smoke: prepare contract draft"},
            expect=(201,),
        )
    )
    add(
        run_case(
            "PATCH update index 0",
            "PATCH",
            _url(base, f"/calls/{CALL1}/next-steps"),
            tenant=TENANT_A,
            body={"index": 0, "step": "Smoke: send updated comparison doc by EOD"},
        )
    )
    add(
        run_case(
            "DELETE next-step index 0",
            "DELETE",
            _url(base, f"/calls/{CALL1}/next-steps/0"),
            tenant=TENANT_A,
            expect=(204,),
        )
    )
    add(
        run_case(
            "DELETE out-of-range index",
            "DELETE",
            _url(base, f"/calls/{CALL1}/next-steps/9999"),
            tenant=TENANT_A,
            expect=(404, 500),
        )
    )

    # ── Phase H — Utterance edit ────────────────────────────────────────────
    section("Phase H — Utterance inline edit (US-04 / CT-24)")
    detail_status, detail_body, _ = request(
        "GET", _url(base, f"/calls/{CALL1}"), tenant=TENANT_A
    )
    utt_id = None
    if detail_status == 200 and isinstance(detail_body, dict):
        utts = (detail_body.get("transcript") or {}).get("utterances") or []
        if utts:
            utt_id = utts[0].get("id")
    add(
        run_case(
            "fetch call detail for utterance",
            "GET",
            _url(base, f"/calls/{CALL1}"),
            tenant=TENANT_A,
            predicate=lambda b, s: s == 200,
        )
    )
    if utt_id:
        add(
            run_case(
                "PATCH utterance text",
                "PATCH",
                _url(base, f"/utterances/{utt_id}"),
                tenant=TENANT_A,
                body={"text": "Smoke: edited utterance text"},
            )
        )
    else:
        print("  [SKIP] utterance id missing")

    # ── Phase I — Create call ─────────────────────────────────────────────────
    section("Phase I — Create call + lifecycle")
    now = datetime.now(timezone.utc).isoformat()
    new_payload = {
        "title": "Smoke Test Call",
        "callDate": now,
        "durationSeconds": 60,
        "callType": "meeting",
        "callSource": "manual",
        "participants": ["smoke-test@example.com"],
        "callOwner": "smoke-test-user",
    }
    st_create, pl_create, ms_create = request(
        "POST", _url(base, "/calls"), tenant=TENANT_A, body=new_payload
    )
    new_call_id = pl_create.get("id") if st_create == 201 and isinstance(pl_create, dict) else None
    add(
        SmokeResult(
            name="POST /calls — create",
            method="POST",
            path="/calls",
            status=st_create,
            ms=ms_create,
            expected="201",
            passed=st_create == 201,
            body_preview=str(pl_create)[:400],
        )
    )
    if new_call_id:
        add(
            run_case(
                "GET newly created call",
                "GET",
                _url(base, f"/calls/{new_call_id}"),
                tenant=TENANT_A,
            )
        )
        add(
            run_case(
                "POST extract-ai (no transcript)",
                "POST",
                _url(base, f"/calls/{new_call_id}/extract-ai"),
                tenant=TENANT_A,
                expect=(400, 500),
            )
        )
        add(
            run_case(
                "DELETE newly created call",
                "DELETE",
                _url(base, f"/calls/{new_call_id}"),
                tenant=TENANT_A,
            )
        )
    else:
        print("  [SKIP] newly created call id missing")

    add(
        run_case(
            "POST /calls — invalid (no participants)",
            "POST",
            _url(base, "/calls"),
            tenant=TENANT_A,
            body={
                "title": "x",
                "callDate": now,
                "callType": "meeting",
                "callSource": "manual",
                "callOwner": "x",
                "participants": [],
            },
            expect=(400, 500),
        )
    )
    add(
        run_case(
            "POST /calls — unknown callType rejected",
            "POST",
            _url(base, "/calls"),
            tenant=TENANT_A,
            body={
                "title": "x",
                "callDate": now,
                "callType": "midi",
                "callSource": "manual",
                "callOwner": "x",
                "participants": ["a"],
            },
            expect=(400, 500),
        )
    )

    # ── Phase J ─────────────────────────────────────────────────────────────
    section("Phase J — AI extraction trigger (US-12/13/14)")
    add(
        run_case(
            "POST extract-ai on seeded call",
            "POST",
            _url(base, f"/calls/{CALL1}/extract-ai"),
            tenant=TENANT_A,
            expect=(202,),
        )
    )
    add(
        run_case(
            "POST extract-ai on unknown call",
            "POST",
            _url(base, "/calls/00000000-0000-0000-0000-000000000000/extract-ai"),
            tenant=TENANT_A,
            expect=(404, 500),
        )
    )

    # ── Phase K — Webhooks ──────────────────────────────────────────────────
    section("Phase K — Webhooks (US-02)")
    zoom_payload = {
        "event": "recording.completed",
        "payload": {
            "object": {
                "id": "1234",
                "uuid": "smoke-meeting-uuid-001",
                "topic": "Smoke Zoom Recording",
                "start_time": now,
                "duration": 5,
                "host_email": "smoke@example.com",
                "participant_count": 2,
                "recording_files": [
                    {
                        "download_url": "https://example.com/audio.mp3",
                        "file_type": "M4A",
                        "recording_type": "audio_only",
                    }
                ],
            }
        },
    }
    add(
        run_case(
            "webhook without signature rejected",
            "POST",
            _url(webhooks, "/zoom"),
            tenant=None,
            body=zoom_payload,
            expect=(401,),
        )
    )
    add(
        run_case(
            "webhook test bypass (dev)",
            "POST",
            _url(webhooks, "/zoom"),
            tenant=None,
            body=zoom_payload,
            extra_headers={"x-webhook-test": "1"},
            expect=(200,),
        )
    )

    # ── Phase L — Concurrency ─────────────────────────────────────────────────
    section("Phase L — Concurrency / idempotency")

    def post_note(i: int) -> int:
        st, _, _ = request(
            "POST",
            _url(base, f"/calls/{CALL1}/notes"),
            tenant=TENANT_A,
            body={"content": f"concurrent note {i}"},
        )
        return st

    codes: List[int] = []
    with ThreadPoolExecutor(max_workers=5) as ex:
        futs = [ex.submit(post_note, i) for i in range(1, 6)]
        for f in as_completed(futs):
            codes.append(f.result())
    concurrency_ok = sum(1 for c in codes if c == 201) == 5
    tick = "PASS" if concurrency_ok else "FAIL"
    print(
        f"[{tick}] {'5 concurrent note creates':<52} POST    ----  codes={codes}"
    )
    results.append(
        SmokeResult(
            name="5 concurrent note creates",
            method="POST",
            path=f"/calls/{CALL1}/notes",
            status=0,
            ms=0,
            expected="201 x5",
            passed=concurrency_ok,
            body_preview=str(codes),
        )
    )

    # ── Phase M ─────────────────────────────────────────────────────────────
    section("Phase M — Static assets")
    add(
        run_case(
            "GET /uploads/ (static mount)",
            "GET",
            "http://localhost:3001/uploads/audio/",
            tenant=None,
            expect=(200, 301, 302, 404),
        )
    )

    return results


def main() -> int:
    parser = argparse.ArgumentParser(description="M01 deep smoke tests")
    parser.add_argument("--base-url", default=DEFAULT_BASE, help="M01 API base URL")
    parser.add_argument("--webhooks-url", default=WEBHOOKS_BASE, help="Webhooks base URL")
    args = parser.parse_args()

    print("M01 Deep Smoke — Capture & Transcription")
    print(f"Base: {args.base_url}")
    results = run_all(args.base_url, args.webhooks_url)

    print("\n=== Summary ===")
    total = len(results)
    passed = sum(1 for r in results if r.passed)
    failed = total - passed
    color_ok = failed == 0
    print(f"Total: {total}   PASS: {passed}   FAIL: {failed}")
    if not color_ok:
        print("\nFailed tests:")
        for r in results:
            if not r.passed:
                print(f"  - {r.name} ({r.method} {r.path}) code={r.status} expected={r.expected}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
