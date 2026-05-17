from fastapi import FastAPI

app = FastAPI(title="R-Revenue Transcription Service")

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/transcribe")
def transcribe():
    return {"transcript": "Mock transcript", "words": [], "confidence": 0.99}
