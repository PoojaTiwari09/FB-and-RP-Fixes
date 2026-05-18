from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="R-Revenue AI Services")

@app.get("/health")
def health():
    return {"status": "healthy"}

class ProcessRequest(BaseModel):
    text: str
    tenantId: str

@app.post("/v1/summarize")
def summarize(req: ProcessRequest):
    return {"summary": f"Mock summary of {len(req.text)} chars", "confidence": 0.98}

@app.post("/v1/score-call")
def score_call(req: ProcessRequest):
    return {"score": 85, "metrics": {"objections_handled": True}}

@app.post("/v1/transcribe")
def transcribe():
    return {"transcript": "Mock transcript", "words": [], "confidence": 0.99}

@app.post("/transcribe")
def transcribe_legacy():
    return {"transcript": "Mock transcript", "words": [], "confidence": 0.99}
