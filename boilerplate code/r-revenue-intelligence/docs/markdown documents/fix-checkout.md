# Documentation Fix Checkout Log

**Project:** R-Revenue Intelligence  
**Started:** 2026-04-28  
**Fixes Approved By:** User  
**Engineer:** Antigravity AI

---

## Fix Tracker

| # | Issue | Description | Status | Files Changed |
|---|---|---|---|---|
| ISSUE-01 | Event name split | Global replace `revenuegraph.entity.linked` → `revenue_graph.entity.linked` | ✅ Fixed | SAD, Event Schema registry, Module boundary document, Database Schema, Coding standards |
| ISSUE-03 | Dual event names | Global replace `insight.summary.ready` → `call.summary.generated` | ✅ Fixed | Module boundary document, Coding standards, System_architecture.md |
| ISSUE-02 | Producer conflict | Fix `deal.stage.changed` producer in Module Boundary doc (M-07 → M-03) | ✅ Fixed | Module boundary document (line 2962 master table + line 2289 narrative) |
| ISSUE-08 | Duplicate section numbers | Renumber duplicate Section 3 headers in SAD | ✅ Fixed | System_architecture.md (sections 3.3–3.10 now sequential, duplicate 3.5 table removed) |
| ISSUE-04 | Empty ADR document | Extract ADR-001/002/002b from SAD into ADR document | ✅ Fixed | Architecture Decision Records .md (9 full ADRs written: ADR-001 through ADR-009) |
| ISSUE-06 | Event consumer conflict | Standardize `call.scored` consumers and remove `call.review.scored` variant | ✅ Fixed | SAD, Module Boundary, Coding Standards |
| ISSUE-09 | Consumer list mismatch | Add M-02 as consumer of `call.transcription.completed` | ✅ Fixed | System_architecture.md Section 2.4 table |
| ISSUE-05 | Module naming divergence | Add cross-reference note in SAD Section 2.3 module table | ✅ Fixed | System_architecture.md Section 2.3 |
| ISSUE-07 | Mermaid missing actors | Add missing external systems, differentiate M-03 | ✅ Fixed | mermaid-system-design.md |
| ISSUE-11/12 | Filename typos | Rename ADR and Mermaid files | ✅ Fixed | File system rename |
| ISSUE-13/14 | Minor flow/consumer inconsistencies | Unify consumers, fix Mermaid embedding flow | ✅ Fixed | Module boundary doc, Event registry, SAD, mermaid doc |

---

## Fix Details

### ISSUE-01 ⏳ In Progress
**Change:** `revenuegraph.entity.linked` → `revenue_graph.entity.linked`  
**Occurrences found:** ~26 across 6 files  
**Files:**
- [ ] `System_architecture.md`
- [ ] `Event Schema registry.md`
- [ ] `Module boundary document.md`
- [ ] `Database Schema.md`
- [ ] `Coding standards.md`
- [ ] *(tooling-and-services-inventory.md already uses correct form — skip)*

---

### ISSUE-03 ⏳ Pending
**Change:** `insight.summary.ready` → `call.summary.generated`  
**Files:**
- [ ] `Module boundary document.md`
- [ ] `Coding standards.md`

---

### ISSUE-02 ⏳ Pending
**Change:** Module Boundary doc line 2962 — change producer from M-07 to M-03  
**Files:**
- [ ] `Module boundary document.md`

---

### ISSUE-08 ⏳ Pending
**Change:** Renumber duplicate section headers in SAD Section 3  
**Duplicates to fix:**
- Two `3.3` headers → new additions become `3.3` (Critical Integration Security), old becomes `3.4` 
- Cascade renumber 3.4–3.7 accordingly  
**Files:**
- [ ] `System_architecture.md`

---

### ISSUE-04 ⏳ Pending
**Change:** Populate `Architecture Decision Records .md` with ADR-001, ADR-002, ADR-002b extracted from SAD  
**Files:**
- [ ] `Architecture Decision Records .md`

---

*Last updated: 2026-04-28 — All 5 issues fixed. Session complete.*

---

## Final Verification Summary

| Issue | Change | Verified |
|---|---|---|
| ISSUE-01 | `revenuegraph.entity.linked` → `revenue_graph.entity.linked` in 5 files | ✅ Zero remaining occurrences (grep confirmed) |
| ISSUE-03 | `insight.summary.ready` → `call.summary.generated` in all files | ✅ Zero remaining occurrences (grep confirmed) |
| ISSUE-02 | `deal.stage.changed` producer: M-07 → M-03 in master table + narrative | ✅ 2 locations updated in Module boundary document |
| ISSUE-08 | Section 3 renumbered: 3.1→3.10 sequential, duplicate 3.5 table removed | ✅ PowerShell header scan confirms no duplicates |
| ISSUE-04 | ADR document populated with 9 formal ADRs (ADR-001 through ADR-009) | ✅ File written, all sections present |
| ISSUE-06 | `call.review.scored` → `call.scored` in all files | ✅ Zero occurrences remain (grep confirmed) |
| ISSUE-09 | Added M-02 to `call.transcription.completed` consumers | ✅ Updated SAD event table |
| ISSUE-05 | Added canonical naming cross-reference | ✅ Added note to SAD Section 2.3 |
| ISSUE-07 | Updated mermaid diagram with actors and flow | ✅ Added Slack, LinkedIn, DWs, AIORCH->AIEMBED flow |
| ISSUE-11/12 | Renamed ADR and Mermaid files | ✅ Renamed in file system |
| ISSUE-13/14 | Standardized `call.summary.generated` consumers | ✅ Unified to M-03, M-07, M-08, M-10 across all docs |

