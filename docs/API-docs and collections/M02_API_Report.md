# M02 Conversation Intelligence API Report

This document provides a detailed list of all functional endpoints in the M02 module.

## GET Endpoints

| Path | Group | Description |
|---|---|---|
| `/api/v1/conversation-intelligence/dashboard/summary` | **Dashboard** | Get dashboard summary metrics |
| `/api/v1/conversation-intelligence/search/calls` | **Search** | Hybrid search across calls and emails |
| `/api/v1/conversation-intelligence/search/teams` | **Search** | Get list of teams/regions for filtering |
| `/api/v1/conversation-intelligence/search/drawer/:callId` | **Search** | Get context for a call drawer |
| `/api/v1/conversation-intelligence/call-reviews/review-history` | **Call Reviews** | List user review history |
| `/api/v1/conversation-intelligence/call-reviews/summary` | **Call Reviews** | Get review analytics summary |
| `/api/v1/conversation-intelligence/call-reviews/score-trend` | **Call Reviews** | Get historical score trend |
| `/api/v1/conversation-intelligence/call-reviews/focus-areas` | **Call Reviews** | Get top areas requiring focus |
| `/api/v1/conversation-intelligence/call-reviews/common-tags` | **Call Reviews** | Get most common review tags |
| `/api/v1/conversation-intelligence/call-reviews/:reviewId` | **Call Reviews** | Get details of a specific review |
| `/api/v1/conversation-intelligence/call-reviews/:reviewId/form` | **Call Reviews** | Get the scorecard form for a review |
| `/api/v1/conversation-intelligence/call-reviews/:reviewId/transcript` | **Call Reviews** | Get transcript for the reviewed call |
| `/api/v1/conversation-intelligence/call-reviews/:reviewId/ai-insights` | **Call Reviews** | Get AI insights and scorecard recommendations |
| `/api/v1/conversation-intelligence/call-reviews/:reviewId/coaching` | **Call Reviews** | Get coaching suggestions |
| `/api/v1/conversation-intelligence/call-reviews/:reviewId/export` | **Call Reviews** | Export a specific review to PDF |
| `/api/v1/conversation-intelligence/trackers` | **Trackers** | List trackers (paginated UI format) |
| `/api/v1/conversation-intelligence/trackers/admin/list` | **Trackers** | List all trackers (Admin format) |
| `/api/v1/conversation-intelligence/trackers/stats` | **Trackers** | Get total stats for trackers |
| `/api/v1/conversation-intelligence/trackers/detections` | **Trackers** | Get all detections across the tenant |
| `/api/v1/conversation-intelligence/trackers/detections/:entityId` | **Trackers** | Get detections for a specific call/email |
| `/api/v1/conversation-intelligence/trackers/:id` | **Trackers** | Get tracker by ID |
| `/api/v1/conversation-intelligence/trackers/:trackerId/detail` | **Trackers** | Get metrics and top reps for a tracker |
| `/api/v1/m02-conversation-intelligence/theme-analyses/overview` | **Theme Spotter** | Get theme spotter overview metrics |
| `/api/v1/m02-conversation-intelligence/theme-analyses/themes` | **Theme Spotter** | List all active themes |
| `/api/v1/m02-conversation-intelligence/theme-analyses/themes/:id` | **Theme Spotter** | Get details for a specific theme |
| `/api/v1/m02-conversation-intelligence/theme-analyses/themes/:id/trend` | **Theme Spotter** | Get trend data for a theme |
| `/api/v1/m02-conversation-intelligence/theme-analyses/themes/:id/rep-breakdown` | **Theme Spotter** | Get mentions by rep for a theme |
| `/api/v1/m02-conversation-intelligence/theme-analyses/themes/:id/stage-breakdown` | **Theme Spotter** | Get mentions by deal stage |
| `/api/v1/m02-conversation-intelligence/theme-analyses/themes/:id/quotes` | **Theme Spotter** | Get specific customer quotes for a theme |
| `/api/v1/m02-conversation-intelligence/theme-analyses/themes/:id/calls` | **Theme Spotter** | Get calls containing a theme |
| `/api/v1/m02-conversation-intelligence/topics` | **Topics** | Get list of topic models |
| `/api/v1/m02-conversation-intelligence/conversations/:id/topics` | **Tags** | Get tags for a conversation |
| `/api/v1/conversation-intelligence/vocabulary` | **Vocabulary** | Get vocabulary correction rules |
| `/api/v1/conversation-intelligence/vocabulary/stats` | **Vocabulary** | Get correction statistics |
| `/api/v1/m02-conversation-intelligence/translate/settings` | **Translation** | Get translation settings |

## POST Endpoints

| Path | Group | Description |
|---|---|---|
| `/api/v1/auth/login` | **Auth** | Login to retrieve JWT token |
| `/api/v1/conversation-intelligence/search/drawer/:callId/ask` | **Search** | Ask AI a question about a call |
| `/api/v1/conversation-intelligence/search/export` | **Search** | Export search results to CSV |
| `/api/v1/conversation-intelligence/search/streams` | **Search** | Create a saved search stream |
| `/api/v1/conversation-intelligence/call-reviews/:reviewId/submit` | **Call Reviews** | Submit a finalized call review |
| `/api/v1/conversation-intelligence/call-reviews/:reviewId/clone` | **Call Reviews** | Clone a review for a different call |
| `/api/v1/conversation-intelligence/call-reviews/:reviewId/share` | **Call Reviews** | Share a review via email or Slack |
| `/api/v1/conversation-intelligence/trackers` | **Trackers** | Create a new keyword tracker |
| `/api/v1/conversation-intelligence/trackers/:trackerId/ask` | **Trackers** | Ask context questions about a tracker |
| `/api/v1/m02-conversation-intelligence/theme-analyses/export` | **Theme Spotter** | Export themes to CSV |
| `/api/v1/m02-conversation-intelligence/topics` | **Topics** | Create a new topic model |
| `/api/v1/m02-conversation-intelligence/topics/topics` | **Topics** | Add a topic to a model |
| `/api/v1/m02-conversation-intelligence/topics/seed` | **Topics** | Seed default topic models |
| `/api/v1/m02-conversation-intelligence/conversations/:id/topics` | **Tags** | Add manual topic tag |
| `/api/v1/m02-conversation-intelligence/conversations/batch-tag` | **Tags** | Batch tag multiple transcripts |
| `/api/v1/conversation-intelligence/vocabulary` | **Vocabulary** | Create a vocabulary correction rule |
| `/api/v1/m02-conversation-intelligence/translate` | **Translation** | Translate a text segment |
| `/api/v1/m02-conversation-intelligence/translate/settings` | **Translation** | Update translation settings |

## PUT Endpoints

| Path | Group | Description |
|---|---|---|
| `/api/v1/conversation-intelligence/call-reviews/:reviewId/draft` | **Call Reviews** | Save review progress as draft |
| `/api/v1/conversation-intelligence/trackers/:id` | **Trackers** | Update a tracker |

## DELETE Endpoints

| Path | Group | Description |
|---|---|---|
| `/api/v1/conversation-intelligence/trackers/:id` | **Trackers** | Delete a tracker |
| `/api/v1/m02-conversation-intelligence/topics/:id` | **Topics** | Delete a topic model |
| `/api/v1/m02-conversation-intelligence/topics/remove` | **Topics** | Remove a topic |
| `/api/v1/m02-conversation-intelligence/topics/tags/:tagId` | **Tags** | Delete a topic tag |
| `/api/v1/conversation-intelligence/vocabulary/:id` | **Vocabulary** | Delete a vocabulary rule |

