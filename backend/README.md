# Backend — Xepelin CRM API

> FastAPI + SQLAlchemy + SQLite + Claude Haiku 3.5

---

## Stack

| Tecnología | Versión | Uso |
|---|---|---|
| Python | 3.11+ | Lenguaje base |
| FastAPI | 0.110+ | Framework REST API |
| SQLAlchemy | 2.0+ | ORM |
| Pydantic | 2.0+ | Validación de schemas |
| SQLite | — | Base de datos (migrable a Postgres en 1 línea) |
| Uvicorn | — | ASGI server |
| Anthropic SDK | 0.25+ | Claude Haiku 3.5 para health scores |
| bcrypt | — | Hash de contraseñas |

---

## Estructura

```
backend/
├── main.py           Entrada, CORS, registro de routers
├── database.py       Conexión DB, sesión, Base declarativa
├── models.py         Modelos SQLAlchemy
├── schemas.py        Schemas Pydantic (input/output)
├── seed.py           4 KAMs, 32 empresas con variabilidad real
├── routers/
│   ├── auth.py       Login email/pass + lookup KAM por email (OAuth)
│   ├── companies.py  Listado, detalle, summary de cartera
│   ├── notes.py      CRUD de notas por empresa
│   └── health.py     Health scores con Claude Haiku
├── .env              Variables de entorno (no commitear)
└── xepelin_crm.db    Generado por seed.py
```

---

## Setup

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install fastapi uvicorn sqlalchemy pydantic python-dotenv anthropic bcrypt
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env
python3 seed.py
uvicorn main:app --reload --port 8000
```

Swagger UI: `http://localhost:8000/docs`

---

## Variables de entorno

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Endpoints

### Auth

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/auth/login` | Login email/contraseña — verifica bcrypt |
| `GET` | `/auth/kam-by-email?email=...` | Lookup KAM por email — usado por NextAuth OAuth |

### Companies

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/companies/kam/{kam_id}` | Listado con métricas: health score, tendencia 30d, utilización crédito |
| `GET` | `/companies/kam/{kam_id}/summary` | Resumen agregado de cartera del KAM |
| `GET` | `/companies/{company_id}` | Detalle con ops, interacciones, notas, health score, tendencia |
| `PATCH` | `/companies/{company_id}` | Actualizar status |

### Notes

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/notes/company/{company_id}` | Notas ordenadas por fecha desc |
| `POST` | `/notes/company/{company_id}` | Crear nota |
| `PATCH` | `/notes/{note_id}` | Editar nota |
| `DELETE` | `/notes/{note_id}` | Eliminar nota |

### Health Scores

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/health/generate/{company_id}` | Generar/regenerar con Claude Haiku |
| `POST` | `/health/generate-all/{kam_id}` | Generar para toda la cartera |

---

## Modelo de datos

```python
class KAM:
    id, name, email, country
    password_hash   # nullable — null para OAuth

class Company:
    id, name, industry, country
    assigned_kam_id → KAM
    onboarding_date, status
    credit_limit    # línea de crédito aprobada

class Operation:
    id, company_id → Company
    product_type    # factoring | confirming | capital_trabajo
    amount, operation_date, due_date, status

class Interaction:
    id, company_id → Company
    channel         # whatsapp | email | call
    summary, interaction_date

class Note:
    id, company_id → Company
    content, created_at, updated_at

class HealthScore:
    id, company_id → Company (unique)
    score, churn_risk, summary
    recommended_actions  # JSON string
    confidence, data_gaps  # JSON string
    generated_at
```

---

## Métricas calculadas en el backend

### Tendencia 30d (`trend_pct`)
Compara el volumen financiado de los últimos 30 días vs. los 30 días anteriores:
```python
trend = (total_30d - total_prev_30d) / total_prev_30d * 100
```
- Positivo → empresa creciendo
- Negativo → empresa achicándose
- 100% → empresa nueva sin historial previo

### Utilización de línea de crédito (`credit_utilization_rate`)
Operaciones vigentes (due_date >= hoy) sobre la línea aprobada:
```python
credit_utilized = sum(o.amount for o in ops if o.status in ["completed","pending"] and o.due_date >= today)
utilization_rate = credit_utilized / credit_limit
```

### Resumen de cartera (`/summary`)
Agrega métricas de todas las empresas del KAM:
- Volumen 30d y 90d
- Mora % y volumen en mora
- Utilización promedio de línea
- Health score promedio
- Empresas inactivas últimos 30 días

---

## AI — Prompt design

**System prompt**: rol de analista de riesgo fintech B2B, restricción "NUNCA inventes datos", output JSON puro.

**User prompt** incluye:
- Datos financieros: ops, mora %, volumen, días inactivo, productos, línea de crédito y utilización
- Señales de interacciones: días desde último contacto, canal más usado, streak de no-respuesta
- Schema JSON exacto con `confidence` y `data_gaps`

**Output**:
```json
{
  "health_score": 42,
  "churn_risk": "high",
  "summary": "...",
  "recommended_actions": ["...", "...", "..."],
  "confidence": "medium",
  "data_gaps": ["campo faltante 1"]
}
```

**Costo estimado (Haiku 3.5)**:

| Escala | Costo |
|---|---|
| 32 empresas | < $0.01 |
| 1.000/mes | ~$0.90 |
| 10.000/mes | ~$18.40 |

---

## Datos sintéticos

`seed.py` genera:
- 4 KAMs con países y contraseñas
- 32 empresas distribuidas con variabilidad real de status, operaciones y montos
- Operaciones con distribución realista (activas 8-20 ops, at_risk 3-5, churned 1-2)
- Interacciones con summaries coherentes al status de cada empresa

Reset:
```bash
rm xepelin_crm.db && python3 seed.py
```

---

## Deploy (Railway)

```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

Variables en Railway dashboard: `ANTHROPIC_API_KEY`

URL actual: `https://xepelin-crm-production.up.railway.app`
