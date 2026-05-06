# ADR-002: Platform Notification Service Abstraction

## Status
Pending

## Context
The M-08 Execution and Automation module includes alerting and notification features (e.g., Slack alerts for competitor mentions). Currently, the Environment Variables Registry for M8 includes direct Slack API tokens (`SLACK_BOT_TOKEN`, `M08_SLACK_DEFAULT_CHANNEL`). Allowing individual modules like M-08 to integrate directly with external notification transports like Slack creates tight coupling and architectural tech debt.

## Decision
We will define a centralized Platform Notification Service abstraction. M-08 (and other modules) will publish standard notification intent events (e.g., `notification.alert.requested`). A dedicated platform-level Notification Service will consume these events and handle the transport-specific logic (Slack API, email, in-app WebSocket, etc.). 

## Consequences
- M-08 will not interact with the Slack API directly.
- The `SLACK_BOT_TOKEN` and Slack-specific environment variables will be migrated to the Platform Notification Service registry.
- Modules must rely on the standardized notification event schema.
