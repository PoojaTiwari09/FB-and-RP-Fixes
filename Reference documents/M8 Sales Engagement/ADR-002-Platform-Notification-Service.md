# Architectural Decision Record — ADR-002-M8: Centralized Platform Notification Service Abstraction

## 1. Document Control

- **ADR Identifier:** ADR-002-M8
- **Document Title:** Centralized Platform Notification Service Abstraction
- **Module Name:** M8 Sales Engagement
- **Owner:** Platform Architecture Lead
- **Status:** Approved
- **Version:** v3.0
- **Last Updated:** 2026-05-18

---

## 2. Context

The legacy `M-08 Execution and Automation` module owned alerting and notification features, such as competitor mention alerts or stage-based process updates. In the initial draft spec, the system integrated directly with Slack by storing Slack-specific tokens (`SLACK_BOT_TOKEN`, `M08_SLACK_DEFAULT_CHANNEL`) inside the M8 environment configurations.

This design was highly problematic:
- It tightly coupled M8 with a specific external message transport (Slack).
- It presented security risks by dispersing Slack OAuth tokens across multiple product databases and runtime pods.
- It created significant architectural tech debt, preventing other platform modules from reusing the same Slack integrations.

---

## 3. Decision

To enforce strict separation of concerns, improve system maintainability, and isolate credentials:
We have **formally approved the Platform Notification Service Abstraction**. 

Under this model:
1. **Zero Direct Integrations:** The M8 Sales Engagement module (`modules/m08-sales-engagement/`) does **not** communicate with Slack, Teams, or external messaging transports directly, nor does it store Slack API tokens.
2. **Event-Driven Decoupling:** All automation workflows or play steps inside M8 that require an outbound notification alert must publish a standardized **`notification.alert.requested`** event to the platform event bus.
3. **Dedicated Notification Service:** A dedicated platform-level Notification Service consumes the `notification.alert.requested` event, resolves destination configurations (in-app, Slack channel, email), and dispatches the alert using tokens managed securely inside its own isolated database.

---

## 4. Consequences

- **Secure Token Management:** All external credentials and keys are moved out of M8's registry and consolidated under the Platform Notification Service's Doppler secrets environment.
- **Uniform Notification Schemas:** M8 developers build notification actions by satisfying a simple, standard event envelope:
  ```json
  {
    "eventId": "uuid",
    "tenantId": "uuid",
    "userId": "uuid",
    "channel": "slack | teams | email",
    "template": "competitor_alert",
    "context": {
      "dealId": "uuid",
      "message": "Outreach required: Competitor mentioned in recent meeting."
    }
  }
  ```
- **Horizontal Reusability:** Any other product module (e.g. M4 Deal Intelligence, M6 Forecasting) can now trigger the exact same Slack alert flows by emitting the same standardized event without duplicating integration logic.
