#!/usr/bin/env python3
"""M05 — Account Intelligence deep smoke."""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import sys
from typing import List

from _http import SmokeResult, print_result, request, run_case

BASE = os.environ.get("M05_API_URL", "http://localhost:3001")
PREFIX = "/api/v1/account-intelligence"
TENANT = os.environ.get("M05_TENANT_A", "00000000-0000-0000-0000-000000000001")


def _url(path: str) -> str:
    return f"{BASE.rstrip('/')}{PREFIX}{path}"


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
            expect=(200,),
            predicate=lambda b, _: isinstance(b, dict) and b.get("success"),
        )
    )
    add(
        run_case(
            "POST /test/smoke",
            "POST",
            _url("/test/smoke"),
            tenant=TENANT,
            expect=(200,),
            predicate=lambda b, _: b.get("success"),
        )
    )
    add(
        run_case(
            "GET module info",
            "GET",
            _url(""),
            tenant=TENANT,
            expect=(200,),
            predicate=lambda b, _: b.get("module") == "m05-account-intelligence",
        )
    )
    add(
        run_case(
            "GET /accounts missing board_slug",
            "GET",
            _url("/accounts"),
            tenant=TENANT,
            expect=(200,),
            predicate=lambda b, _: "error" in (b or {}),
        )
    )
    add(
        run_case(
            "GET /accounts?board_slug=demo",
            "GET",
            _url("/accounts?board_slug=demo"),
            tenant=TENANT,
            expect=(200, 500),
        )
    )
    add(
        run_case(
            "GET /boards",
            "GET",
            _url("/boards"),
            tenant=TENANT,
            expect=(200, 500),
        )
    )

    # Webhook HMAC — invalid signature when secret set
    secret = os.environ.get("M05_HUBSPOT_WEBHOOK_SECRET") or os.environ.get("HUBSPOT_WEBHOOK_SECRET")
    payload = [{"eventId": 1, "subscriptionType": "company.propertyChange", "objectId": 1, "propertyName": "name", "propertyValue": "x"}]
    body_bytes = json.dumps(payload).encode()
    headers = {"Content-Type": "application/json"}
    if secret:
        bad_sig = "invalid-signature"
        st, _, _ = request(
            "POST",
            _url("/webhooks/hubspot"),
            tenant=TENANT,
            body=payload,
            extra_headers={**headers, "x-hubspot-signature-v3": bad_sig},
        )
        add(
            SmokeResult(
                name="POST webhook invalid HMAC",
                method="POST",
                path="/webhooks/hubspot",
                status=st,
                ms=0,
                expected="401",
                passed=st == 401,
            )
        )
        good_sig = hmac.new(secret.encode(), body_bytes, hashlib.sha256).digest()
        import base64

        good_sig_b64 = base64.b64encode(good_sig).decode()
        st2, body2, ms2 = request(
            "POST",
            _url("/webhooks/hubspot"),
            tenant=TENANT,
            body=payload,
            extra_headers={**headers, "x-hubspot-signature-v3": good_sig_b64},
        )
        add(
            SmokeResult(
                name="POST webhook valid HMAC",
                method="POST",
                path="/webhooks/hubspot",
                status=st2,
                ms=ms2,
                expected="200",
                passed=st2 == 200,
                body_preview=str(body2)[:120],
            )
        )
    else:
        st, body, ms = request("POST", _url("/webhooks/hubspot"), tenant=TENANT, body=payload)
        add(
            SmokeResult(
                name="POST webhook no secret (dev)",
                method="POST",
                path="/webhooks/hubspot",
                status=st,
                ms=ms,
                expected="200",
                passed=st == 200,
                body_preview=str(body)[:120],
            )
        )

    return results


def main() -> int:
    results = run_all(BASE)
    passed = sum(1 for r in results if r.passed)
    print(f"\n=== M05 SUMMARY: {passed}/{len(results)} PASS ===")
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())
