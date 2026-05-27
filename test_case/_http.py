"""Shared HTTP helper for module smoke tests (stdlib only)."""

from __future__ import annotations

import json
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from typing import Any, Callable, Iterable, Optional


@dataclass
class SmokeResult:
    name: str
    method: str
    path: str
    status: int
    ms: int
    expected: str
    passed: bool
    body_preview: str = ""
    payload: Any = None


def request(
    method: str,
    url: str,
    *,
    tenant: Optional[str] = None,
    user: Optional[str] = None,
    body: Any = None,
    extra_headers: Optional[dict[str, str]] = None,
    timeout: int = 15,
) -> tuple[int, Any, int]:
    headers = {"Content-Type": "application/json"}
    if tenant is not None and tenant != "":
        headers["x-tenant-id"] = tenant
    if user:
        headers["x-user-id"] = user
    if extra_headers:
        headers.update(extra_headers)

    data = None
    if body is not None:
        data = json.dumps(body).encode("utf-8")

    req = urllib.request.Request(url, data=data, headers=headers, method=method.upper())
    started = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            ms = int((time.perf_counter() - started) * 1000)
            try:
                parsed: Any = json.loads(raw) if raw else None
            except json.JSONDecodeError:
                parsed = raw
            return resp.status, parsed, ms
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        ms = int((time.perf_counter() - started) * 1000)
        try:
            parsed = json.loads(raw) if raw else None
        except json.JSONDecodeError:
            parsed = raw
        return e.code, parsed, ms
    except Exception as e:
        ms = int((time.perf_counter() - started) * 1000)
        return -1, str(e), ms


def run_case(
    name: str,
    method: str,
    url: str,
    *,
    tenant: Optional[str] = None,
    user: Optional[str] = None,
    body: Any = None,
    extra_headers: Optional[dict[str, str]] = None,
    expect: Iterable[int] = (200,),
    predicate: Optional[Callable[[Any, int], bool]] = None,
) -> SmokeResult:
    status, payload, ms = request(
        method, url, tenant=tenant, user=user, body=body, extra_headers=extra_headers
    )
    expect_set = set(expect)
    ok_status = status in expect_set
    ok_shape = predicate(payload, status) if predicate else True
    passed = ok_status and ok_shape
    preview = ""
    if payload is not None:
        preview = json.dumps(payload, default=str)[:400]
    return SmokeResult(
        name=name,
        method=method.upper(),
        path=url,
        status=status,
        ms=ms,
        expected=",".join(str(x) for x in sorted(expect_set)),
        passed=passed,
        body_preview=preview,
        payload=payload,
    )


def print_result(r: SmokeResult) -> None:
    tick = "PASS" if r.passed else "FAIL"
    name = r.name.replace("\u2192", "->")
    print(
        f"[{tick}] {name:<52} {r.method:<7} {r.ms:>4}ms  "
        f"http={r.status}  expected={r.expected}",
        flush=True,
    )
    if not r.passed and r.body_preview:
        print(f"       payload: {r.body_preview[:200]}")
