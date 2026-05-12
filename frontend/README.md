# Frontend — Xepelin CRM

> Next.js 16 + TypeScript + NextAuth (Google OAuth + Credentials)

---

## Stack

| Tecnología | Versión | Uso |
|---|---|---|
| Next.js | 16.2+ | Framework React con App Router |
| TypeScript | 5.0+ | Tipado estático |
| NextAuth | 4.x | Autenticación — Google OAuth + email/contraseña |
| Inter (Google Fonts) | — | Tipografía (alineada con Xepelin) |

---

## Estructura

```
frontend/
├── app/
│   ├── layout.tsx                        Layout global, SessionProvider
│   ├── globals.css                       Variables CSS, reset, tipografía
│   ├── page.tsx                          Vista 1: Listado de cartera
│   ├── SessionProvider.tsx               Wrapper client-side para NextAuth
│   ├── login/
│   │   └── page.tsx                      Login: email/pass + Google OAuth
│   ├── company/
│   │   └── [id]/
│   │       └── page.tsx                  Vista 2: Detalle de empresa
│   └── api/
│       └── auth/
│           └── [...nextauth]/
│               ├── options.ts            Config NextAuth (exportada para getServerSession)
│               └── route.ts             Handler NextAuth
├── components/
│   ├── Navbar.tsx                        Navbar compartido, logo Xepelin
│   ├── CompanyTable.tsx                  Tabla con progress circles de health score
│   ├── HealthScoreCard.tsx               Card interactiva de health score con IA
│   ├── NotesEditor.tsx                   Editor de notas tipo chat con avatares
│   ├── RefreshScoresButton.tsx           Regenerar todos los scores del KAM
│   └── SignOutButton.tsx                 Cierre de sesión
├── lib/
│   └── api.ts                            Funciones de fetching al backend
├── public/
│   └── logo-xepelin.png                  Logo oficial de Xepelin
├── proxy.ts                              Protección de rutas (Next.js 16)
├── next.config.ts                        images: { unoptimized: true }
└── .env.local                            Variables de entorno (no commitear)
```

---

## Instalación y setup

```bash
cd frontend
yarn install
yarn dev
```

La app estará disponible en `http://localhost:3000`.

---

## Variables de entorno

```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<genera con: openssl rand -base64 32>
GOOGLE_CLIENT_ID=<desde Google Cloud Console>
GOOGLE_CLIENT_SECRET=<desde Google Cloud Console>
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Configurar Google OAuth

1. [console.cloud.google.com](https://console.cloud.google.com) → nuevo proyecto
2. **APIs & Services → Credentials → OAuth 2.0 Client ID**
3. Authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/callback/google
   https://tu-dominio.vercel.app/api/auth/callback/google
   ```

---

## Autenticación

### Dos métodos de login

**Email + contraseña:**
```
Usuario ingresa email/pass → NextAuth CredentialsProvider
→ POST /auth/login al backend
→ backend verifica bcrypt
→ OK → sesión con kamId
→ Error → mensaje "Email o contraseña incorrectos"
```

**Google OAuth:**
```
Usuario hace clic en "Continuar con Google" → Google autentica
→ NextAuth callback jwt → GET /auth/kam-by-email?email=...
→ email existe en DB → sesión con kamId correcto
→ email no existe → redirect /login?error=not_authorized
```

### Por qué `authOptions` está en archivo separado

`getServerSession()` en server components requiere recibir la config de NextAuth como argumento para poder leer los callbacks JWT y obtener el `kamId`. Por eso `options.ts` está separado de `route.ts` y se importa en cada server component:

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

### Vista 1 — Listado de cartera (`/`)

- **Stats row**: Activas / En riesgo / Churned
- **Botón "↻ Actualizar scores"**: regenera todos los health scores del KAM
- **Tabla**: empresa, país/industria, health score (progress circle SVG), última op., financiado 30d, ops, estado
- **Ordenamiento**: at_risk → health score ascendente → activas → churned
- **Click en fila**: navega al detalle

### Vista 2 — Detalle de empresa (`/company/[id]`)

- **Header**: nombre, país, industria, onboarding, badge de estado
- **HealthScoreCard**: progress circle, churn risk, resumen IA, acciones, botón regenerar
- **Métricas**: total ops, volumen total, ops con mora
- **Historial de operaciones**: producto, monto, fecha, estado
- **Historial de interacciones**: badges por canal + resumen + fecha
- **Notas del KAM**: chat-style con avatar, crear/editar/eliminar, timestamp relativo

---

## Componentes principales

### `HealthScoreCard`
- Progress circle SVG con arco proporcional al score
- Estado local — actualiza sin recargar la página
- Colores semánticos: verde (low) / amarillo (medium) / rojo (high)
- Botón "Generar" si no hay score, "↻ Regenerar" si existe

### `NotesEditor`
- Input con auto-resize via `useRef`
- Envío con botón (aparece al escribir) o `⌘↵`
- Avatar con iniciales del usuario autenticado via `useSession`
- Timestamps en UTC con sufijo "Z" forzado para evitar drift

### `CompanyTable`
- Progress circle SVG para health score en el listado
- Formateo de montos (K/M) y días desde última op.
- Color rojo en "última op." si > 30 días

### `RefreshScoresButton`
- Llama a `/health/generate-all/{kamId}`
- Estado "✓ Actualizado" por 1.5s, luego `router.refresh()`

---

## Paleta de colores

```css
--bg-base:    #F0F0F8;   /* Fondo lavanda suave */
--bg-card:    #FFFFFF;   /* Cards */
--text-primary:   #0D0D2B;   /* Títulos */
--text-muted:     #8888AA;   /* Labels */
--purple:         #5B4EE8;   /* CTA, highlights */
--green:    #22C55E;   /* Activo / low risk */
--yellow:   #F59E0B;   /* En riesgo / medium */
--red:      #EF4444;   /* Churned / high risk */
```

---

## Decisiones técnicas

**¿Por qué CSS inline?** Control total sobre el lenguaje visual de Xepelin sin overhead de Mantine.

**¿Por qué App Router + server components?** Fetch al backend directo en el servidor, sin exponer la API URL al cliente. Solo son `"use client"` los componentes interactivos.

**¿Por qué `proxy.ts`?** Next.js 16 deprecó `middleware.ts`. El matcher excluye `/login`, `/api/auth/*`, assets estáticos y `logo-xepelin.png`.

**¿Por qué `<img>` nativo para el logo?** `<Image>` de Next.js fallaba en `/login` porque el proxy bloqueaba el asset antes de autenticar. Con `<img>` nativo y la ruta en el matcher del proxy se resuelve sin overhead.

**¿Por qué progress circle SVG?** Comunica el score visualmente — el KAM entiende 20/100 vs 80/100 de un vistazo sin leer el número.

---

## Deploy (Vercel)

```bash
npm install -g vercel
cd frontend && vercel

# Variables en Vercel dashboard:
# NEXTAUTH_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXT_PUBLIC_API_URL
```

Agregar en Google Cloud Console → Authorized redirect URIs:
```
https://tu-app.vercel.app/api/auth/callback/google
```
