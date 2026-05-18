# Architectural Decision Record — ADR-001-M8: Product vs Architecture Boundary Consolidation

## 1. Document Control

- **ADR Identifier:** ADR-001-M8
- **Document Title:** Product vs Architecture Boundary Consolidation
- **Module Name:** M8 Sales Engagement
- **Owner:** Product Architecture Lead — M8
- **Status:** Approved
- **Version:** v3.0
- **Last Updated:** 2026-05-18

---

## 2. Context

During the legacy Phase 1–2 development, "M8 Sales Engagement" was treated as a commercial product grouping or documentation packaging umbrella rather than a concrete software engineering boundary. The codebase was split across two legacy modules:
1. `M-02 Sales Engagement` (managing Email Composer and Engage To-Do task queues).
2. `M-08 Execution and Automation` (managing GTM Playbook Orchestration and Workflow branching rules).

This layout introduced several severe architectural problems:
- Dual configurations, multiple database schemas (`engagement` and `execution` namespaces), and split environment registries.
- Conflicting API prefixes (`/api/v1/engagement/...` vs `/api/v1/execution/...`).
- Developer confusion regarding file layout ownership, cross-import boundaries, and modular microservice extractability in future phases.

---

## 3. Decision

To resolve these technical debts and simplify the codebase layout, we have decided to **formally consolidate and unify M8 Sales Engagement into a single, concrete, and independent physical monorepo module package** located at:
👉 **`modules/m08-sales-engagement/`** at the monorepo root.

This unification is governed by the following strict rules:
1. **Unified Schema Namespace:** All M8 tables reside under the single PostgreSQL schema namespace **`m08_sales_engagement`** in standard `snake_case` format.
2. **Canonical API Prefix:** All M8 REST endpoints are routed under the unified API prefix **`/api/v1/m08-sales-engagement`** (encompassing Email Composer, Engage To-Do tasks, GTM Playbooks Orchestrate, and Workflow branching rules).
3. **Decoupled Integrations:** Upstream transactional dependencies (Opportunities, Accounts, Contacts, Activities) are accessed via standard REST endpoints from **M10 Data & Compliance**.
4. **Master Flag:** The unified module is toggled globally using the single environment variable **`M08_ENABLED`** along with specific sub-flags.

---

## 4. Consequences

- **Physical Code Organization:** The legacy folders `src/modules/m3-insight-generation` and related conceptual boundaries are removed, and all TypeScript services reside cleanly under `modules/m08-sales-engagement/`.
- **Database Simplification:** Database migration files consolidate the legacy `engagement` and `execution` tables into a clean `m08_sales_engagement.*` schema structure under PostgreSQL, backed by indexes optimized for rep prioritized queues.
- **Improved Developer Velocity:** Freshers and teams have a single clear directory to add outreach features, with uniform Zod validation interceptors and clean API routing paths.
- **Traceability:** Distributed tracing and telemetry (Jaeger/Prometheus) aggregate logs cleanly under the single `m08-sales-engagement` service name.
