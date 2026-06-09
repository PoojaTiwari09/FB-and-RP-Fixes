"""
Pydantic models/schemas for the AI Deep Researcher FastAPI service.
Defines all request/response types for research pipeline.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime


# ============================================================
# Enums
# ============================================================
class JobStatus(str, Enum):
    QUEUED = "QUEUED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class SourceType(str, Enum):
    TRANSCRIPT = "TRANSCRIPT"
    EMAIL = "EMAIL"
    CRM = "CRM"
    WEB = "WEB"


class ContextType(str, Enum):
    CALL = "CALL"
    DEAL = "DEAL"
    ACCOUNT = "ACCOUNT"


# ============================================================
# Citation
# ============================================================
class Citation(BaseModel):
    source_type: SourceType
    source_id: str
    source_ref: Dict[str, Any] = {}
    display_label: str
    source_url: Optional[str] = None
    context_snippet: Optional[str] = None


# ============================================================
# Report Structures
# ============================================================
class ReportBullet(BaseModel):
    bullet_id: str
    text: str
    citations: List[Citation] = []
    confidence: float = 1.0


class ReportSection(BaseModel):
    section_id: str
    title: str
    summary: str = ""
    bullets: List[ReportBullet] = []
    data_sources_used: List[str] = []
    status: str = "COMPLETED"


class ResearchReport(BaseModel):
    report_id: Optional[str] = None
    title: str
    generated_at: Optional[str] = None
    sections: List[ReportSection] = []
    metadata: Dict[str, Any] = {}


# ============================================================
# Sub-Query (for multi-step reasoning)
# ============================================================
class SubQuery(BaseModel):
    id: str
    question: str
    type: str = "retrieval"  # retrieval | pattern | comparison
    depends_on: List[str] = []
    status: str = "PENDING"
    result: Optional[Dict[str, Any]] = None


class DecompositionPlan(BaseModel):
    original_query: str
    sub_queries: List[SubQuery] = []
    parallel_ids: List[str] = []
    sequential_ids: List[str] = []


# ============================================================
# Pattern Detection
# ============================================================
class DetectedPattern(BaseModel):
    pattern_id: str
    label: str
    frequency: int
    frequency_pct: float
    trend: str = "stable"  # increasing | decreasing | stable
    representative_examples: List[Dict[str, Any]] = []
    citations: List[Citation] = []


class PatternDetectionResult(BaseModel):
    patterns: List[DetectedPattern] = []
    total_sources_analyzed: int = 0
    time_range: str = ""


# ============================================================
# Segment Comparison
# ============================================================
class SegmentData(BaseModel):
    label: str
    filter: Dict[str, Any] = {}
    data_count: int = 0
    metrics: Dict[str, Any] = {}


class ComparisonDimension(BaseModel):
    dimension: str
    segments: List[Dict[str, Any]] = []
    insight: str = ""


class SegmentComparisonResult(BaseModel):
    segments: List[SegmentData] = []
    dimensions: List[ComparisonDimension] = []
    summary: str = ""
    data_imbalance_note: Optional[str] = None


# ============================================================
# API Request/Response Models
# ============================================================
class ResearchRequest(BaseModel):
    query: str = Field(..., max_length=1000)
    context_type: str = "ACCOUNT"
    context_id: Optional[str] = None
    scope: str = "ENTIRE_ACCOUNT"
    period_days: int = 60
    filters: Dict[str, Any] = Field(default_factory=lambda: {
        "segment": "Mid-Market",
        "stage": "Discovery",
        "region": "West",
        "team": "West Sales Team"
    })
    org_id: str = "a0000000-0000-0000-0000-000000000001"
    user_id: str = "c0000000-0000-0000-0000-000000000001"
    web_data_enabled: bool = False


class ResearchResponse(BaseModel):
    job_id: str
    status: JobStatus
    report: Optional[ResearchReport] = None
    progress_pct: int = 0
    progress_stage: str = ""
    error: Optional[str] = None


class QueryRequest(BaseModel):
    query: str = Field(..., max_length=500)
    context_type: str = "ACCOUNT"
    context_id: Optional[str] = None
    session_id: Optional[str] = None
    org_id: str = "a0000000-0000-0000-0000-000000000001"
    user_id: str = "c0000000-0000-0000-0000-000000000001"


class QueryResponse(BaseModel):
    answer: str
    citations: List[Citation] = []
    follow_up_questions: List[str] = []
    session_id: str
    can_escalate: bool = True


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "deep-research-ai"
    groq_connected: bool = False
    supabase_connected: bool = False
