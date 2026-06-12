# M06 Module Differences Summary

This document outlines the differences between the core centralized version (`ABCD\r-revenue-intelligence-monorepo`) and the modified version (`r-revenue-intelligence-monorepo`).

## 1. Database Changes (`packages/database`)
- **Prisma Schema (`prisma/schema.prisma`)**:
  - Removed the `pgvector` extension from the database connection block.
  - **`ForecastAuditLog`**: Added `status` and `notes` optional string fields.
  - **`CrmDeal`**: Added `aiPredictionScore` optional float field.
- **Seeding (`prisma/seed-all.ts`)**:
  - Removed aggressive cleanup code that deleted tables (`engageTask`, `engageContact`, `tenant`, etc.) before seeding, preventing accidental data wiping.
- **Local Development Additions**:
  - **`schema.local-m06.prisma`**: A new, stripped-down Prisma schema was added specifically for local development without Docker or pgvector, containing only M06 Forecasting & Prediction models and shared Platform Core.
  - **`.env`**: Added a local environment file pointing to local PostgreSQL credentials (`revenue_user`/`m06_pooja`).
  - **`query.sql`**: Added a local scratchpad SQL file for test queries.

## 2. Frontend Web Changes (`apps/web/src/features/forecast-boards`)
- **AI Prediction Score**:
  - Removed hardcoded AI prediction scores (previously set statically to `95`).
  - The UI now dynamically fetches live scores from the `/api/forecast/ai-predictor/scores/{repUserId}` API endpoint.
- **Manager Override & Approval Logic**:
  - Deal calculation logic was updated to account for `approved` or `overridden` states, utilizing manager-approved `approved_best_case` and `approved_commit` amounts instead of defaults.
  - Added `'overridden'` as a valid status in the `SubmissionStatus` type definition.
- **Target Attainment Calculations**:
  - Replaced the basic commit sum with a more accurate `totalLockedCommit` logic for calculating quota attainment percentages.
- **Type & Interface Updates**:
  - Added `submissionDeadline` to the `ForecastPeriod` interface.
  - Expanded `PendingApprovalEntry` to include `requestType`, `dealName`, and `dealId` for better context during deal reviews.

## 3. Backend Module Changes (`modules/m06-forecasting-prediction`)
- **Controllers & Services**:
  - Modified `m06.controller.ts`, `forecast-boards.service.ts`, `forecast-upgrade.service.ts`, and `m06.service.ts`.
  - These updates expose endpoints for dynamic AI predictor scores, calculate team boards based on the new manager override statuses, and correctly interact with the new database fields.
- **Documentation**:
  - Added `API-ENDPOINTS.md` and `API-GAP-ANALYSIS.md` to thoroughly document the current state of the M06 APIs.
- **Testing & Scripts**:
  - Added robust local testing scripts including `simulate-m06-e2e.ts`, `test-db.ts`, and `test-teamboard.ts`.
  - Added Postman collection JSON files to easily test the AI predictor and M06 workflows locally.
