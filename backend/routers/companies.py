from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, timedelta
from typing import List
import json
import models, schemas
from database import get_db

router = APIRouter(prefix="/companies", tags=["companies"])

@router.get("/kam/{kam_id}", response_model=List[schemas.CompanySummary])
def get_companies_by_kam(kam_id: int, db: Session = Depends(get_db)):
    companies = db.query(models.Company)\
                  .filter(models.Company.assigned_kam_id == kam_id)\
                  .all()

    if not companies:
        raise HTTPException(status_code=404, detail="KAM no encontrado o sin empresas")

    cutoff_30d = date.today() - timedelta(days=30)
    result = []

    for c in companies:
        ops = c.operations
        recent_ops = [o for o in ops if o.operation_date >= cutoff_30d]
        last_op = max((o.operation_date for o in ops), default=None)
        total_30d = sum(o.amount for o in recent_ops)

        hs_out = None
        if c.health_score:
            hs_out = schemas.HealthScoreOut(
                score=c.health_score.score,
                churn_risk=c.health_score.churn_risk,
                summary=c.health_score.summary,
                recommended_actions=json.loads(c.health_score.recommended_actions or "[]"),
                generated_at=c.health_score.generated_at
            )

        result.append(schemas.CompanySummary(
            id=c.id,
            name=c.name,
            industry=c.industry,
            country=c.country,
            status=c.status,
            last_operation_date=last_op,
            total_financed_30d=total_30d,
            operation_count=len(ops),
            health_score=hs_out
        ))

    result.sort(key=lambda x: (
        x.status != "at_risk",
        x.health_score.score if x.health_score else 100
    ))

    return result


@router.get("/{company_id}", response_model=schemas.CompanyDetail)
def get_company_detail(company_id: int, db: Session = Depends(get_db)):
    company = db.query(models.Company)\
                .filter(models.Company.id == company_id)\
                .first()

    if not company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    import json
    hs_out = None
    if company.health_score:
        hs_out = schemas.HealthScoreOut(
            score=company.health_score.score,
            churn_risk=company.health_score.churn_risk,
            summary=company.health_score.summary,
            recommended_actions=json.loads(company.health_score.recommended_actions or "[]"),
            generated_at=company.health_score.generated_at
        )

    # Notas ordenadas de más reciente a más antigua
    notes_out = [
        schemas.NoteOut(
            id=n.id,
            content=n.content,
            created_at=n.created_at,
            updated_at=n.updated_at
        )
        for n in sorted(company.notes, key=lambda x: x.created_at, reverse=True)
    ]

    interactions_out = [
        schemas.InteractionOut(
            id=i.id,
            channel=i.channel,
            summary=i.summary,
            interaction_date=i.interaction_date
        )
        for i in sorted(company.interactions, key=lambda x: x.interaction_date, reverse=True)
    ]

    return schemas.CompanyDetail(
        id=company.id,
        name=company.name,
        industry=company.industry,
        country=company.country,
        status=company.status,
        onboarding_date=company.onboarding_date,
        notes=notes_out,
        operations=[schemas.OperationOut.model_validate(o) for o in company.operations],
        interactions=interactions_out,
        health_score=hs_out
    )


@router.patch("/{company_id}", response_model=schemas.CompanyDetail)
def update_company(company_id: int, update: schemas.CompanyUpdate, db: Session = Depends(get_db)):
    company = db.query(models.Company)\
                .filter(models.Company.id == company_id)\
                .first()

    if not company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    if update.notes is not None:
        company.notes = update.notes
    if update.status is not None:
        company.status = update.status

    db.commit()
    db.refresh(company)
    return get_company_detail(company_id, db)