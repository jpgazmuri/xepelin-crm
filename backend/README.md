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
| SQLite | — | Base de datos |
| Uvicorn | — | ASGI server |
| Anthropic SDK | 0.25+ | Claude Haiku 3.5 para health scores |
| bcrypt | — | Hash de contraseñas |

---

## Estructura

```
backend/
├── main.py           Entrada de la app, CORS, registro de routers
├── database.py       Conexión a la DB, sesión, Base declarativa
├── models.py         Modelos SQLAlchemy (tablas)
├── schemas.py        Schemas Pydantic (input/output)
├── seed.py           Generación de datos sintéticos (4 KAMs, 32 empresas)
├── routers/
│   ├── __init__.py
│   ├── auth.py       Login email/pass + lookup KAM por email (OAuth)
│   ├── companies.py  Endpoints de empresas e interacciones
│   ├── notes.py      CRUD de notas por empresa
│   └── health.py     Generación de health scores con Claude Haiku
├── .env              Variables de entorno (no commitear)
└── xepelin_crm.db    Generado automáticamente al correr seed.py
```

---

## Instalación y setup

```bash
cd backend

# Crear entorno virtual
python3 -m venv venv
source venv/bin/activate      # Mac/Linux
# venv\Scripts\activate       # Windows

# Instalar dependencias
pip install fastapi uvicorn sqlalchemy pydantic python-dotenv anthropic bcrypt

# Crear .env con tu ANTHROPIC_API_KEY
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env

# Generar datos sintéticos
python3 seed.py

# Levantar servidor
uvicorn main:app --reload --port 8000
```

Documentación interactiva disponible en `http://localhost:8000/docs`.

---

## Variables de entorno

Crea un archivo `.env` en la raíz de `backend/`:

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Endpoints

### Auth

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/auth/login` | Login con email y contraseña — verifica bcrypt en DB |
| `GET` | `/auth/kam-by-email?email=...` | Lookup de KAM por email — usado por NextAuth en OAuth |

**Ejemplo — login con credenciales:**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "v.rojas@xepelin.com", "password": "xepelin123"}'
```

**Respuesta:**
```json
{ "id": 1, "name": "Valentina Rojas", "email": "v.rojas@xepelin.com", "country": "CL" }
```

**Ejemplo — lookup por email (OAuth):**
```bash
curl "http://localhost:8000/auth/kam-by-email?email=jpgazmuric@gmail.com"
```

### Companies

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/companies/kam/{kam_id}` | Listado de empresas de un KAM, ordenadas por prioridad |
| `GET` | `/companies/{company_id}` | Detalle completo con operaciones, interacciones, notas y health score |
| `PATCH` | `/companies/{company_id}` | Actualizar estado de una empresa |

### Notes

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/notes/company/{company_id}` | Notas de una empresa (más reciente primero) |
| `POST` | `/notes/company/{company_id}` | Crear una nota |
| `PATCH` | `/notes/{note_id}` | Editar una nota |
| `DELETE` | `/notes/{note_id}` | Eliminar una nota |

### Health Scores

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/health/generate/{company_id}` | Genera o regenera el health score con Claude Haiku |
| `POST` | `/health/generate-all/{kam_id}` | Genera health scores para toda la cartera de un KAM |

---

## Modelo de datos

```python
class KAM:
    id, name, email, country
    password_hash   # nullable — null para usuarios OAuth puros

class Company:
    id, name, industry, country
    assigned_kam_id   # FK → KAM
    onboarding_date, status

class Operation:
    id, company_id    # FK → Company
    product_type      # factoring | confirming | capital_trabajo
    amount, operation_date, due_date, status

class Interaction:
    id, company_id    # FK → Company
    channel           # whatsapp | email | call
    summary, interaction_date

class Note:
    id, company_id    # FK → Company
    content, created_at, updated_at

class HealthScore:
    id, company_id    # FK → Company (unique)
    score             # 0-100
    churn_risk        # low | medium | high
    summary, recommended_actions  # recommended_actions: JSON string
    generated_at
```

---

## Autenticación — flujo completo

```
Email/pass  → POST /auth/login
            → bcrypt.checkpw(input, kam.password_hash)
            → 200 KAMOut | 401 Unauthorized

Google OAuth → GET /auth/kam-by-email?email=...
             → busca KAM por email en DB
             → 200 KAMOut | 404 Not Found
             → NextAuth decide si autoriza o redirige a /login?error=not_authorized
```

**Nota importante:** `password_hash` es nullable. Un KAM puede existir solo con email (OAuth) o con email + hash (credenciales). Un KAM con `password_hash=null` no puede hacer login con credenciales — recibirá el mensaje "Este usuario usa OAuth".

---

## AI — Health Score con Claude Haiku

### Diseño del prompt

**System prompt** — rol y restricciones:
- Analista de riesgo de fintech B2B latinoamericana
- "NUNCA inventes datos que no estén en el input"
- Output: JSON puro sin markdown

**User prompt** — datos estructurados:
- Comportamiento financiero (ops, mora %, volumen, días inactivo, productos)
- Interacciones recientes (últimas 5 por fecha)
- Schema JSON exacto con `confidence` y `data_gaps`

### Costo estimado

| Escala | Costo (Haiku 3.5) |
|---|---|
| 32 empresas (demo completo) | < $0.01 |
| 1.000 empresas/mes | ~$0.90 |
| 10.000 empresas/mes | ~$18.40 |

---

## Datos sintéticos

`seed.py` genera:
- **4 KAMs**: Valentina (CL), Andrés (MX), Camila (CL), JP/OAuth (CL)
- **32 empresas** distribuidas entre los 4 KAMs
- Operaciones con variabilidad real por status (activas: 8–20 ops, at_risk: 3–5, churned: 1–2)
- Montos ajustados por salud: activas $5M–$50M, at_risk $500K–$8M
- Interacciones con summaries coherentes al status de cada empresa

Para resetear:
```bash
rm xepelin_crm.db
python3 seed.py
# Regenerar health scores:
curl -X POST http://localhost:8000/health/generate-all/1
curl -X POST http://localhost:8000/health/generate-all/2
curl -X POST http://localhost:8000/health/generate-all/3
curl -X POST http://localhost:8000/health/generate-all/4
```

---

## Decisiones técnicas

**¿Por qué FastAPI?** Stack principal del candidato + SDK más maduro de Anthropic en Python.

**¿Por qué SQLite?** Elimina dependencias de infraestructura. Migrar a Postgres = cambiar una línea en `database.py`.

**¿Por qué bcrypt y no JWT propio?** NextAuth maneja el JWT de sesión. El backend solo necesita verificar credenciales — bcrypt es el estándar para hash de contraseñas.

**¿Por qué `password_hash` nullable?** Permite tener KAMs que solo usan OAuth (sin contraseña) y KAMs que usan email/pass, en la misma tabla. Flexible para producción.

**¿Por qué health_scores en tabla propia?** Output de IA ≠ atributo de la empresa. Separarlo permite regenerarlo independientemente y en el futuro mantener historial.

---

## Deploy (Railway)

Crear `Procfile` en la raíz de `backend/`:
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

```bash
npm install -g @railway/cli
railway login && railway init && railway up
# Variables en Railway dashboard: ANTHROPIC_API_KEY
```
