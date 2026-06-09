# Changelog

All notable changes to the `m09-coaching-training` module will be documented in this file.

## [1.0.0] - 2026-05-20
### Added
- Initial migration of the coaching & training backend features from the SalesAI POC.
- Re-structured code using the MPC (Module-Provider-Controller) architecture pattern.
- Extracted LlmService for Groq and ElevenLabs integrations.
- Implemented repositories for clean separation of database access.
- Scoped to exactly the 23 requested Sales Coaching Insights & AI Trainer features.
- Implemented role-based access controls and tenant isolation.
- Consolidated all controllers, services, repositories, and workers into singular files (`m09.controller.ts`, `m09.service.ts`, `m09.repository.ts`, `m09.worker.ts`).
- Created a standalone entrypoint (`main.ts`) bootstrapping the service independently.
- Configured PostgreSQL connectivity using Prisma Client.
- Re-established structural folder layouts with `.gitkeep` files matching design parameters.

## [1.1.0] - 2026-05-21
### Added
- Real-time **Live Coaching Tips** powered by `llama-3.1-8b-instant` generated in parallel with speech generation.
- **Call Transcript Analyzer** with raw Whisper speech-to-text transcription and structured dialogue diarization powered by `llama-3.3-70b-versatile`.
- Automated zero-cost `SchedulerService` running twice daily (12h interval) checking for active overdue assignments.
- Added new `findOverdueAssignments()` DB repository method to scan overdue assignments using Prisma.
- Unified frontend-compatible alias routes in the controller.

### Changed
- Transitioned DB fully to **Supabase** via PostgreSQL connection string in `.env`.

### Removed
- Completely removed `EmailService` and Gmail integrations to prevent SMTP credentials dependencies.
- Replaced email alert with a high-visibility structured logging mechanism.
