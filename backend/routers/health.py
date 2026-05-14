from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import anthropic
import json
import os
from dotenv import load_dotenv
import models, schemas
from database import get_db
from datetime import date

load_dotenv()
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

router = APIRouter(prefix="/health", tags=["health"])

SYSTEM_PROMPT = """Eres un analista de riesgo y crecimiento de una fintech B2B latinoamericana llamada Xepelin.
Tu rol es evaluar la salud de clientes pyme basándote en señales de comportamiento financiero y de interacción comercial.

Debes ser conservador en tus evaluaciones y fundamentar cada recomendación en los datos provistos.
NUNCA inventes datos que no estén en el input.
Si un campo está vacío o con pocos datos, indícalo en tu análisis.

Responde ÚNICAMENTE con JSON válido, sin explicaciones adicionales, sin markdown, sin backticks."""

def build_company_prompt(company: models.Company) -> str:
    ops          = company.operations
    interactions = company.interactions

    total_ops     = len(ops)
    overdue_ops   = len([o for o in ops if o.status == "overdue"])
    total_amount  = sum(o.amount for o in ops)
    recent_ops    = [o for o in ops if (datetime.now().date() - o.operation_date).days <= 30]
    total_30d     = sum(o.amount for o in recent_ops)
    last_op       = max((o.operation_date for o in ops), default=None)
    days_inactive = (datetime.now().date() - last_op).days if last_op else 999  
    products_used = list(set(o.product_type for o in ops))

    credit_limit = company.credit_limit or 0

    # Operaciones vigentes = completadas cuyo due_date aún no ha pasado
    credit_utilized = sum(
        o.amount for o in ops
        if o.status in ["completed", "pending"]
        and o.due_date >= date.today()
    )
    utilization_rate = round(credit_utilized / credit_limit, 3) if credit_limit > 0 else 0.0

    interactions_sorted = sorted(interactions, key=lambda x: x.interaction_date, reverse=True)

    # Días desde última interacción
    last_interaction_date = interactions_sorted[0].interaction_date if interactions_sorted else None
    days_since_last_interaction = (datetime.now().date() - last_interaction_date).days if last_interaction_date else 999

    # Canal más frecuente
    from collections import Counter
    channel_counts = Counter(i.channel for i in interactions)
    most_used_channel = channel_counts.most_common(1)[0][0] if channel_counts else "ninguno"

    # Interacciones sin respuesta consecutivas (resumen contiene "sin respuesta")
    no_response_streak = 0
    for i in interactions_sorted:
        if "sin respuesta" in i.summary.lower():
            no_response_streak += 1
        else:
            break

    interaction_summaries = [
        f"- [{i.channel.upper()}] {i.interaction_date}: {i.summary}"
        for i in interactions_sorted[:5]
    ]

    return f"""Evalúa la salud del siguiente cliente de Xepelin:

DATOS DE LA EMPRESA:
- Nombre: {company.name}
- Industria: {company.industry}
- País: {company.country}
- Estado actual: {company.status}
- Cliente desde: {company.onboarding_date}

COMPORTAMIENTO FINANCIERO:
- Total operaciones históricas: {total_ops}
- Operaciones en mora: {overdue_ops} ({round(overdue_ops/total_ops*100) if total_ops > 0 else 0}%)
- Volumen total financiado: ${total_amount:,.0f}
- Volumen financiado últimos 30 días: ${total_30d:,.0f}
- Días sin operar: {days_inactive}
- Productos utilizados: {', '.join(products_used) if products_used else 'ninguno'}
- Línea de crédito aprobada: ${credit_limit:,.0f}
- Línea utilizada (últimos 90d): ${credit_utilized:,.0f}
- Tasa de utilización: {utilization_rate:.1%}

INTERACCIONES:
- Días desde último contacto: {days_since_last_interaction}
- Canal más usado: {most_used_channel}
- Contactos sin respuesta consecutivos: {no_response_streak}
- Detalle últimas {len(interaction_summaries)} interacciones:
{chr(10).join(interaction_summaries) if interaction_summaries else '  Sin interacciones registradas'}

Responde con este JSON exacto:
{{
  "health_score": <número entero 0-100>,
  "churn_risk": "<low|medium|high>",
  "summary": "<2-3 oraciones explicando el estado del cliente>",
  "recommended_actions": ["<acción 1>", "<acción 2>", "<acción 3>"],
  "confidence": "<low|medium|high>",
  "data_gaps": ["<campo que faltó para mejor análisis>"]
}}"""


def parse_llm_response(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    text = text.strip()
    return json.loads(text)

@router.post("/generate/{company_id}", response_model=schemas.HealthScoreOut)
def generate_health_score(company_id: int, db: Session = Depends(get_db)):
    """Genera o regenera el health score de una empresa usando Claude Haiku."""
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    prompt = build_company_prompt(company)

    try:
        message = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}]
        )
        data = parse_llm_response(message.content[0].text)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"LLM retornó JSON inválido: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al llamar al LLM: {str(e)}")

    required = ["health_score", "churn_risk", "summary", "recommended_actions"]
    for field in required:
        if field not in data:
            raise HTTPException(status_code=500, detail=f"Campo faltante en respuesta LLM: {field}")

    existing = db.query(models.HealthScore).filter(
        models.HealthScore.company_id == company_id
    ).first()

    if existing:
        existing.score               = data["health_score"]
        existing.churn_risk          = data["churn_risk"]
        existing.summary             = data["summary"]
        existing.recommended_actions = json.dumps(data["recommended_actions"])
        existing.confidence          = data.get("confidence")
        existing.data_gaps           = json.dumps(data.get("data_gaps", []))
        existing.generated_at        = datetime.utcnow()
    else:
        db.add(models.HealthScore(
            company_id=company_id,
            score=data["health_score"],
            churn_risk=data["churn_risk"],
            summary=data["summary"],
            recommended_actions=json.dumps(data["recommended_actions"]),
            confidence=data.get("confidence"),
            data_gaps=json.dumps(data.get("data_gaps", [])),
            generated_at=datetime.utcnow()
        ))

    db.commit()

    saved = db.query(models.HealthScore).filter(
        models.HealthScore.company_id == company_id
    ).first()

    return schemas.HealthScoreOut(
        score=saved.score,
        churn_risk=saved.churn_risk,
        summary=saved.summary,
        recommended_actions=json.loads(saved.recommended_actions),
        confidence=saved.confidence,
        data_gaps=json.loads(saved.data_gaps) if saved.data_gaps else [],
        generated_at=saved.generated_at
    )


@router.post("/generate-all/{kam_id}")
def generate_all_health_scores(kam_id: int, db: Session = Depends(get_db)):
    """Genera health scores para todas las empresas de un KAM."""
    companies = db.query(models.Company)\
                  .filter(models.Company.assigned_kam_id == kam_id)\
                  .all()

    if not companies:
        raise HTTPException(status_code=404, detail="KAM no encontrado o sin empresas")

    results = {"success": [], "failed": []}

    for company in companies:
        try:
            generate_health_score(company.id, db)
            results["success"].append(company.id)
        except Exception as e:
            results["failed"].append({"company_id": company.id, "error": str(e)})

    return {
        "total": len(companies),
        "success": len(results["success"]),
        "failed": len(results["failed"]),
        "details": results
    }