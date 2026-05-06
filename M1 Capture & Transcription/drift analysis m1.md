# Drift Analysis — M-01 Capture & Transcription

**Prepared:** 2026-05-05  
**Analyst:** Documentation Audit  
**Scope:** All files in `M1 Capture & Transcription/` including `TDD/` subfolder  
**Status:** Action Required

---

## 1. Files Audited

| # | File | Doc ID | Size |
|---|---|---|---|
| 1 | `m1-readme.md` | Doc #13 | 17 KB |
| 2 | `M-01 Environment Variables Registry.md` | Doc #18 | 18 KB |
| 3 | `m1-sequence diagram.md` | Doc #14 | 16 KB |
| 4 | `TDD/Call TranscriptionRevenue-intelligence-modules-and-feature-mapping.md` | Doc #11a | 32 KB |
| 5 | `TDD/Native Connectors.md` | Doc #11b | 35 KB |
| 6 | `TDD/AI Data Extractor.md` | Doc #11c | 29 KB |

---

## 2. Summary of Drifts Found

| ID | Severity | Category | Affected Files | Description |
|---|---|---|---|---|
| D-01 | 🔴 Critical | Module Name Conflict | README | README title says "M-01 Data Ingestion" but all other documents consistently call it "M-01 Capture & Transcription" |
| D-02 | 🔴 Critical | Downstream Module Reference Mismatch | README Section 3 | README references M-03 as "Revenue Graph", M-04 as "Conversation Intelligence", M-05 as "Smart Tracking", M-06 as "Insight Generation" — yet Call Transcription TDD references M-04 as "Conversation Intelligence" and M-05 as "Smart Tracking" which are different names from the README's own labelling |
| D-03 | 🟠 High | Event Consumer Mismatch | README vs Call Transcription TDD | README (Section 6) lists `call.transcription.completed` consumers as M-03, M-04, M-05, M-06. Call Transcription TDD (Section 1, 6.3) lists consumers as M-03, M-04, M-05, M-06. Consistent — but README says M-03 is "Revenue Graph" while the TDD says M-03 is also the consumer but labels it differently in narrative |
| D-04 | 🟠 High | API Prefix Inconsistency | README vs TDD files | README (Section 4) says API prefix is `api/v1/ingestion` (no leading slash). TDD files consistently use `/api/v1/ingestion/...` (with leading slash). Should be standardised |
| D-05 | 🟠 High | Confidence Threshold Conflict | AI Data Extractor TDD vs README/Sequence Diagram | AI Data Extractor TDD (Section 8.4) defines a three-tier confidence system: `≥0.80` normal, `0.70–0.80` flag for review, `<0.70` exclude from push. However, pseudocode in Section 14.1 uses `< 0.7` as the sole threshold for `flaggedForReview`. The ENV Registry (Section 5) sets `M01_EXTRACTION_CONFIDENCE_THRESHOLD` default to `0.70`. These three are inconsistent — the TDD narrative, the pseudocode, and the env var define different effective gating rules |
| D-06 | 🟠 High | Missing TDD File Name Mismatch | README vs actual files | README (Section 2 & 12) references "TDD — Call Transcription" but the actual file is named `Call TranscriptionRevenue-intelligence-modules-and-feature-mapping.md`. The file name contains an artifact of a merge/rename and does not match the documented TDD title |
| D-07 | 🟡 Medium | Related Files Path Drift | ENV Registry Section 9 | ENV Registry lists related files using paths like `docs/modules/m01/README.md`, `docs/modules/m01/env-registry.md` etc. These paths do not exist — actual files are at `M1 Capture & Transcription/m1-readme.md` and similar. The path references are stale or hypothetical |
| D-08 | 🟡 Medium | Module Boundary Description Conflict | README Section 3 vs Sequence Diagrams | README (Section 3) says M-01 does not own "CRM system-of-record sync, account/deal/contact linking, forecast logic, scorecards, summaries" and assigns these to "M-03 Revenue Graph, M-04 Conversation Intelligence, M-05 Smart Tracking, M-06 Insight Generation". Sequence diagram SD-03 correctly names M-03 Revenue Graph as the consumer of `crm.fields.extracted`. Consistent, but the module numbering used inline throughout needs verification against a master module list |
| D-09 | 🟡 Medium | Endpoint Not Documented in ENV Registry | ENV Registry vs Call Transcription TDD | Call Transcription TDD (Section 4.3) lists `POST /api/v1/ingestion/webhook/dialer` and an "internal callback endpoint for completed transcript persistence" as entry points. The internal callback endpoint is not documented in the ENV Registry or README API table |
| D-10 | 🟡 Medium | `crm.fields.extracted` Event Payload Field Gap | AI Data Extractor TDD vs README | README (Section 6) describes `crm.fields.extracted` as carrying `eventId`, `callId`, `tenantId`, extracted fields, and flagged count. AI Data Extractor TDD (Section 10.2) adds `occurredAt` to the payload. README does not mention `occurredAt`. The event schema is incomplete in the README |
| D-11 | 🟡 Medium | Table Name Casing Inconsistency | README vs TDD files | README (Section 7) refers to tables as `callrecordings`, `transcripts`, `transcriptcorrections`, `ingestionsources`, `crmextractedfields` (all lowercase). TDD files use mixed-case variants like `m01.callrecordings`, `m01.transcripts`, `m01.crmextractedfields` with schema prefix, and some places use `flaggedForReview` while others use `flaggedreview`. These should be unified |
| D-12 | 🟡 Medium | Audio Retention Default Conflict | README vs ENV Registry | README (Section 7, Data Retention Notes) states raw audio should be auto-deleted after "7 days as the default". ENV Registry (Section 5) sets `M01_AUDIO_RETENTION_DAYS` default to `7`. This is consistent in value, but the README attributes this to "the tooling document" while the ENV Registry cites it as a governance rule. The authoritative source is ambiguous |
| D-13 | 🟢 Low | Folder Structure Not Matched to TDD File Layout | README Section 8 | README suggests a folder path `src/modules/m01-data-ingestion/` — yet the module is named M-01 Capture & Transcription everywhere else. The folder name `m01-data-ingestion` reflects the old "Data Ingestion" name and does not align with "Capture & Transcription" branding |
| D-14 | 🟢 Low | Env Registry Last Updated Field is Placeholder | ENV Registry Section 1 | `Last Updated` field is set to `YYYY-MM-DD` (a placeholder), not an actual date. All TDD files have real dates (`2026-04-29`). The ENV Registry should match this standard |
| D-15 | 🟢 Low | Sequence Diagram Missing Extraction Flow as Separate Entry | Sequence Diagram vs AI Data Extractor TDD | Sequence diagram (SD-03) shows the transcript-to-extraction flow. The AI Data Extractor TDD (Section 4.3) defines additional entry points such as "admin or support re-run endpoint" and "backfill job". SD-03 does not document these alternate entry paths at all |
| D-16 | 🟢 Low | Native Connectors TDD References GTM Tools Not In README | Native Connectors TDD vs README | Native Connectors TDD (Appendix A, Section 3.2) lists "GTM tools" as an approved connector category and lists Gmail and Outlook/Office 365 as explicitly supported connectors. README (Section 2, Allowed Integrations) does not mention Gmail, Outlook, or GTM tools and only lists "Zoom, Microsoft Teams, Google Meet, dialers and telephony tools" |
| D-17 | 🟢 Low | ENV Registry Missing Internal Callback URL Variable | ENV Registry vs Call Transcription TDD | Call Transcription TDD references an "internal callback endpoint" where the transcription service sends results back. No dedicated env var exists in the registry for this callback path (e.g., `TRANSCRIPTION_CALLBACK_ENDPOINT`) — it is implied by `INTERNAL_API_BASE_URL` but not made explicit |

---

## 3. Detailed Drift Descriptions

---

### D-01 — 🔴 Module Name Conflict in README Title

**File:** `m1-readme.md` — Line 1  
**Current value:** `# Doc #13 — Module README: M-01 Data Ingestion`  
**Expected:** `# Doc #13 — Module README: M-01 Capture & Transcription`

**Evidence of drift:**
- ENV Registry (Line 5–6): `M-01 Capture & Transcription`
- Call Transcription TDD (Line 7): `M-01 Capture & Transcription`
- Native Connectors TDD (Line 7): `M-01 Capture & Transcription`
- AI Data Extractor TDD (Line 7): `M-01 Capture & Transcription`
- Sequence Diagram (Line 5): `M-01 Capture & Transcription`

**Impact:** A new engineer reading the README title will see "Data Ingestion" but every other document, TDD, and ENV Registry says "Capture & Transcription". This creates immediate confusion about module identity.

**Fix:** Rename the H1 heading to `# Doc #13 — Module README: M-01 Capture & Transcription`.

---

### D-02 — 🔴 Downstream Module References Inconsistent

**File:** `m1-readme.md` — Lines 48, 123–124  
**Issue:** README Section 3 says downstream modules include M-03, M-04, M-05, M-06, but the labels used vary between sections and between documents.

| Location | M-03 Label | M-04 Label | M-05 Label | M-06 Label |
|---|---|---|---|---|
| README Section 3 | Revenue Graph | Conversation Intelligence | Smart Tracking | Insight Generation |
| README Section 6 | Revenue Graph | — | — | — |
| Call Transcription TDD Header | — | Conversation Intelligence | Smart Tracking | Insight Generation |
| Sequence Diagram SD-02 | — (generic "Downstream Modules") | — | — | — |

**Impact:** Engineers cannot quickly confirm which module number maps to which product name without cross-referencing a master list that is not included in this folder.

**Fix:** Standardise all four module labels consistently across all six files. Add a cross-reference note in the README pointing to a master module registry.

---

### D-03 — 🟠 API Prefix Leading Slash Inconsistency

**Files:** `m1-readme.md` (Section 4 & 5), all TDD files  
**Issue:**  
- README consistently writes `api/v1/ingestion` (no leading slash)  
- TDD files and sequence diagram write `/api/v1/ingestion/...` (with leading slash)

**Examples:**
- README Line 42: `api/v1/ingestion`
- README Line 94: `api/v1/ingestion/webhook/zoom`
- Call Transcription TDD Line 133: `/api/v1/ingestion/webhook/zoom`
- Native Connectors TDD Line 140: `POST /api/v1/ingestion/sources`
- Sequence Diagram Line 368: `POST /api/v1/ingestion/sources`

**Impact:** Minor inconsistency that creates formatting confusion in documentation and could cause copy-paste errors in code. The leading slash version is the HTTP convention and should be used everywhere.

**Fix:** Standardise all endpoint references to use the leading slash: `/api/v1/ingestion`.

---

### D-04 — 🟠 Confidence Threshold Three-Way Conflict

**Files:** `TDD/AI Data Extractor.md` (Sections 8.4, 14.1), `M-01 Environment Variables Registry.md` (Section 5)

| Location | Threshold Rule |
|---|---|
| AI Data Extractor TDD Section 8.4 (narrative) | `≥0.80` = normal; `0.70–0.80` = flag review; `<0.70` = exclude |
| AI Data Extractor TDD Section 14.1 (pseudocode) | `< 0.7` = `flaggedForReview: true` (only one threshold used) |
| ENV Registry `M01_EXTRACTION_CONFIDENCE_THRESHOLD` | Default: `0.70` (implies single threshold) |
| Call Transcription TDD Section 9.5 | References `0.7` as the review threshold |

**Impact:** Engineering team has three different effective rules for what happens to a low-confidence extraction. The pseudocode and env var implement a single `0.7` boundary, while the TDD narrative describes a two-boundary system with a middle "flag" zone at `0.70–0.80`. This will directly affect production behaviour if not resolved.

**Fix:** Choose one authoritative confidence model and update all four locations to match. The three-tier model (Section 8.4) is the most complete; update pseudocode and ENV Registry to reflect it, adding `M01_EXTRACTION_CONFIDENCE_REVIEW_THRESHOLD` and `M01_EXTRACTION_CONFIDENCE_EXCLUDE_THRESHOLD` as separate env vars.

---

### D-05 — 🟠 Call Transcription TDD File Name Does Not Match Documentation

**File:** `TDD/Call TranscriptionRevenue-intelligence-modules-and-feature-mapping.md`  
**Expected (per README and Doc ID):** `tdd-call-transcription.md` or similar clean name  
**Issue:** The actual file name appears to be a concatenation artifact containing `Revenue-intelligence-modules-and-feature-mapping` which is unrelated to the TDD title. The internal document title (Line 1) correctly reads `# Doc #11a — Technical Design Document: Call Transcription`.

**Impact:** Any automated tooling, link references, or manual navigation that uses the file name will fail. The ENV Registry (Section 9) references `docs/modules/m01/tdd-call-transcription.md` which does not exist.

**Fix:** Rename the file to `TDD-Call-Transcription.md` (or the project-standard naming convention), then update all cross-references.

---

### D-06 — 🟠 Related Files Paths in ENV Registry Are Stale

**File:** `M-01 Environment Variables Registry.md` — Section 9 (Lines 289–296)  
**Issue:** All nine related-file paths listed use `docs/modules/m01/` as the root:
```
docs/modules/m01/README.md
docs/modules/m01/tdd-call-transcription.md
...
```
None of these paths exist in the actual workspace. Actual files are:
```
M1 Capture & Transcription/m1-readme.md
M1 Capture & Transcription/TDD/Call TranscriptionRevenue-...md
```

**Impact:** A developer following the ENV Registry's cross-reference section will not find any of the linked files. Dead references in governance documentation erode trust in the entire registry.

**Fix:** Update all paths in Section 9 of the ENV Registry to point to the actual file locations within the `M1 Capture & Transcription/` folder.

---

### D-07 — 🟡 `crm.fields.extracted` Event Missing `occurredAt` in README

**Files:** `m1-readme.md` (Section 6), `TDD/AI Data Extractor.md` (Section 10.2)

| Field | README | AI Data Extractor TDD |
|---|---|---|
| `eventId` | ✅ | ✅ |
| `callId` | ✅ | ✅ |
| `tenantId` | ✅ | ✅ |
| `extractedFields` / extracted fields | ✅ | ✅ |
| `flaggedCount` | ✅ | ✅ |
| `occurredAt` | ❌ Missing | ✅ |

**Fix:** Add `occurredAt` to the README event description for `crm.fields.extracted`.

---

### D-08 — 🟡 Table Name Casing and Schema Prefix Inconsistency

**Files:** `m1-readme.md` (Section 7), all TDD files

| Table Reference | README Style | TDD Style |
|---|---|---|
| Call recordings table | `callrecordings` | `m01.callrecordings` |
| Transcripts table | `transcripts` | `m01.transcripts` |
| Corrections table | `transcriptcorrections` | `m01.transcriptcorrections` |
| Sources table | `ingestionsources` | `m01.ingestionsources` |
| CRM fields table | `crmextractedfields` | `m01.crmextractedfields` |
| Review flag column | `flaggedreview` (README) | `flaggedForReview` (TDD code) |

**Impact:** Engineers using the README as reference will use non-prefixed table names and camelCase vs snake_case column inconsistencies will surface in SQL vs ORM code.

**Fix:** Standardise on `m01.<table>` schema-prefixed names across all documentation. Standardise the column name as `flaggedForReview` (camelCase) in TypeScript/ORM and `flagged_for_review` (snake_case) in raw SQL, and make this explicit.

---

### D-09 — 🟡 Native Connectors Scope Wider Than README Acknowledges

**Files:** `m1-readme.md` (Section 3 — Allowed Integrations), `TDD/Native Connectors.md` (Sections 3.2, 8.2, Appendix A)

**README says:** Allowed external integrations are "Zoom, Microsoft Teams, Google Meet, dialers and telephony tools, plus the internal transcription service and internal AI extraction service."

**Native Connectors TDD defines in scope:**
- Conferencing: Zoom, Teams, Google Meet ✅
- Telephony/dialers ✅
- CRM: Salesforce, HubSpot, Microsoft Dynamics 365 ❌ (not in README)
- Email/Calendar: Gmail, Outlook/Office 365 ❌ (not in README)
- GTM tools ❌ (not in README)

**Impact:** The README boundary definition is materially incomplete. A developer reading only the README would not know CRM, email, or calendar connectors are part of M-01 scope, potentially causing wrong module ownership decisions.

**Fix:** Update README Section 3 (Allowed Integrations) to include the full set of approved external systems as documented in the Native Connectors TDD.

---

### D-10 — 🟡 Folder Path in README Reflects Old Module Name

**File:** `m1-readme.md` — Section 8 (Lines 156–197)  
**Current:** `src/modules/m01-data-ingestion/`  
**Issue:** The suggested folder name `m01-data-ingestion` matches the old module name "M-01 Data Ingestion" (from D-01), not the current module name "M-01 Capture & Transcription".

**Fix:** Update the suggested folder path to `src/modules/m01-capture-transcription/` (or align with the project's actual naming convention, whichever is more appropriate).

---

### D-11 — 🟡 Internal Callback Endpoint Not Documented

**Files:** `TDD/Call TranscriptionRevenue-intelligence-modules-and-feature-mapping.md` (Sections 5.1, 6.4), `m1-readme.md` (Section 5 — APIs), `M-01 Environment Variables Registry.md`

**Issue:** Call Transcription TDD describes a critical flow step: "The transcription service returns transcript payload to the M-01 internal callback endpoint" (Step 12 of happy path). This internal callback endpoint is referenced but:
- It is NOT listed in the README API table
- No dedicated env var (e.g., `TRANSCRIPTION_CALLBACK_PATH`) exists in the ENV Registry
- Sequence Diagram SD-02 shows the worker handling results internally but does not depict a separate callback endpoint

**Impact:** New engineers cannot find the callback endpoint definition. If it is a real HTTP endpoint, it is missing from the API surface documentation.

**Fix:** Either add the internal callback endpoint to the README API table with a note that it is internal-only, or clarify in the TDD that the "callback" is an internal BullMQ queue result (not an HTTP endpoint) to eliminate the ambiguity.

---

### D-12 — 🟢 ENV Registry `Last Updated` is a Placeholder

**File:** `M-01 Environment Variables Registry.md` — Line 14  
**Current:** `Last Updated: YYYY-MM-DD`  
**All TDDs:** Use real dates (`2026-04-29`)

**Fix:** Replace `YYYY-MM-DD` with the actual document creation or last-update date.

---

### D-13 — 🟢 Sequence Diagram Missing Alternate Entry Paths for Extraction

**Files:** `m1-sequence diagram.md` (SD-03), `TDD/AI Data Extractor.md` (Section 4.2–4.3)

**Issue:** SD-03 only shows the happy-path triggered by `call.transcription.completed`. The AI Data Extractor TDD defines three additional trigger conditions:
- Explicit extraction regeneration by user
- BullMQ retry replay
- Backfill job for historic calls

None of these are shown or referenced in SD-03.

**Fix:** Add alternate path notes to SD-03 or create an additional SD-05 diagram showing the regeneration and backfill flows.

---

### D-14 — 🟢 Native Connectors Open Question #5 Conflicts with Current Registry Practice

**File:** `TDD/Native Connectors.md` — Section 15, Question 5  
**Issue:** Open Question #5 asks: "Should connector lifecycle events be formalized in the shared event registry or remain internal-only for now?" — yet the TDD itself (Section 6.3) already defines five connector lifecycle events (`connector.connected`, `connector.connection.failed`, `connector.reauth.required`, `connector.disconnected`, `connector.health.degraded`). Publishing event names in the TDD without a decision on registry formalization means they may already be implemented informally without platform-level governance.

**Fix:** Close Open Question #5 with a clear decision and either register the events formally or explicitly mark them as internal-only with a note in the TDD.

---

## 4. Drift Priority Matrix

| Priority | Count | Action Required |
|---|---|---|
| 🔴 Critical | 2 | Fix before next PR merges to M-01 code |
| 🟠 High | 4 | Fix within current sprint |
| 🟡 Medium | 6 | Fix within this documentation cycle |
| 🟢 Low | 4 | Fix at next documentation review |

---

## 5. Recommended Fix Order

```
1. D-01 — Fix module name in README title (5 min change, high visibility)
2. D-06 — Fix Call Transcription TDD file name (rename + update cross-references)
3. D-07 — Fix ENV Registry related file paths (stale paths → real paths)
4. D-04 — Resolve confidence threshold conflict (needs team decision first)
5. D-09 — Expand README allowed integrations to match Native Connectors TDD
6. D-03 — Standardise API prefix slash style across all files
7. D-02 — Standardise downstream module labels across all files
8. D-10 — Clarify internal callback endpoint documentation
9. D-07 — Add `occurredAt` to README crm.fields.extracted description
10. D-08 — Unify table name casing and schema prefixes
11. D-11 — Fix folder path in README to match current module name
12. D-12 — Replace ENV Registry date placeholder with real date
13. D-13 — Add alternate entry paths to sequence diagram SD-03
14. D-14 — Close Native Connectors Open Question #5
```

---

## 6. Files With No Internal Drift Found

All TDD files (Call Transcription, Native Connectors, AI Data Extractor) are internally consistent within themselves. Their content, structure, section ordering, and narrative are coherent. Drifts are cross-document (between TDDs and the README/ENV Registry/Sequence Diagram), not intra-document.

The Sequence Diagram file is also internally consistent across all four diagrams (SD-01 through SD-04).

---

## 7. Audit Notes

- **Root cause of most drift:** The README appears to have been written with an older module name ("Data Ingestion") and has not been fully updated to reflect the approved "Capture & Transcription" identity. The TDD files are more recent and reflect the current state.
- **ENV Registry file paths** (Section 9) appear to reference a planned monorepo `docs/modules/` structure that was never created.
- **No contradictions were found** in security, HMAC verification, BullMQ usage rules, or tenant isolation rules across any of the six files. These are consistent.
- **Event names** (`call.transcription.completed`, `crm.fields.extracted`) are consistent across all documents.

---

*End of Drift Analysis — M-01 Capture & Transcription*
