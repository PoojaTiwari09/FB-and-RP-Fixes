# ADR-001: M8 Product vs Architecture Boundary

## Status
Pending

## Context
The "M8 Sales Engagement" folder acts as a **product grouping** rather than a unified architectural module. M8 product features are split between two distinct backend modules: **M-02 Sales Engagement** (Email Composer, Engage To-Do) and **M-08 Execution and Automation** (Orchestrate, Workflow Automation). This creates a structural conflict between product taxonomy and canonical engineering boundaries.

## Decision
We will formally recognize "M8" as a pure frontend/product grouping. The backend modules **M-02** and **M-08** will remain independent microservice boundaries. All code, databases, schemas, and events belonging to these features will continue to live under their respective canonical backend modules. M8 will serve as a documentation and product UX umbrella only.

## Consequences
- No backend code module will be named "M8".
- TDDs, codeowners, and environments must explicitly identify as M-02 or M-08.
- Developers must maintain strict event-driven boundaries between M-02 and M-08, using events or approved public APIs instead of direct schema queries.
