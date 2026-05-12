from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class OperationOut(BaseModel):
    id: int
    product_type: str
    amount: float
    operation_date: date
    status: str

    class Config:
        from_attributes = True

class HealthScoreOut(BaseModel):
    score: int
    churn_risk: str
    summary: str
    recommended_actions: List[str]
    generated_at: datetime
    confidence: Optional[str] = None
    data_gaps: Optional[List[str]] = None

    class Config:
        from_attributes = True

class CompanySummary(BaseModel):
    id: int
    name: str
    industry: str
    country: str
    status: str
    last_operation_date: Optional[date]
    total_financed_30d: float
    operation_count: int
    health_score: Optional[HealthScoreOut]
    credit_limit: float
    credit_utilized: float       # calculado en el endpoint
    credit_utilization_rate: float  # calculado en el endpoint

    class Config:
        from_attributes = True

class CompanyUpdate(BaseModel):
    notes: Optional[str] = None
    status: Optional[str] = None

class NoteOut(BaseModel):
    id: int
    content: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class NoteCreate(BaseModel):
    content: str

class NoteUpdate(BaseModel):
    content: str

class InteractionOut(BaseModel):
    id: int
    channel: str
    summary: str
    interaction_date: date

    class Config:
        from_attributes = True

class CompanyDetail(BaseModel):
    id: int
    name: str
    industry: str
    country: str
    status: str
    onboarding_date: Optional[date]
    notes: List[NoteOut]
    operations: List[OperationOut]
    interactions: List[InteractionOut]
    health_score: Optional[HealthScoreOut]
    credit_limit: float
    credit_utilized: float       # calculado en el endpoint
    credit_utilization_rate: float  # calculado en el endpoint

    class Config:
        from_attributes = True