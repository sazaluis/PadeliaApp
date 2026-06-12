# 🏆 PadelIA - Plataforma SaaS de Gestión de Pádel

Plataforma completa para la gestión de clubes de pádel, equipos, entrenamientos, convocatorias y competiciones de fin de semana tipo liga.

## 📋 Arquitectura del Proyecto

### Stack Tecnológico

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| **Frontend** | Next.js 14 (App Router) | SSR/SSG, React Server Components, API Routes |
| **UI** | React + TypeScript + TailwindCSS + shadcn/ui | Componentes reutilizables, diseño responsive |
| **Backend** | Next.js API Routes | Integración directa con frontend, serverless |
| **Database** | PostgreSQL + Prisma ORM | Tipado seguro, migraciones, relaciones complejas |
| **Auth** | NextAuth.js | Autenticación multi-proveedor, JWT, roles |
| **State** | React hooks + SWR pattern | Gestión de estado client-side |
| **Forms** | React Hook Form + Zod | Validación robusta, UX optimizada |

### Estructura de Carpetas (Arquitectura por Dominios)

```
padelia/
├── prisma/
│   ├── schema.prisma          # Modelo de datos completo
│   └── seed.ts                # Datos de prueba
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # API Routes por dominio
│   │   │   ├── auth/          # Autenticación
│   │   │   ├── clubs/         # CRUD Clubes
│   │   │   ├── teams/         # CRUD Equipos
│   │   │   ├── players/       # CRUD Jugadores
│   │   │   ├── trainings/     # CRUD Entrenamientos
│   │   │   ├── matches/       # CRUD Partidos + Resultados
│   │   │   └── league/        # Clasificaciones
│   │   ├── auth/              # Páginas de autenticación
│   │   ├── dashboard/         # Dashboard principal
│   │   ├── clubs/             # Módulo Clubes
│   │   ├── teams/             # Módulo Equipos
│   │   ├── players/           # Módulo Jugadores
│   │   ├── trainings/         # Módulo Entrenamientos
│   │   ├── convocations/      # Módulo Convocatorias
│   │   ├── league/            # Módulo Liga
│   │   ├── matches/           # Módulo Partidos
│   │   ├── notifications/     # Notificaciones
│   │   └── settings/          # Configuración
│   ├── components/
│   │   ├── layout/            # Layout, Sidebar, Header
│   │   └── ui/                # Componentes base (Button, Card, Input, Badge)
│   ├── lib/
│   │   ├── auth.ts            # Configuración NextAuth
│   │   ├── prisma.ts          # Cliente Prisma singleton
│   │   ├── utils.ts           # Utilidades generales
│   │   └── validations.ts     # Esquemas Zod
│   └── types/
│       └── next-auth.d.ts     # Extensión de tipos NextAuth
```

### Modelo de Datos (ER)

```
User ─┬─ Player ─── Team ─── Club
      ├─ Coach ──── Club
      └─ Club (manager)

Season ─── League ─── Matchday ─── Match ─── MatchResult
                                    │
                              Convocation ─── ConvocationPlayer

Training ─── Attendance ─── Player
Training ─── TrainingPlayer ─── Player

Standing (Team × League × Season)
Notification ─── User
```

### Perfiles de Usuario y Permisos

| Rol | Clubs | Equipos | Jugadores | Entrenamientos | Convocatorias | Liga | Resultados |
|-----|-------|---------|-----------|----------------|---------------|------|------------|
| **Admin Global** | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD |
| **Responsable Club** | - | CRUD | CRUD | CRUD | CRUD | Ver | Ver |
| **Capitán** | - | Ver | Ver | Ver | CRUD | Ver | CRUD |
| **Entrenador** | - | Ver | Ver | CRUD | Ver | Ver | Ver |
| **Jugador** | - | - | - | Ver | Ver | Ver | Ver |

### API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registro de usuario |
| GET/POST | `/api/clubs` | Listar/Crear clubes |
| GET/POST | `/api/teams` | Listar/Crear equipos |
| GET/POST | `/api/players` | Listar/Crear jugadores |
| GET/POST | `/api/trainings` | Listar/Crear entrenamientos |
| GET/POST | `/api/matches` | Listar/Crear partidos |
| POST | `/api/matches/[id]/results` | Registrar resultado |
| GET | `/api/league/standings` | Obtener clasificación |

## 🚀 Roadmap

### MVP (V1) - Actual
- ✅ Autenticación con roles
- ✅ Gestión de clubes, equipos, jugadores
- ✅ Entrenamientos con asistencia
- ✅ Convocatorias para partidos
- ✅ Liga con calendario
- ✅ Registro de resultados (3 parejas)
- ✅ Clasificación automática
- ✅ Dashboard por roles
- ✅ Notificaciones básicas
- ✅ Diseño responsive mobile-first

### V2 - Próxima
- 📱 App móvil (React Native)
- 💬 Chat interno entre jugadores
- 📊 Estadísticas avanzadas por jugador
- 🏅 Ranking ELO individual
- 💰 Gestión económica y cuotas
- 📅 Gestión de pistas/horarios
- 🔔 Push notifications

### V3 - Futuro
- 🌐 Multi-club y multi-liga
- 🏆 Sistema de torneos
- 🛒 Marketplace de jugadores
- 📺 Streaming de partidos
- 🤖 IA para sugerir alineaciones
- 📈 Analytics avanzados

## 🛠️ Instalación

### Prerrequisitos
- Node.js >= 18
- PostgreSQL
- npm o yarn

### Pasos

```bash
# 1. Clonar e instalar
cd padelia
npm install

# 2. Configurar base de datos
cp .env.example .env
# Editar DATABASE_URL en .env

# 3. Generar cliente Prisma
npx prisma generate

# 4. Crear migraciones
npx prisma db push

# 5. Poblar datos de prueba
npm run db:seed

# 6. Iniciar desarrollo
npm run dev
```

### Cuentas de Prueba

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@padelia.com | password123 | Admin Global |
| manager@padelia.com | password123 | Responsable Club |
| coach@padelia.com | password123 | Entrenador |
| player1@padelia.com | password123 | Jugador |

## 📊 Sistema de Puntuación (Pádel)

- **Victoria por sets (2-1 o 3-0):** 3 puntos al ganador
- **Empate (1-2 o 1-1):** 1 punto a cada equipo
- **Desempate por:** Sets ganados → Juegos ganados → Diferencia de juegos

## 🏗️ Despliegue

### Vercel (Recomendado para MVP)
```bash
npm i -g vercel
vercel
```

### Railway (Con PostgreSQL)
```bash
# Railway detecta automáticamente Next.js
railway up
```

### Variables de Entorno para Producción
```env
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://tu-dominio.com
NEXTAUTH_SECRET=secreto-seguro-aqui
```

## 📐 Decisiones de Arquitectura

### Por qué Next.js API Routes vs NestJS

| Criterio | Next.js API Routes | NestJS |
|----------|-------------------|--------|
| **Velocidad MVP** | ✅ Más rápido | ❌ Más setup |
| **Complejidad** | ✅ Simple | ❌ Más boilerplate |
| **Escalabilidad** | ⚠️ Limitada | ✅ Modular |
| **Separación** | ⚠️ Monolito | ✅ Separado |
| **Deploy** | ✅ Vercel serverless | ⚠️ Necesita servidor |

**Decisión:** Next.js API Routes para MVP → Migrar a NestJS cuando se necesite microservicios.

### Preparación para Escalabilidad
- ORM Prisma preparado para cambio de DB
- API Routes con estructura REST para futura app móvil
- Autenticación JWT portable
- Componentes UI modulares y reutilizables
- Validación Zod compartida frontend/backend
</content>
<task_progress>
- [x] Crear package.json
- [x] Crear tsconfig.json
- [x] Crear configuraciones (next.config, tailwind, postcss)
- [x] Crear .env y .gitignore
- [x] Configurar Prisma y modelo de datos completo
- [x] Configurar autenticación con roles
- [x] Crear validaciones y tipos
- [x] Crear layout y providers
- [x] Crear componentes UI base
- [x] Crear Sidebar y navegación
- [x] Implementar Dashboard por roles
- [x] Implementar páginas de auth
- [x] Implementar API Routes
- [x] Crear seed de datos de prueba
- [x] Crear páginas de módulos
- [x] Documentación de arquitectura y roadmap
- [ ] Verificar estructura completa del proyecto
</task_progress>