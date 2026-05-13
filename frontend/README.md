# Frontend — Xepelin CRM

> Next.js 16 + TypeScript + NextAuth (Google OAuth + Credentials)

---

## Stack

| Tecnología | Versión | Uso |
|---|---|---|
| Next.js | 16.2+ | Framework React con App Router |
| TypeScript | 5.0+ | Tipado estático |
| NextAuth | 4.x | Google OAuth + email/contraseña |
| Inter (Google Fonts) | — | Tipografía alineada con Xepelin |

---

## Estructura

```
frontend/
├── app/
│   ├── layout.tsx                        Layout global, SessionProvider
│   ├── globals.css                       Variables CSS, reset, tipografía
│   ├── page.tsx                          Vista 1: Listado de cartera
│   ├── SessionProvider.tsx               Wrapper client-side NextAuth
│   ├── login/page.tsx                    Login: email/pass + Google OAuth
│   ├── company/[id]/page.tsx             Vista 2: Detalle de empresa
│   └── api/auth/[...nextauth]/
│       ├── options.ts                    Config NextAuth (exportada para getServerSession)
│       └── route.ts                      Handler NextAuth
├── components/
│   ├── Navbar.tsx                        Navbar con logo Xepelin, badge CRM
│   ├── CompanyTable.tsx                  Tabla con filtros integrados
│   ├── CompanyFilters.tsx                Filtros: status, país, industria, búsqueda
│   ├── CarteraSummary.tsx                Resumen global de cartera (2 filas)
│   ├── HealthScoreCard.tsx               Card con progress circle, confianza, data gaps
│   ├── ActivityTimeline.tsx              Timeline unificado ops + interacciones
│   ├── NotesEditor.tsx                   Editor notas tipo chat con avatares
│   ├── RefreshScoresButton.tsx           Regenerar todos los scores del KAM
│   └── SignOutButton.tsx                 Cierre de sesión
├── lib/api.ts                            Todas las funciones de fetching
├── public/logo-xepelin.png               Logo oficial Xepelin
├── proxy.ts                              Protección de rutas (Next.js 16)
├── next.config.ts                        images: { unoptimized: true }
└── .env.local                            Variables de entorno
```

---

## Setup

```bash
cd frontend
yarn install
yarn dev
```

App: `http://localhost:3000`

---

## Variables de entorno

```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<openssl rand -base64 32>
GOOGLE_CLIENT_ID=<Google Cloud Console>
GOOGLE_CLIENT_SECRET=<Google Cloud Console>
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Google OAuth
1. [console.cloud.google.com](https://console.cloud.google.com) → OAuth 2.0 Client ID
2. Authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/callback/google
   https://xepelin-crm.vercel.app/api/auth/callback/google
   ```

---

## Autenticación

### Flujos

```
Email/pass  → NextAuth CredentialsProvider → POST /auth/login → bcrypt → OK
Google OAuth → Google autentica → jwt callback → GET /auth/kam-by-email
            → existe en DB  → sesión con kamId
            → no existe     → /login?error=not_authorized
```

### Por qué `authOptions` en archivo separado

`getServerSession()` requiere recibir la config como argumento para leer los callbacks JWT. Por eso `options.ts` está separado de `route.ts`:

```typescript
// app/page.tsx
import { authOptions } from "./api/auth/[...nextauth]/options";
const session = await getServerSession(authOptions);

// app/company/[id]/page.tsx
import { authOptions } from "../../api/auth/[...nextauth]/options";
const session = await getServerSession(authOptions);
```

---

## Vistas

### Vista 1 — Mi Cartera (`/`)

**Resumen global** (`CarteraSummary`):
- Fila 1 (5 cards): volumen 30d, volumen total, mora %, utilización crédito, health score promedio
- Fila 2 (4 cards): activas, en riesgo, churned, sin actividad 30d

**Filtros** (`CompanyFilters`):
- Búsqueda por nombre
- Dropdown: status, país, industria
- Contador de resultados + botón limpiar filtros

**Tabla** (`CompanyTable`):
- Columnas: empresa, país/industria, health score (progress circle SVG), última op., financiado 30d, tendencia 30d, utilización, ops, estado
- Ordenamiento: at_risk → health score asc → activas → churned

### Vista 2 — Detalle (`/company/[id]`)

- **Header**: nombre, país, industria, onboarding, badge estado
- **HealthScoreCard**: progress circle, resumen IA, acciones, badge confianza, tooltip data gaps, botón regenerar con manejo de error
- **Métricas** (4 cards): total ops, volumen total, ops mora, tendencia 30d
- **Línea de crédito**: barra progreso coloreada (azul/amarillo/rojo según utilización)
- **ActivityTimeline**: ops e interacciones unificadas cronológicamente con íconos por tipo
- **NotesEditor**: chat-style, auto-resize, envío ⌘↵, timestamps UTC correctos

---

## Componentes principales

### `CarteraSummary`
- 2 filas de métricas agregadas de la cartera completa
- Colores semánticos por umbral (mora > 15% → rojo, etc.)
- Datos vienen del endpoint `/companies/kam/{id}/summary`

### `CompanyFilters`
- State interno con `useState`
- Filtrado client-side sobre el array de empresas
- Opciones dinámicas generadas desde los valores únicos del dataset
- Botón "Limpiar filtros" visible solo cuando hay filtros activos

### `HealthScoreCard`
- Progress circle SVG con arco proporcional al score
- Badge de confianza: `low/medium/high` con colores semánticos
- Tooltip de datos faltantes (`data_gaps`) al hacer hover
- Estado de error visible si el LLM falla

### `ActivityTimeline`
- Combina `Operation[]` e `Interaction[]` en un array unificado
- Ordenado por fecha descendente
- Línea vertical con dots de color por tipo de evento
- Badges por canal de interacción (WhatsApp/Email/Llamada)

### `NotesEditor`
- Input con auto-resize via `useRef`
- Avatar con iniciales del usuario autenticado
- Timestamps con sufijo "Z" forzado para UTC correcto
- Botón "Enviar" aparece solo al escribir

---

## Paleta de colores

```css
--bg-base:    #F0F0F8;   /* Lavanda suave */
--bg-card:    #FFFFFF;
--text-primary:   #0D0D2B;
--text-muted:     #8888AA;
--purple:         #5B4EE8;   /* CTA, highlights */
--green:    #22C55E;   /* Activo / low risk / tendencia positiva */
--yellow:   #F59E0B;   /* En riesgo / medium */
--red:      #EF4444;   /* Churned / high risk / tendencia negativa */
```

---

## Decisiones técnicas

**CSS inline vs Mantine**: control total del lenguaje visual de Xepelin sin overhead de librería.

**App Router + server components**: fetch al backend en el servidor, sin exponer URL al cliente. Solo `"use client"` para componentes interactivos.

**proxy.ts**: Next.js 16 deprecó `middleware.ts`. El matcher excluye `/login`, `/api/auth/*`, assets y `logo-xepelin.png`.

**`<img>` nativo para el logo**: `<Image>` de Next.js fallaba en `/login` porque el proxy bloqueaba el asset antes de autenticar.

**Progress circle SVG**: comunica el score visualmente — el KAM entiende 20/100 vs 80/100 de un vistazo.

**ActivityTimeline unificado**: el KAM necesita ver la historia completa del cliente en orden cronológico, no en silos separados de ops e interacciones.

**Filtros client-side**: con carteras de 10-50 empresas, filtrar en el frontend es instantáneo y evita round-trips al servidor.

---

## Deploy (Vercel)

```bash
vercel
# Variables: NEXTAUTH_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXT_PUBLIC_API_URL
```

URL actual: `https://xepelin-crm.vercel.app`

Agregar en Google Cloud Console:
```
https://xepelin-crm.vercel.app/api/auth/callback/google
```
