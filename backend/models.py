from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class KAM(Base):
    __tablename__ = "kams"
    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String, nullable=False)
    email         = Column(String, unique=True, nullable=False)
    country       = Column(String, nullable=False)
    password_hash = Column(String, nullable=True)
    companies     = relationship("Company", back_populates="kam")

class Company(Base):
    __tablename__ = "companies"
    id              = Column(Integer, primary_key=True, index=True)
    name            = Column(String, nullable=False)
    industry        = Column(String)
    country         = Column(String)
    assigned_kam_id = Column(Integer, ForeignKey("kams.id"))
    onboarding_date = Column(Date)
    status          = Column(String, default="active")
    notes           = Column(Text, default="")
    credit_limit = Column(Float, nullable=True, default=0.0)

    kam          = relationship("KAM", back_populates="companies")
    operations   = relationship("Operation", back_populates="company")
    interactions = relationship("Interaction", back_populates="company")
    health_score = relationship("HealthScore", back_populates="company", uselist=False)
    notes        = relationship("Note", back_populates="company", order_by="Note.created_at.desc()")

class Operation(Base):
    __tablename__ = "operations"
    id             = Column(Integer, primary_key=True, index=True)
    company_id     = Column(Integer, ForeignKey("companies.id"))
    product_type   = Column(String)
    amount         = Column(Float)
    operation_date = Column(Date)
    due_date       = Column(Date)
    status         = Column(String, default="completed")
    company        = relationship("Company", back_populates="operations")

class Interaction(Base):
    __tablename__ = "interactions"
    id               = Column(Integer, primary_key=True, index=True)
    company_id       = Column(Integer, ForeignKey("companies.id"))
    channel          = Column(String)
    summary          = Column(Text)
    interaction_date = Column(Date)
    company          = relationship("Company", back_populates="interactions")

class HealthScore(Base):
    __tablename__ = "health_scores"
    id                  = Column(Integer, primary_key=True, index=True)
    company_id          = Column(Integer, ForeignKey("companies.id"), unique=True)
    score               = Column(Integer)
    churn_risk          = Column(String)
    summary             = Column(Text)
    recommended_actions = Column(Text)
    confidence          = Column(String, nullable=True)
    data_gaps           = Column(Text, nullable=True)  # JSON string
    generated_at        = Column(DateTime, default=datetime.utcnow)
    company             = relationship("Company", back_populates="health_score")

class Note(Base):
    __tablename__ = "notes"
    id         = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    content    = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    company    = relationship("Company", back_populates="notes")