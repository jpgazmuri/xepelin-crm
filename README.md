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
┌─────────────────────────────────────────────────────────────────┐
│                           Browser                               │
│  / Mi cartera · /company/[id] Detalle · /login Autenticación   │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│              Frontend — Next.js 16 (Vercel)                     │
│  proxy.ts · NextAuth · lib/api.ts · Componentes React           │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST / HTTP
┌────────────────────────────▼────────────────────────────────────┐
│              Backend — FastAPI (Railway)                         │
│  auth.py · companies.py · notes.py · health.py · SQLite ORM    │
└──────┬──────────────────────────────────────┬───────────────────┘
       │                                      │
┌──────▼──────┐                    ┌──────────▼──────────┐
│ Google OAuth│                    │  Anthropic API       │
│ Autenticación│                   │  Claude Haiku 3.5    │
└─────────────┘                    └─────────────────────┘
```

---

## Stack tecnológico

| Capa | Tecnología | Justificación |
|---|---|---|
| Backend | FastAPI (Python) | Stack principal del candidato, ideal para APIs REST rápidas con tipado |
| ORM | SQLAlchemy | Estándar de Python para ORM, fácil migración a Postgres |
| Base de datos | SQLite | Suficiente para el prototipo, migración a Postgres es un cambio de una línea |
| Frontend | Next.js 16 + TypeScript | Sugerido en el enunciado, App Router para server components |
| Auth | NextAuth + Google OAuth + Credentials | Doble método: Google OAuth para cuentas corporativas, email/pass para demo |
| Estilos | CSS-in-JS inline + globals.css | Control total del lenguaje visual de Xepelin sin overhead de Mantine |
| LLM | Claude Haiku 3.5 (Anthropic) | ~$0.0003/empresa, output JSON estructurado confiable, SDK maduro en Python |

---

## Autenticación

Dos métodos de login:

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
  onboarding_date, status, credit_limit

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
  recommended_actions (JSON), confidence, data_gaps (JSON)
  generated_at
```

---

## Funcionalidades principales

### Vista 1 — Mi Cartera
- **Resumen global**: volumen 30d/total, mora %, utilización crédito, health score promedio, activas/at_risk/churned, empresas sin actividad 30d
- **Filtros**: por status, país, industria y búsqueda por nombre
- **Tabla**: empresa, health score (progress circle), última op., financiado 30d, tendencia 30d, utilización línea, ops totales, estado
- **Ordenamiento**: at_risk primero → health score ascendente
- **Botón regenerar scores**: actualiza todos los health scores del KAM con IA

### Vista 2 — Detalle de empresa
- **Header**: nombre, país, industria, onboarding, estado
- **Health Score Card**: progress circle SVG, churn risk, resumen IA, acciones recomendadas, badge de confianza, datos faltantes con tooltip, botón regenerar
- **Métricas**: total ops, volumen total, ops en mora, tendencia 30d
- **Línea de crédito**: monto utilizado / aprobado con barra de progreso coloreada
- **Timeline de actividad**: operaciones e interacciones unificadas cronológicamente
- **Notas del KAM**: chat-style con avatar, crear/editar/eliminar, timestamp relativo

### AI — Health Score
Output estructurado por empresa:
```json
{
  "health_score": 42,
  "churn_risk": "high",
  "summary": "...",
  "recommended_actions": ["...", "...", "..."],
  "confidence": "medium",
  "data_gaps": ["historial de pagos completo"]
}
```

---

## Datos sintéticos

| KAM | Email | País | Empresas |
|---|---|---|---|
| Valentina Rojas | v.rojas@xepelin.com | CL | 10 |
| Andrés Fuentes | a.fuentes@xepelin.com | MX | 10 |
| Camila Torres | c.torres@xepelin.com | CL | 5 |
| JP Gazmuri | jpgazmuric@gmail.com | CL | 7 |

Credenciales:
```
v.rojas@xepelin.com    / xepelin123
a.fuentes@xepelin.com  / xepelin123
c.torres@xepelin.com   / xepelin123
jpgazmuric@gmail.com   → OAuth (Google)
```

---

## Cómo levantar el proyecto

```bash
# Backend
cd backend
python3 -m venv venv && source venv/bin/activate
pip install fastapi uvicorn sqlalchemy pydantic python-dotenv anthropic bcrypt
python3 seed.py
uvicorn main:app --reload --port 8000

# Frontend (nueva terminal)
cd frontend
yarn install
yarn dev
```

App: `http://localhost:3000` · API docs: `http://localhost:8000/docs`

---

## Variables de entorno

```bash
# frontend/.env.local
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<openssl rand -base64 32>
GOOGLE_CLIENT_ID=<Google Cloud Console>
GOOGLE_CLIENT_SECRET=<Google Cloud Console>
NEXT_PUBLIC_API_URL=http://localhost:8000

# backend/.env
ANTHROPIC_API_KEY=<console.anthropic.com>
```

---

## Partes del caso

| Parte | Estado |
|---|---|
| Parte 1 — Build | ✅ CRM completo con API + frontend + OAuth + email/pass + DB |
| Parte 2 — AI for Growth | ✅ Health Score con Claude Haiku, confidence, data_gaps |
| Parte 3 — Strategy | ✅ Roadmap 4 meses + defensa ejecutiva |

---

*JP Gazmuri Cervantes · Growth Engineer II · Xepelin*
