# 📋 Resumen del Proyecto PadelIA

> **Última actualización:** 16 de junio de 2026

---

## 🎯 Descripción General

**PadelIA** es una plataforma SaaS para la gestión de equipos de pádel, entrenamientos y competiciones. Está diseñada para clubes de pádel con funcionalidades multi-tenant (cada club opera de forma independiente).

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Framework Web** | Next.js | ^13.5.0 (App Router) |
| **Lenguaje** | TypeScript | ^4.9.0 |
| **UI Framework** | React | ^18.2.0 |
| **Estilos** | Tailwind CSS | ^3.3.0 |
| **Componentes UI** | Radix UI + shadcn/ui | (Varios paquetes) |
| **Base de Datos** | SQLite | (via Prisma) |
| **ORM** | Prisma | ^4.16.0 |
| **Autenticación** | NextAuth.js | ^4.22.0 |
| **Hash de Contraseñas** | bcryptjs | ^2.4.3 |
| **Formularios** | React Hook Form + Zod | ^7.45.0 / ^3.21.0 |
| **Gráficas** | Recharts | ^2.7.0 |
| **Notificaciones Toast** | Sonner | ^0.6.0 |
| **Íconos** | Lucide React | ^0.244.0 |
| **Fechas** | date-fns | ^2.30.0 |

---

## 📦 Dependencias Principales

### Dependencias de Producción
| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `next` | ^13.5.0 | Framework full-stack con App Router |
| `react` / `react-dom` | ^18.2.0 | Librería UI |
| `@prisma/client` | ^4.16.0 | Cliente ORM para base de datos |
| `next-auth` | ^4.22.0 | Sistema de autenticación |
| `@next-auth/prisma-adapter` | ^1.0.6 | Adaptador Prisma para NextAuth |
| `bcryptjs` | ^2.4.3 | Hash de contraseñas |
| `react-hook-form` | ^7.45.0 | Gestión de formularios |
| `@hookform/resolvers` | ^3.1.0 | Resolvers de validación (Zod) |
| `zod` | ^3.21.0 | Validación de esquemas |
| `@radix-ui/react-dialog` | ^1.1.16 | Componente diálogo |
| `@radix-ui/react-alert-dialog` | ^1.1.16 | Alertas de confirmación |
| `@radix-ui/react-select` | ^2.3.0 | Select/dropdown |
| `@radix-ui/react-slot` | ^1.2.5 | Composición de componentes |
| `recharts` | ^2.7.0 | Gráficas y estadísticas |
| `sonner` | ^0.6.0 | Notificaciones toast |
| `date-fns` | ^2.30.0 | Manipulación de fechas |
| `lucide-react` | ^0.244.0 | Iconos |
| `class-variance-authority` | ^0.6.0 | Variantes de estilos |
| `clsx` | ^1.2.1 | Utilidad de clases |
| `tailwind-merge` | ^1.13.0 | Fusión de clases Tailwind |
| `tailwindcss-animate` | ^1.0.7 | Animaciones CSS |

### Dependencias de Desarrollo
| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `typescript` | ^4.9.0 | Type checking |
| `prisma` | ^4.16.0 | CLI de Prisma |
| `tailwindcss` | ^3.3.0 | Framework CSS utility-first |
| `postcss` | ^8.4.0 | Procesamiento CSS |
| `autoprefixer` | ^10.4.0 | Prefijos CSS automáticos |
| `eslint` / `eslint-config-next` | ^8.43.0 / ^13.5.0 | Linting |
| `ts-node` | ^10.9.2 | Ejecución de TypeScript (seed) |
| `@types/*` | ^18.x | Tipos TypeScript |

---

## 🗃️ Base de Datos (Schema Prisma)

**Proveedor:** SQLite

### Modelos (22 tablas)

| Modelo | Descripción |
|--------|-------------|
| `User` | Usuarios del sistema (roles: PLAYER, COACH, ADMIN, MANAGER) |
| `Account` | Cuentas OAuth (NextAuth) |
| `Session` | Sesiones de usuario (NextAuth) |
| `VerificationToken` | Tokens de verificación (NextAuth) |
| `Club` | Clubes de pádel (entidad principal multi-tenant) |
| `Team` | Equipos del club (categorías, niveles) |
| `Player` | Jugadores (ranking, nivel, mano dominante) |
| `Coach` | Entrenadores (especialización, certificaciones) |
| `Season` | Temporadas del club |
| `League` | Ligas dentro de una temporada |
| `Matchday` | Jornadas de competición |
| `Match` | Partidos (local vs visitante) |
| `MatchResult` | Resultados detallados (sets, tiebreaks, puntos) |
| `Convocation` | Convocatorias para partidos |
| `ConvocationPlayer` | Jugadores asignados a convocatorias |
| `Training` | Sesiones de entrenamiento |
| `TrainingPlayer` | Jugadores asignados a entrenamientos |
| `Attendance` | Control de asistencia a entrenamientos |
| `Standing` | Clasificaciones por liga/temporada |
| `ClubDeletionSnapshot` | Snapshot para borrado suave de clubes |
| `TrainingTemplate` | Plantillas de entrenamiento recurrentes |
| `Convocatoria` | Sistema de convocatorias propio (con parejas) |
| `ConvocatoriaJugador` | Jugadores en convocatorias (disponibilidad) |
| `Pareja` | Parejas dentro de una convocatoria |
| `Notification` | Notificaciones del sistema |

### Relaciones Principales
- **Club** → has many: Teams, Players, Coaches, Trainings, Convocatorias, Seasons
- **Team** → has many: Players, Matches (home/away), Convocatorias, Trainings, Standings
- **Player** → belongs to: User, Team, Club
- **Coach** → belongs to: User, Club; has many: Teams, Trainings
- **Match** → belongs to: Matchday; has one: MatchResult, Convocation
- **Training** → belongs to: Club, Team, Coach; has many: Attendances, Players
- **Convocatoria** → belongs to: Club, Team; has many: ConvocatoriaJugadores, Parejas
- **Season** → belongs to: Club; has many: Leagues, Standings

---

## 🗂️ Estructura de Archivos

```
padelia/
├── prisma/
│   ├── schema.prisma          # Schema de base de datos
│   ├── seed.ts                # Datos iniciales
│   └── cleanup-orphans.ts     # Limpieza de huérfanos
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── globals.css        # Estilos globales
│   │   ├── layout.tsx         # Layout raíz (Inter font, Providers)
│   │   ├── page.tsx           # Página principal
│   │   ├── providers.tsx      # Providers (NextAuth SessionProvider)
│   │   ├── api/               # API Routes
│   │   ├── auth/              # Páginas de autenticación
│   │   ├── clubs/             # Gestión de clubes
│   │   ├── convocations/      # Gestión de convocatorias
│   │   ├── dashboard/         # Panel principal
│   │   ├── league/            # Ligas y clasificaciones
│   │   ├── matches/           # Gestión de partidos
│   │   ├── notifications/     # Notificaciones
│   │   ├── players/           # Gestión de jugadores
│   │   ├── settings/          # Configuración
│   │   ├── teams/             # Gestión de equipos
│   │   └── trainings/         # Gestión de entrenamientos
│   ├── components/
│   │   ├── convocatorias/     # Componentes de convocatorias
│   │   ├── layout/            # Layout, Sidebar, Header
│   │   ├── trainings/         # Componentes de entrenamientos
│   │   └── ui/                # Componentes base (shadcn/ui)
│   ├── lib/
│   │   ├── auth.ts            # Configuración NextAuth
│   │   ├── notifications.ts   # Utilidades de notificaciones
│   │   ├── padel-levels.ts    # Niveles de pádel
│   │   ├── prisma.ts          # Instancia de Prisma
│   │   ├── utils.ts           # Utilidades generales
│   │   └── validations.ts     # Esquemas de validación Zod
│   └── types/
│       └── next-auth.d.ts     # Extensión de tipos NextAuth
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── postcss.config.js
├── package.json
└── .env.example
```

---

## 🛣️ Rutas de la Aplicación

### Páginas (Frontend)

| Ruta | Descripción |
|------|-------------|
| `/` | Página principal / Landing |
| `/auth/*` | Autenticación (login, registro, error) |
| `/dashboard` | Panel principal del usuario |
| `/clubs` | Gestión de clubes |
| `/teams` | Gestión de equipos |
| `/players` | Gestión de jugadores |
| `/convocations` | Convocatorias para partidos |
| `/trainings` | Gestión de entrenamientos |
| `/matches` | Gestión de partidos |
| `/league` | Ligas y clasificaciones |
| `/notifications` | Centro de notificaciones |
| `/settings` | Configuración de usuario |

### API Routes (Backend)

| Método | Ruta | Descripción |
|--------|------|-------------|
| **Auth** | | |
| POST | `/api/auth/[...nextauth]` | NextAuth (login, sesión) |
| POST | `/api/auth/register` | Registro de usuarios |
| **Clubs** | | |
| GET/POST | `/api/clubs` | Listar / Crear clubes |
| GET/PUT/DELETE | `/api/clubs/[clubId]` | CRUD de club específico |
| **Teams** | | |
| GET/POST | `/api/teams` | Listar / Crear equipos |
| GET/PUT/DELETE | `/api/teams/[teamId]` | CRUD de equipo específico |
| **Players** | | |
| GET/POST | `/api/players` | Listar / Crear jugadores |
| GET/PUT/DELETE | `/api/players/[playerId]` | CRUD de jugador específico |
| **Coaches** | | |
| GET/POST | `/api/coaches` | Listar / Crear entrenadores |
| **Convocatorias** | | |
| GET/POST | `/api/convocatorias` | Listar / Crear convocatorias |
| GET/PUT/DELETE | `/api/convocatorias/[id]` | CRUD de convocatoria |
| GET/POST | `/api/convocatorias/[id]/jugadores` | Gestionar jugadores convocados |
| GET/PUT | `/api/convocatorias/[id]/disponibilidad` | Disponibilidad de jugadores |
| GET | `/api/convocatorias/[id]/convocados` | Jugadores convocados |
| POST | `/api/convocatorias/[id]/enviar` | Enviar convocatoria |
| GET/POST | `/api/convocatorias/[id]/parejas` | Gestionar parejas |
| PUT/DELETE | `/api/convocatorias/[id]/parejas/[parejaId]` | CRUD de pareja |
| **Trainings** | | |
| GET/POST | `/api/trainings` | Listar / Crear entrenamientos |
| GET/PUT/DELETE | `/api/trainings/[trainingId]` | CRUD de entrenamiento |
| POST | `/api/trainings/apply-template` | Aplicar plantilla individual |
| POST | `/api/trainings/apply-templates` | Aplicar todas las plantillas |
| **Templates** | | |
| GET/POST | `/api/templates` | Listar / Crear plantillas |
| GET/PUT/DELETE | `/api/templates/[templateId]` | CRUD de plantilla |
| **Matches** | | |
| GET/POST | `/api/matches` | Listar / Crear partidos |
| GET/PUT/DELETE | `/api/matches/[id]` | CRUD de partido |
| **League** | | |
| GET/POST | `/api/league/standings` | Clasificaciones |
| **Users** | | |
| GET/POST | `/api/users` | Listar usuarios |
| GET | `/api/users/managers` | Listar managers |

---

## 🧩 Componentes UI (shadcn/ui)

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| AlertDialog | `ui/alert-dialog.tsx` | Diálogo de confirmación |
| Badge | `ui/badge.tsx` | Etiquetas/insignias |
| Button | `ui/button.tsx` | Botones |
| Calendar | `ui/calendar.tsx` | Selector de fechas |
| Card | `ui/card.tsx` | Tarjetas de contenido |
| Checkbox | `ui/checkbox.tsx` | Casillas de verificación |
| Dialog | `ui/dialog.tsx` | Diálogos modales |
| Input | `ui/input.tsx` | Campos de entrada |
| Popover | `ui/popover.tsx` | Contenedores flotantes |
| Select | `ui/select.tsx` | Selección desplegable |
| Sheet | `ui/sheet.tsx` | Paneles laterales |
| Skeleton | `ui/skeleton.tsx` | Estados de carga |
| Textarea | `ui/textarea.tsx` | Campos de texto largo |
| TimeInput | `ui/time-input.tsx` | Selector de hora |

### Componentes de Negocio

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| DashboardLayout | `layout/dashboard-layout.tsx` | Layout del panel |
| Header | `layout/header.tsx` | Cabecera |
| Sidebar | `layout/sidebar.tsx` | Barra lateral de navegación |
| GestionarJugadores | `convocatorias/gestionar-jugadores.tsx` | Gestionar jugadores en convocatorias |
| GestionarParejas | `convocatorias/gestionar-parejas.tsx` | Gestionar parejas en convocatorias |
| ApplyTemplateModal | `trainings/apply-template-modal.tsx` | Modal para aplicar plantillas |

---

## 🔐 Sistema de Autenticación

- **Proveedor:** NextAuth.js con estrategia JWT
- **Método:** Credenciales (email + contraseña)
- **Contraseñas:** Cifrado con bcryptjs
- **Adapter:** Prisma (almacena sesiones en DB)
- **Roles:** PLAYER, COACH, MANAGER, ADMIN
- **Páginas personalizadas:** `/auth/login`, `/auth/error`

### Datos en sesión JWT:
- `role` - Rol del usuario
- `clubId` - ID del club asociado
- `playerId` - ID del perfil de jugador
- `coachId` - ID del perfil de entrenador

---

## 📜 Scripts Disponibles

| Script | Comando | Descripción |
|--------|---------|-------------|
| Desarrollo | `npm run dev` | Iniciar servidor de desarrollo |
| Build | `npm run build` | Construir para producción |
| Start | `npm run start` | Iniciar servidor de producción |
| Lint | `npm run lint` | Verificar código con ESLint |
| DB Generate | `npm run db:generate` | Generar cliente Prisma |
| DB Push | `npm run db:push` | Sincronizar schema con DB |
| DB Migrate | `npm run db:migrate` | Crear migración |
| DB Migrate Prod | `npm run db:migrate:prod` | Aplicar migraciones en producción |
| DB Seed | `npm run db:seed` | Poblar base de datos con datos iniciales |
| DB Studio | `npm run db:studio` | Abrir Prisma Studio (GUI) |
| DB Reset | `npm run db:reset` | Resetear base de datos |
| DB Restore | `npm run db:restore` | Restaurar backup |

---

## 🎨 Configuración de Tailwind CSS

- **Dark mode:** Basado en clase (`class`)
- **Paleta personalizada:** Colores `padel-*` (tonos verdes para la temática de pádel)
- **Animaciones:** `accordion-down`, `accordion-up`, `fade-in`
- **Plugin:** `tailwindcss-animate`
- **Colores semánticos:** `primary`, `secondary`, `destructive`, `muted`, `accent`, `popover`, `card` (via CSS variables / shadcn/ui)

---

## 🔑 Características Principales del Negocio

1. **Multi-tenant por club** - Cada club tiene sus equipos, jugadores, entrenamientos
2. **Gestión de equipos** - Categorías, niveles, capitanes, entrenadores
3. **Sistema de convocatorias** - Crear convocatorias para partidos, gestionar parejas, disponibilidad
4. **Entrenamientos** - Crear sesiones, plantillas recurrentes, control de asistencia
5. **Ligas y partidos** - Temporadas, ligas, jornadas, partidos con resultados detallados
6. **Clasificaciones** - Standings con puntos, sets, juegos
7. **Notificaciones** - Sistema de notificaciones por usuario
8. **Borrado suave** - Campo `deletedAt` en modelos principales
9. **Backup/Restore** - Sistema de snapshots para clubes eliminados

---

## ⚙️ Configuración de Entorno

Ver `.env.example` para las variables de entorno requeridas:
- `DATABASE_URL` - URL de conexión a SQLite
- `NEXTAUTH_SECRET` - Secreto para NextAuth
- `NEXTAUTH_URL` - URL base de la aplicación

---

## 📊 Resumen de Estadísticas

| Métrica | Cantidad |
|---------|----------|
| Modelos en base de datos | 22 |
| Rutas de API | ~25 |
| Páginas frontend | ~12 |
| Componentes UI | 14 |
| Componentes de negocio | 6 |
| Archivos de configuración | 6 |
| Dependencias de producción | 17 |
| Dependencias de desarrollo | 8 |