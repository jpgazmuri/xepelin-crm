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

        # hs_out = None
        # if c.health_score:
        #     hs_out = schemas.HealthScoreOut(
        #         score=c.health_score.score,
        #         churn_risk=c.health_score.churn_risk,
        #         summary=c.health_score.summary,
        #         recommended_actions=json.loads(c.health_score.recommended_actions or "[]"),
        #         generated_at=c.health_score.generated_at
        #     )

        hs_out = None
        if c.health_score:
            hs_out = schemas.HealthScoreOut(
                score=c.health_score.score,
                churn_risk=c.health_score.churn_risk,
                summary=c.health_score.summary,
                recommended_actions=json.loads(c.health_score.recommended_actions or "[]"),
                confidence=c.health_score.confidence,
                data_gaps=json.loads(c.health_score.data_gaps) if c.health_score.data_gaps else [],
                generated_at=c.health_score.generated_at
            )
        
        # credit_utilized = sum(
        #     o.amount for o in ops
        #     if o.status in ["completed", "pending"]
        #     and (date.today() - o.operation_date).days <= 90
        # )
        # utilization_rate = round(credit_utilized / c.credit_limit, 3) if c.credit_limit else 0.0

        # Operaciones vigentes = completadas cuyo due_date aún no ha pasado
        credit_utilized = sum(
            o.amount for o in ops
            if o.status in ["completed", "pending"]
            and o.due_date >= date.today()
        )
        utilization_rate = round(credit_utilized / c.credit_limit, 3) if c.credit_limit > 0 else 0.0

        result.append(schemas.CompanySummary(
            id=c.id,
            name=c.name,
            industry=c.industry,
            country=c.country,
            status=c.status,
            last_operation_date=last_op,
            total_financed_30d=total_30d,
            operation_count=len(ops),
            health_score=hs_out,
            credit_limit=c.credit_limit or 0.0,
            credit_utilized=credit_utilized,
            credit_utilization_rate=utilization_rate,
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
    
    # hs_out = None
    # if company.health_score:
    #     hs_out = schemas.HealthScoreOut(
    #         score=company.health_score.score,
    #         churn_risk=company.health_score.churn_risk,
    #         summary=company.health_score.summary,
    #         recommended_actions=json.loads(company.health_score.recommended_actions or "[]"),
    #         generated_at=company.health_score.generated_at
    #     )
    
    hs_out = None
    if company.health_score:
        hs_out = schemas.HealthScoreOut(
            score=company.health_score.score,
            churn_risk=company.health_score.churn_risk,
            summary=company.health_score.summary,
            recommended_actions=json.loads(company.health_score.recommended_actions or "[]"),
            confidence=company.health_score.confidence,
            data_gaps=json.loads(company.health_score.data_gaps) if company.health_score.data_gaps else [],
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

    ops = company.operations
    # credit_utilized = sum(
    #     o.amount for o in ops
    #     if o.status in ["completed", "pending"]
    #     and (date.today() - o.operation_date).days <= 90
    # )
    # utilization_rate = round(credit_utilized / company.credit_limit, 3) if company.credit_limit else 0.0

    # Operaciones vigentes = completadas cuyo due_date aún no ha pasado
    credit_utilized = sum(
        o.amount for o in ops
        if o.status in ["completed", "pending"]
        and o.due_date >= date.today()
    )
    utilization_rate = round(credit_utilized / company.credit_limit, 3) if company.credit_limit > 0 else 0.0


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
        health_score=hs_out,
        credit_limit=company.credit_limit or 0.0,
        credit_utilized=credit_utilized,
        credit_utilization_rate=utilization_rate,
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

@router.get("/kam/{kam_id}/summary")
def get_kam_summary(kam_id: int, db: Session = Depends(get_db)):
    """Resumen agregado de la cartera de un KAM."""
    companies = db.query(models.Company)\
                  .filter(models.Company.assigned_kam_id == kam_id)\
                  .all()

    if not companies:
        raise HTTPException(status_code=404, detail="KAM no encontrado")

    today = date.today()
    cutoff_30d = today - timedelta(days=30)
    cutoff_90d = today - timedelta(days=90)

    total     = len(companies)
    active    = len([c for c in companies if c.status == "active"])
    at_risk   = len([c for c in companies if c.status == "at_risk"])
    churned   = len([c for c in companies if c.status == "churned"])

    all_ops = [op for c in companies for op in c.operations]

    # Volumen
    vol_30d   = sum(o.amount for o in all_ops if o.operation_date >= cutoff_30d)
    vol_90d   = sum(o.amount for o in all_ops if o.operation_date >= cutoff_90d)
    vol_total = sum(o.amount for o in all_ops)

    # Mora
    overdue_ops   = [o for o in all_ops if o.status == "overdue"]
    mora_rate     = round(len(overdue_ops) / len(all_ops), 3) if all_ops else 0.0
    vol_en_mora   = sum(o.amount for o in overdue_ops)

    # Línea de crédito
    total_credit  = sum(c.credit_limit or 0 for c in companies)
    credit_active = sum(
        o.amount for o in all_ops
        if o.status in ["completed", "pending"] and o.due_date >= today
    )
    avg_utilization = round(credit_active / total_credit, 3) if total_credit > 0 else 0.0

    # Health scores
    scores = [c.health_score.score for c in companies if c.health_score]
    avg_health = round(sum(scores) / len(scores), 1) if scores else None
    sin_score  = len([c for c in companies if not c.health_score])

    # Empresas sin actividad reciente
    inactive_30d = len([
        c for c in companies
        if not any(o.operation_date >= cutoff_30d for o in c.operations)
    ])

    return {
        "total_empresas":      total,
        "activas":             active,
        "at_risk":             at_risk,
        "churned":             churned,
        "vol_30d":             vol_30d,
        "vol_90d":             vol_90d,
        "vol_total":           vol_total,
        "mora_rate":           mora_rate,
        "vol_en_mora":         vol_en_mora,
        "total_credit_limit":  total_credit,
        "credit_utilization":  avg_utilization,
        "avg_health_score":    avg_health,
        "empresas_sin_score":  sin_score,
        "inactivas_30d":       inactive_30d,
    }