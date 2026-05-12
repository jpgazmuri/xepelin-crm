# Xepelin CRM — Documentación General

> Prueba técnica Growth Engineer II · JP Gazmuri Cervantes

---

## Visión general

CRM interno para KAMs (Key Account Managers) de Xepelin, construido como parte de la prueba técnica de Growth Engineer II.

El sistema permite a los KAMs gestionar su cartera de clientes de forma eficiente, centralizando información financiera, historial de interacciones, health score generado por IA con Claude Haiku y notas propias — todo en una interfaz alineada con el lenguaje visual de Xepelin.

---

## Arquitectura

```
xepelin-crm/
├── backend/        FastAPI + SQLAlchemy + SQLite + Anthropic SDK
├── frontend/       Next.js 16 + TypeScript + NextAuth
└── README.md       Este archivo
```

### Diagrama de arquitectura

```
┌──────────────────────────────────────────────────────────────┐
│                          Browser                             │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐   │
│   │            Next.js Frontend (puerto 3000)            │   │
│   │                                                      │   │
│   │  /login            Email/pass + Google OAuth         │   │
│   │  /                 Vista 1: Listado de cartera       │   │
│   │  /company/[id]     Vista 2: Detalle de empresa       │   │
│   │                                                      │   │
│   │  proxy.ts          Protección de rutas               │   │
│   └─────────────────────────┬────────────────────────────┘   │
│                             │ HTTP / REST                     │
│   ┌─────────────────────────▼────────────────────────────┐   │
│   │            FastAPI Backend (puerto 8000)             │   │
│   │                                                      │   │
│   │  /auth/login               Login email/contraseña   │   │
│   │  /auth/kam-by-email        Lookup KAM por email     │   │
│   │  /companies/kam/{id}       Listado por KAM          │   │
│   │  /companies/{id}           Detalle de empresa       │   │
│   │  /notes/company/{id}       CRUD de notas            │   │
│   │  /health/generate/{id}     Health score (1)         │   │
│   │  /health/generate-all/{id} Health score (cartera)   │   │
│   │                                                      │   │
│   │  SQLAlchemy ORM + SQLite                             │   │
│   │  Anthropic SDK → Claude Haiku 3.5                    │   │
│   └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## Stack tecnológico

| Capa | Tecnología | Justificación |
|---|---|---|
| Backend | FastAPI (Python) | Stack principal del candidato, ideal para APIs REST rápidas con tipado |
| ORM | SQLAlchemy | Estándar de Python para ORM, fácil migración a Postgres |
| Base de datos | SQLite | Suficiente para el prototipo, migración a Postgres es un cambio de una línea |
| Frontend | Next.js 16 + TypeScript | Sugerido en el enunciado, App Router para server components |
| Auth | NextAuth + Google OAuth + Credentials | Doble método de login; Google OAuth para cuentas corporativas, email/pass para demo |
| Estilos | CSS-in-JS inline + globals.css | Sin dependencia de Mantine para mayor control del lenguaje visual |
| LLM | Claude Haiku 3.5 (Anthropic) | ~$0.0003/empresa, output JSON estructurado confiable, SDK maduro en Python |

---

## Autenticación

El sistema soporta dos métodos de login:

### Email + contraseña
El frontend envía las credenciales al backend (`/auth/login`), que verifica el hash bcrypt contra la DB. Si es correcto, NextAuth crea la sesión con el `kamId` del KAM.

### Google OAuth
Google autentica al usuario y devuelve el email. NextAuth consulta el backend (`/auth/kam-by-email`) para verificar si ese email existe como KAM en la DB. Si existe, crea la sesión con el `kamId` correspondiente. Si no existe, redirige a `/login?error=not_authorized`.

```
Email/pass  → backend /auth/login        → verifica bcrypt → sesión con kamId
Google OAuth → Google autentica          → backend /auth/kam-by-email
                                         → existe en DB   → sesión con kamId
                                         → no existe      → /login?error=not_authorized
```

---

## Modelo de datos

```
kams
  id, name, email, country
  password_hash (nullable — null para usuarios OAuth)

companies
  id, name, industry, country
  assigned_kam_id → kams.id
  onboarding_date, status

operations
  id, company_id → companies.id
  product_type, amount, operation_date, due_date, status

interactions
  id, company_id → companies.id
  channel, summary, interaction_date

notes
  id, company_id → companies.id
  content, created_at, updated_at

health_scores
  id, company_id → companies.id (unique)
  score (0-100), churn_risk, summary
  recommended_actions (JSON string)
  confidence, data_gaps
  generated_at
```

---

## Decisiones de producto

### ¿Qué mostrar en el listado?
El criterio fue: **¿qué necesita saber un KAM en 3 segundos por empresa?**
- Health Score con progress circle y color semántico → prioridad visual inmediata
- Última operación → detectar inactividad (señal temprana de churn)
- Financiado 30d → tendencia de monetización
- Estado (activo / en riesgo / churned) → acción requerida

### ¿Por qué ordenar por at_risk primero?
Un KAM con 50 empresas necesita saber dónde poner atención hoy. Las empresas en riesgo van arriba, luego ordenadas por health score ascendente.

### ¿Por qué notas tipo chat?
El modelo de "una nota editable" no refleja cómo trabajan los KAMs en la práctica. Un historial de notas timestampeadas con autor permite auditar qué se dijo y cuándo.

### ¿Por qué health_scores en tabla propia?
El health score es un output de IA, no un atributo de la empresa. Separarlo permite regenerarlo sin tocar los datos base y en el futuro mantener historial de scores.

### ¿Por qué SQLite y no Postgres?
SQLite elimina la dependencia de infraestructura para el prototipo. La migración es cambiar una línea en `database.py`:
```python
SQLALCHEMY_DATABASE_URL = "postgresql://user:pass@host/db"
```

---

## AI for Growth — Health Score

El sistema usa **Claude Haiku 3.5** para generar un health score por empresa basado en comportamiento financiero e interacciones recientes.

Output estructurado y validado:
```json
{
  "health_score": 42,
  "churn_risk": "high",
  "summary": "...",
  "recommended_actions": ["acción 1", "acción 2", "acción 3"],
  "confidence": "medium",
  "data_gaps": ["historial de pagos completo"]
}
```

### Costo estimado a escala

| Escala | Costo mensual |
|---|---|
| 20 empresas (demo) | < $0.01 |
| 1.000 empresas | ~$0.90 |
| 10.000 empresas | ~$18.40 |

---

## Datos sintéticos

El seed genera 4 KAMs y 32 empresas distribuidas:

| KAM | Email | Empresas |
|---|---|---|
| Valentina Rojas | v.rojas@xepelin.com | 10 (CL) |
| Andrés Fuentes | a.fuentes@xepelin.com | 10 (MX) |
| Camila Torres | c.torres@xepelin.com | 5 (CL) |
| JP Gazmuri | jpgazmuric@gmail.com | 7 (CL) |

Credenciales para login con email/contraseña:
```
v.rojas@xepelin.com    / xepelin123
a.fuentes@xepelin.com  / xepelin123
c.torres@xepelin.com   / xepelin123
jpgazmuric@gmail.com   → OAuth (Google)
```

---

## Qué se dejó fuera y por qué

| Feature | Decisión | Justificación |
|---|---|---|
| Tests unitarios | No incluidos | Se priorizó ship velocity |
| Paginación | Límite implícito por KAM | Suficiente para el prototipo |
| Postgres | SQLite | Un cambio de línea para migrar |
| Batch processing nocturno para IA | Generación manual | En producción: job nocturno que regenera solo empresas con actividad reciente |
| Historial de health scores | Un score por empresa | En producción: tabla health_score_history para ver evolución |

---

## Cómo levantar el proyecto completo

```bash
# 1. Entrar al directorio
cd xepelin-crm

# 2. Backend
cd backend
python3 -m venv venv && source venv/bin/activate
pip install fastapi uvicorn sqlalchemy pydantic python-dotenv anthropic bcrypt
python3 seed.py
uvicorn main:app --reload --port 8000

# 3. Frontend (nueva terminal)
cd frontend
yarn install
yarn dev
```

La app estará disponible en `http://localhost:3000`.
La documentación de la API en `http://localhost:8000/docs`.

---

## Variables de entorno requeridas

```bash
# frontend/.env.local
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<genera con: openssl rand -base64 32>
GOOGLE_CLIENT_ID=<desde Google Cloud Console>
GOOGLE_CLIENT_SECRET=<desde Google Cloud Console>
NEXT_PUBLIC_API_URL=http://localhost:8000

# backend/.env
ANTHROPIC_API_KEY=<desde console.anthropic.com>
```

---

## Partes del caso

| Parte | Estado | Descripción |
|---|---|---|
| Parte 1 — Build | ✅ Completo | CRM con API + frontend + OAuth + email/pass + DB + notas tipo chat |
| Parte 2 — AI for Growth | ✅ Completo | Health Score con Claude Haiku integrado al CRM |
| Parte 3 — Strategy | ✅ Completo | Roadmap 4 meses + defensa ejecutiva |

---

*JP Gazmuri Cervantes · Growth Engineer II · Xepelin*
