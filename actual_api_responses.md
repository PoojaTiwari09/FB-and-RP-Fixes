# AI Revenue Predictor - API Responses Comparison (Cleaned)

This document maps out the backend responses against the **final updated actual responses needed** by the frontend client of the AI Revenue Predictor module. 

All static UI styling values (like `avatarColor` and `repInitials` which can be computed locally by the client) and unused fields (such as `tenantId`, `timeDecay`, `contributionFactor`, and nested `region` fields not rendered in the UI) have been removed.

---

### 1. GET `/api/v1/forecasting/team/board`

**Purpose:** Fetches team-wide forecast totals, baseline calculations, and the list of representatives.

#### Forecasting MD / Postman Response
```json
{
    "statusCode": 500,
    "message": "Internal server error"
}
```
*(Or the raw backend contract structure)*:
```json
{
  "periodId": "period-q2-2026",
  "periodName": "Q2 FY2026",
  "revenueTarget": 2500000,
  "teamSummary": {
    "totalPipeline": 3200000,
    "totalCommit": 1850000,
    "totalBestCase": 2200000,
    "aiPrediction": 2050000
  },
  "reps": [
    {
      "repId": "rep-001",
      "repName": "Sarah Chen",
      "quota": 500000,
      "pipeline": 680000,
      "commit": 320000,
      "submissionStatus": "approved",
      "attainment": 0.64
    }
  ]
}
```

#### Final Updated Actual Response Needed by Frontend
```json
{
  "success": true,
  "data": {
    "teamName": "Americas Team",
    "quarter": "Q2 FY26",
    "aiProjection": 39403691,
    "lastUpdated": "Updated today · 11:36 AM",
    "manualForecast": 38250000,
    "rangeMin": 35949651,
    "rangeMax": 42857731,
    "closesOn": "2026-06-30T23:59:59.000Z",
    "closedWon": 37400000,
    "weightedPipeline": 14110000,
    "expectedDeals": 15700000,
    "activeDeals": [
      {
        "id": "deal-001",
        "name": "Wipro Pilot",
        "stage": "Discovery",
        "amount": 5000000,
        "aiConfidence": "Medium",
        "expectedClose": "Jun 5",
        "factor": 19,
        "contribution": 950000,
        "lob": "Enterprise Software"
      }
    ],
    "mathData": {
      "closedWon": {
        "total": 37400000,
        "deals": [
          { "name": "Pinnacle Corp - Renewal", "amount": 18400000 },
          { "name": "Apex Solutions", "amount": 9700000 }
        ]
      },
      "weightedPipeline": {
        "total": 14110000,
        "stages": [
          { "name": "Discovery", "pipeline": 5000000, "conv": 19, "contribution": 950000 },
          { "name": "Negotiation", "pipeline": 12000000, "conv": 72, "contribution": 8640000 }
        ]
      },
      "expectedDeals": {
        "total": 15700000,
        "historicalRate": 12.4,
        "addressablePipeline": 126600000
      },
      "formula": "Expected Revenue = Closed-won + Σ(Pipeline_s × C_s) + (Rate × Addressable Pipeline)"
    },
    "reps": [
      {
        "id": "00000000-0000-0000-0000-000000000003",
        "repName": "Sarah Chen",
        "aiPrediction": 485000,
        "managerOverride": null,
        "confidenceLevel": "High",
        "lastUpdated": "2 hours ago"
      }
    ]
  }
}
```

---

### 2. GET `/api/v1/forecasting/periods/{{periodId}}/board`

**Purpose:** Fetches summary rollups and status details for a specific forecast period.

#### Forecasting MD / Postman Response
```json
{
    "statusCode": 500,
    "message": "Internal server error"
}
```
*(Or the raw backend contract structure)*:
```json
{
  "periodId": "period-q2-2026",
  "periodName": "Q2 FY2026",
  "revenueTarget": 2500000,
  "summary": {
    "pipeline": 3200000,
    "commit": 1850000,
    "bestCase": 2200000,
    "aiPrediction": 2050000,
    "attainment": 0.82
  },
  "reps": [
    {
      "repId": "rep-001",
      "repName": "Sarah Chen",
      "quota": 500000,
      "pipeline": 680000,
      "commit": 320000,
      "bestCase": 450000,
      "aiScore": 76,
      "submissionStatus": "approved"
    }
  ]
}
```

#### Final Updated Actual Response Needed by Frontend
```json
{
  "success": true,
  "data": {
    "period": {
      "id": "00000000-0000-0000-0000-0000000000b2",
      "name": "Q2 FY26",
      "revenueTarget": 150000000,
      "isLocked": false,
      "status": "open"
    },
    "summary": {
      "pipeline": 32000000,
      "commit": 18500000,
      "bestCase": 22000000,
      "aiPrediction": 20500000,
      "attainment": 0.82
    },
    "reps": [
      {
        "repId": "00000000-0000-0000-0000-000000000003",
        "repName": "Sarah Chen",
        "quota": 5000000,
        "pipeline": 6800000,
        "commit": 3200000,
        "bestCase": 4500000,
        "aiScore": 76,
        "submissionStatus": "approved"
      }
    ]
  }
}
```

---

### 3. GET `/api/v1/forecasting/periods/{{periodId}}/ai-prediction`

**Purpose:** Fetches the AI predictions, ranges, baseline values, and deep explainability matrices (deals and stages summaries).

#### Forecasting MD / Postman Response
```json
{
    "success": true,
    "data": {
        "periodId": "00000000-0000-0000-0000-0000000000b2",
        "tenantId": "00000000-0000-0000-0000-000000000001",
        "period": {
            "id": "00000000-0000-0000-0000-0000000000b2",
            "tenantid": "00000000-0000-0000-0000-000000000001",
            "name": "Q2 FY26",
            "startDate": "2026-04-01T00:00:00.000Z",
            "endDate": "2026-06-30T23:59:59.000Z",
            "revenueTarget": 150000000,
            "status": "open",
            "isLocked": false,
            "submissionDeadline": null,
            "createdAt": "2026-06-11T10:17:18.155Z",
            "updatedAt": "2026-06-11T10:17:18.155Z"
        },
        "aiPrediction": {
            "predictedAmount": 39403691,
            "confidenceRangeLow": 35949651,
            "confidenceRangeHigh": 42857731,
            "computedAt": "2026-06-11T10:17:18.195Z",
            "baseline": "avg_last_2",
            "baselineNote": "Baseline: average of last 2 periods (Q1 FY26, Q4 FY25)",
            "region": "Americas",
            "explainability": {
                "deals": [
                    {
                        "deal": "Wipro Pilot",
                        "stage": "Discovery",
                        "amount": 5000000,
                        "aiConf": "Med",
                        "close": "Jun 5",
                        "closeDate": "2026-06-05T00:00:00.000Z",
                        "stageRate": 0.19,
                        "timeDecay": 1,
                        "contributionFactor": 0.19,
                        "contribution": 950000,
                        "region": "Americas",
                        "lob": null
                    }
                ],
                "expectedDeals": {
                    "rate": 0.124,
                    "contribution": 15700000,
                    "addressablePipeline": 126600000
                },
                "pipelineByStage": [
                    {
                        "stage": "Discovery",
                        "pipeline": 5000000,
                        "contribution": 950000,
                        "convRate": 0.19
                    }
                ],
                "closedWonDetails": {
                    "total": 37400000,
                    "deals": [
                        {
                            "name": "Pinnacle Corp - Renewal",
                            "amount": 18400000,
                            "region": "Americas"
                        }
                    ]
                }
            }
        }
    }
}
```

#### Final Updated Actual Response Needed by Frontend
```json
{
  "success": true,
  "data": {
    "period": {
      "id": "00000000-0000-0000-0000-0000000000b2",
      "name": "Q2 FY26",
      "startDate": "2026-04-01T00:00:00.000Z",
      "endDate": "2026-06-30T23:59:59.000Z",
      "revenueTarget": 150000000,
      "status": "open",
      "isLocked": false
    },
    "aiPrediction": {
      "predictedAmount": 39403691,
      "confidenceRangeLow": 35949651,
      "confidenceRangeHigh": 42857731,
      "computedAt": "2026-06-11T10:17:18.195Z",
      "baseline": "avg_last_2",
      "baselineNote": "Baseline: average of last 2 periods (Q1 FY26, Q4 FY25)",
      "region": "Americas",
      "explainability": {
        "deals": [
          {
            "deal": "Wipro Pilot",
            "stage": "Discovery",
            "amount": 5000000,
            "aiConf": "Med",
            "close": "Jun 5",
            "stageRate": 0.19,
            "contribution": 950000,
            "lob": "Enterprise Software"
          }
        ],
        "expectedDeals": {
          "rate": 0.124,
          "contribution": 15700000,
          "addressablePipeline": 126600000
        },
        "pipelineByStage": [
          {
            "stage": "Discovery",
            "pipeline": 5000000,
            "contribution": 950000,
            "convRate": 0.19
          }
        ],
        "closedWonDetails": {
          "total": 37400000,
          "deals": [
            {
              "name": "Pinnacle Corp - Renewal",
              "amount": 18400000
            }
          ]
        }
      }
    }
  }
}
```

---

### 4. GET `/api/v1/forecasting/team/reps/{{repId}}`

**Purpose:** Fetches calculations details model for a specific representative review view.

#### Forecasting MD / Postman Response
```json
{
    "success": false,
    "error": {
        "code": "UNAUTHORIZED",
        "message": "Unauthorized",
        "details": {
            "message": "Unauthorized",
            "statusCode": 401
        }
    }
}
```

#### Final Updated Actual Response Needed by Frontend
```json
{
  "success": true,
  "data": {
    "repId": "00000000-0000-0000-0000-000000000003",
    "repName": "Sarah Chen",
    "quarter": "Q2 FY26",
    "aiProjection": 39403691,
    "lastUpdated": "Updated today · 11:36 AM",
    "rangeMin": 35949651,
    "rangeMax": 42857731,
    "closesOn": "2026-06-30T23:59:59.000Z",
    "closedWon": 37400000,
    "weightedPipeline": 14110000,
    "expectedDeals": 15700000,
    "activeDeals": [
      {
        "id": "deal-001",
        "name": "Wipro Pilot",
        "stage": "Discovery",
        "amount": 5000000,
        "aiConfidence": "Medium",
        "expectedClose": "Jun 5",
        "factor": 19,
        "contribution": 950000,
        "lob": "Enterprise Software"
      }
    ],
    "mathData": {
      "closedWon": {
        "total": 37400000,
        "deals": [
          { "name": "Pinnacle Corp - Renewal", "amount": 18400000 }
        ]
      },
      "weightedPipeline": {
        "total": 14110000,
        "stages": [
          { "name": "Discovery", "pipeline": 5000000, "conv": 19, "contribution": 950000 }
        ]
      },
      "expectedDeals": {
        "total": 15700000,
        "historicalRate": 12.4,
        "addressablePipeline": 126600000
      },
      "formula": "Expected Revenue = Closed-won + Σ(Pipeline_s × C_s) + (Rate × Addressable Pipeline)"
    }
  }
}
```

---

### 5. GET `/api/v1/forecasting/periods/{{periodId}}/math`

**Purpose:** Verifies and retrieves AI explainability calculations for the entire forecast period.

#### Forecasting MD / Postman Response
```json
{
    "success": false,
    "error": {
        "code": "UNAUTHORIZED",
        "message": "Unauthorized",
        "details": {
            "message": "Unauthorized",
            "statusCode": 401
        }
    }
}
```

#### Final Updated Actual Response Needed by Frontend
```json
{
  "success": true,
  "data": {
    "aiPrediction": 39403691,
    "math": {
      "closedWon": {
        "total": 37400000,
        "deals": [
          { "name": "Pinnacle Corp - Renewal", "amount": 18400000 },
          { "name": "Apex Solutions", "amount": 9700000 }
        ]
      },
      "weightedPipeline": {
        "total": 14110000,
        "stages": [
          { "name": "Discovery", "pipeline": 5000000, "conv": 19, "contribution": 950000 },
          { "name": "Negotiation", "pipeline": 12000000, "conv": 72, "contribution": 8640000 }
        ]
      },
      "expectedDeals": {
        "total": 15700000,
        "historicalRate": 12.4,
        "addressablePipeline": 126600000
      },
      "formula": "Expected Revenue = Closed-won + Σ(Pipeline_s × C_s) + (Rate × Addressable Pipeline)"
    }
  }
}
```
