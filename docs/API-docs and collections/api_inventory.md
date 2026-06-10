# API Inventory & Audit Report

> **Audit Target**: Complete codebase REST controllers and routers.

## API Landscape Metrics Summary

- **Total Discovered APIs**: 496
- **Authenticated Endpoints (Requires Supabase JWT)**: 455
- **Public Endpoints (Authentication Bypass)**: 41
- **Protocol Classification**: REST (496), SOAP (0), GraphQL (0), WebSockets (0)

### Module-Wise API Counts

| Module Name | Total APIs | Authenticated | Public |
| --- | --- | --- | --- |
| AI Extractor | 3 | 0 | 3 |
| Admin | 20 | 15 | 5 |
| Authentication | 8 | 7 | 1 |
| CRM | 38 | 37 | 1 |
| Capture Transcription | 9 | 8 | 1 |
| Forecasting | 86 | 84 | 2 |
| Next Steps | 1 | 1 | 0 |
| Notes | 7 | 7 | 0 |
| Notifications | 12 | 12 | 0 |
| Other Discovered Modules | 184 | 168 | 16 |
| Revenue Intelligence | 97 | 95 | 2 |
| Search | 17 | 10 | 7 |
| Sharing | 4 | 1 | 3 |
| User Management | 10 | 10 | 0 |

## Quality Control & Compliance Gaps

- **Swagger Annotations Coverage (NestJS)**: 20.1% (94 of 467 controller methods decorated)
- **Zod Payload Validation Coverage (NestJS)**: 28.5% (133 of 467 payload schemas validation mapped)

### Sample of Controllers Missing Swagger Documentation

| Controller Name | File Path | Endpoint |
| --- | --- | --- |
| M01FrontendAiReviewerDetailController | [m01-frontend-ai-reviewer.controller.ts](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m01-capture-transcription/controllers/m01-frontend-ai-reviewer.controller.ts) | `GET /api/v1/capture-transcription/calls/:callId/ai-insights` |
| M01FrontendAiReviewerDetailController | [m01-frontend-ai-reviewer.controller.ts](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m01-capture-transcription/controllers/m01-frontend-ai-reviewer.controller.ts) | `GET /api/v1/capture-transcription/calls/:callId/audio-url` |
| M01FrontendAiReviewerDetailController | [m01-frontend-ai-reviewer.controller.ts](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m01-capture-transcription/controllers/m01-frontend-ai-reviewer.controller.ts) | `GET /api/v1/capture-transcription/calls/:callId/review` |
| M01FrontendAiReviewerDetailController | [m01-frontend-ai-reviewer.controller.ts](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m01-capture-transcription/controllers/m01-frontend-ai-reviewer.controller.ts) | `GET /api/v1/capture-transcription/calls/:callId/feedback` |
| M01FrontendAiReviewerDetailController | [m01-frontend-ai-reviewer.controller.ts](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m01-capture-transcription/controllers/m01-frontend-ai-reviewer.controller.ts) | `GET /api/v1/capture-transcription/calls/:callId/transcript-entries` |
| M01FrontendCallDetailController | [m01-frontend-call-detail.controller.ts](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m01-capture-transcription/controllers/m01-frontend-call-detail.controller.ts) | `GET /api/v1/capture-transcription/calls/:callId/notes` |
| M01FrontendCallDetailController | [m01-frontend-call-detail.controller.ts](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m01-capture-transcription/controllers/m01-frontend-call-detail.controller.ts) | `POST /api/v1/capture-transcription/calls/:callId/notes` |
| M01FrontendUploadController | [m01-frontend-upload.controller.ts](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m01-capture-transcription/controllers/m01-frontend-upload.controller.ts) | `POST /api/v1/capture-transcription/calls/upload` |
| UploadController | [upload.controller.ts](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m01-capture-transcription/controllers/upload.controller.ts) | `POST /api/v1/capture-transcription/calls/upload` |
| WebhookController | [webhook.controller.ts](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m01-capture-transcription/controllers/webhook.controller.ts) | `POST /api/v1/webhooks/zoom` |

### Sample of Controllers Missing Zod Validation

| Controller Name | File Path | Endpoint |
| --- | --- | --- |
| M01FrontendAiReviewerDetailController | [m01-frontend-ai-reviewer.controller.ts](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m01-capture-transcription/controllers/m01-frontend-ai-reviewer.controller.ts) | `GET /api/v1/capture-transcription/calls/:callId/ai-insights` |
| M01FrontendAiReviewerDetailController | [m01-frontend-ai-reviewer.controller.ts](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m01-capture-transcription/controllers/m01-frontend-ai-reviewer.controller.ts) | `GET /api/v1/capture-transcription/calls/:callId/audio-url` |
| M01FrontendAiReviewerDetailController | [m01-frontend-ai-reviewer.controller.ts](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m01-capture-transcription/controllers/m01-frontend-ai-reviewer.controller.ts) | `GET /api/v1/capture-transcription/calls/:callId/review` |
| M01FrontendAiReviewerDetailController | [m01-frontend-ai-reviewer.controller.ts](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m01-capture-transcription/controllers/m01-frontend-ai-reviewer.controller.ts) | `GET /api/v1/capture-transcription/calls/:callId/feedback` |
| M01FrontendAiReviewerDetailController | [m01-frontend-ai-reviewer.controller.ts](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m01-capture-transcription/controllers/m01-frontend-ai-reviewer.controller.ts) | `GET /api/v1/capture-transcription/calls/:callId/transcript-entries` |
| M01FrontendCallDetailController | [m01-frontend-call-detail.controller.ts](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m01-capture-transcription/controllers/m01-frontend-call-detail.controller.ts) | `GET /api/v1/capture-transcription/calls/:callId/notes` |
| M01FrontendCallDetailController | [m01-frontend-call-detail.controller.ts](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m01-capture-transcription/controllers/m01-frontend-call-detail.controller.ts) | `POST /api/v1/capture-transcription/calls/:callId/notes` |
| M01FrontendUploadController | [m01-frontend-upload.controller.ts](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m01-capture-transcription/controllers/m01-frontend-upload.controller.ts) | `POST /api/v1/capture-transcription/calls/upload` |
| UploadController | [upload.controller.ts](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m01-capture-transcription/controllers/upload.controller.ts) | `POST /api/v1/capture-transcription/calls/upload` |
| WebhookController | [webhook.controller.ts](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m01-capture-transcription/controllers/webhook.controller.ts) | `POST /api/v1/webhooks/zoom` |

## Platform API Design Gaps & Inconsistencies

Through scanning the entire landscape against the standard in [API Design Standards.md](file:///c:/Users/Relanto/Desktop/RevenueIntellegence/docs/reference/Detialled%20product%20level%20docs/markdown%20documents/API%20Design%20Standards.md), the following key discrepancies were observed:

1. **Varying Base Routes**: Modules like M04 Deal Intelligence declare routes starting directly from `/deals` or `/activities` instead of the canonical `/api/v1/deal-management` prefix defined under Namespace Standards. This violates the singular base path rules.
2. **Bypass Header Security Risk**: The development-mode bypass of JWT validation using the `x-tenant-id` header in `JwtAuthGuard` is globally active. Ensure this bypass is strictly deactivated in staging/production environments.
3. **Missing Uniform Swagger Metadata**: Swagger documentation decorators (like `@ApiTags` and `@ApiOperation`) are sparse in M01 Capture Transcription and M02 Conversation Intelligence, making automatic documentation generation incomplete.
4. **Schema Enforcement Gaps**: Certain controller methods parse query parameters directly as generic `Record<string, string>` instead of mapping query parameters into strict validation schemas (Zod). This poses safety risks for query parameter SQL injection or bad inputs.

## Recommended Improvements

- **Recommendation 1**: Re-route M04 controllers to align paths under the `/api/v1/deal-management` prefix.
- **Recommendation 2**: Apply `@RequirePermissions` check guards to all write/mutation endpoints (`POST`, `PUT`, `DELETE`) across modules to complete the RBAC system integration.
- **Recommendation 3**: Standardize all controllers to run `.parse()` on both incoming query parameters and payload bodies using Zod schemas.
- **Recommendation 4**: Setup automated pre-commit hooks that check controller files for Swagger annotations coverage before code is allowed to be merged.