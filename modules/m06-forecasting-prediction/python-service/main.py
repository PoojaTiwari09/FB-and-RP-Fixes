from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import numpy as np
import math
from datetime import datetime

app = FastAPI(title="M6 AI Revenue Predictor API")

class PipelineStage(BaseModel):
    stage: str
    amount: float
    closeDate: Optional[str] = None

class ConversionRate(BaseModel):
    fromStage: str
    toStage: str
    rate: float
    sampleSize: int

class PredictRequest(BaseModel):
    tenantId: str
    periodId: str
    openPipeline: List[PipelineStage]
    closedWonAmount: float
    historicalRates: List[ConversionRate]
    historicalExpectedDealRate: float
    totalAddressablePipeline: float

class PredictResponse(BaseModel):
    predictedAmount: float
    confidenceRangeLow: float
    confidenceRangeHigh: float
    modelInputs: Dict[str, Any]

@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    expected_from_pipeline = 0.0
    
    # Feature 8: Low-sample fallback
    tenant_rates = {r.fromStage: r for r in request.historicalRates}
    
    default_rates = {
        "Discovery": 0.20,
        "Proposal": 0.58,
        "Negotiation": 0.74
    }

    fallback_applied = False
    now = datetime.now()
    
    for deal in request.openPipeline:
        stage_rate = default_rates.get(deal.stage, 0.1)
        
        rate_obj = tenant_rates.get(deal.stage)
        if rate_obj:
            if rate_obj.sampleSize >= 50:
                stage_rate = rate_obj.rate
            else:
                fallback_applied = True
                
        # Feature 8: Time decay factor
        time_decay = 1.0
        if deal.closeDate:
            try:
                close_dt = datetime.fromisoformat(deal.closeDate.replace('Z', '+00:00'))
                days_to_close = max(0, (close_dt.replace(tzinfo=None) - now).days)
                # e^(-λt) decay proxy
                if days_to_close >= 90:
                    time_decay = 0.5
                elif days_to_close >= 60:
                    time_decay = 0.65
                elif days_to_close >= 30:
                    time_decay = 0.8
            except ValueError:
                pass

        expected_from_pipeline += deal.amount * stage_rate * time_decay
        
    expected_deals_contrib = request.totalAddressablePipeline * request.historicalExpectedDealRate
    
    predicted_amount = request.closedWonAmount + expected_from_pipeline + expected_deals_contrib
    
    # Feature 8: Confidence range widens if fallback applied
    stddev = 0.20 if fallback_applied else 0.15
    range_low = predicted_amount - (stddev * sum(d.amount for d in request.openPipeline))
    range_high = predicted_amount + (stddev * sum(d.amount for d in request.openPipeline))
    
    return PredictResponse(
        predictedAmount=predicted_amount,
        confidenceRangeLow=range_low,
        confidenceRangeHigh=range_high,
        modelInputs={
            "expectedDealRate": request.historicalExpectedDealRate,
            "pipelineContrib": expected_from_pipeline,
            "expectedDealsContrib": expected_deals_contrib,
            "fallbackApplied": fallback_applied
        }
    )

class ExplainRequest(BaseModel):
    modelInputs: Dict[str, Any]

@app.post("/explain")
def explain(request: ExplainRequest):
    return {
        "summary": "Revenue projection driven by strong late-stage pipeline.",
        "details": request.modelInputs
    }
