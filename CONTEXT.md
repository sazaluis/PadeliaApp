# 🎾 PadelIA — Contexto del Proyecto para AI Agent

> Léeme antes de cualquier tarea. Contiene todo lo necesario para trabajar sin revisar el proyecto entero.

---

## 🎯 Qué es PadelIA

Aplicación web SaaS **multi-tenant** para gestión de clubes de pádel.

**Usuario principal:** Gestor de club (rol `MANAGER`)

**Funcionalidades clave:**
- Gestionar equipos de competición (plantillas, entrenadores, capitanes)
- Planificar entrenamientos con plantillas recurrentes y control de asistencia
- Organizar competiciones: temporadas → ligas → jornadas → partidos
- Hacer convocatorias para partidos (parejas, disponibilidad de jugadores)
- Enviar notificaciones/correos para confirmación de asistencia
- Registrar resultados de partidos en tiempo real
- Subir fotos de partidos
- Seguimiento de clasificaciones de liga

---

## 🛠️ Stack Técnico

| Qué | Cómo |
|-----|------|
| Framework | Next.js 13.5 (App Router) |
| Lenguaje | TypeScript 4.9 |
| UI | React 18 + Tailwind CSS 3.3 + shadcn/ui + Radix UI |
| Base de datos | SQLite (via Prisma 4.16) |
| Auth | NextAuth.js 4.22 (JWT + Credentials) |
| Formularios | React Hook Form 7 + Zod 3.21 |
| Gráficas | Recharts 2.7 |
| Iconos | Lucide React |
| Toasts | Sonner |
| Fechas | date-fns 2.30 |

---

## 🗂️ Estructura de Carpetas Relevante

```
src/
├── app/
│   ├── api/                   ← API Routes (Next.js Route Handlers)
│   │   ├── clubs/
│   │   ├── teams/
│   │   ├── players/
│   │   ├── coaches/
│   │   ├── convocatorias/
│   │   ├── trainings/
│   │   ├── templates/
│   │   ├── matches/
│   │   ├── league/
│   │   └── users/
│   ├── clubs/                 ← Página de gestión de clubes
│   ├── teams/                 ← Gestión de equipos
│   ├── players/               ← Gestión de jugadores
│   ├── convocations/          ← Convocatorias para partidos
│   ├── trainings/             ← Entrenamientos y plantillas
│   ├── matches/               ← Partidos y resultados
│   ├── league/                ← Clasificaciones
│   ├── notifications/         ← Centro de notificaciones
│   └── dashboard/             ← Panel principal
├── components/
│   ├── ui/                    ← Componentes base shadcn/ui
│   ├── layout/                ← DashboardLayout, Sidebar, Header
│   ├── convocatorias/         ← GestionarJugadores, GestionarParejas
│   └── trainings/             ← ApplyTemplateModal
├── lib/
│   ├── prisma.ts              ← Instancia singleton de Prisma
│   ├── auth.ts                ← Config NextAuth
│   ├── validations.ts         ← Esquemas Zod reutilizables
│   ├── notifications.ts       ← Utilidades de notificaciones
│   └── utils.ts               ← cn(), helpers generales
└── types/
    └── next-auth.d.ts         ← Extensión de tipos de sesión
prisma/
└── schema.prisma              ← Fuente de verdad del modelo de datos
```

---

## 🗄️ Modelos de Base de Datos (Prisma + SQLite)

### Modelos principales

```
Club          → entidad raíz multi-tenant
User          → roles: PLAYER | COACH | MANAGER | ADMIN
Player        → perfil de jugador (ranking, nivel, mano dominante)
Coach         → perfil de entrenador (especialización, certificaciones)
Team          → equipo del club (categoría, nivel, capitán)
Season        → temporada del club
League        → liga dentro de una temporada
Matchday      → jornada de competición
Match         → partido (local vs visitante)
MatchResult   → resultado detallado (sets, tiebreaks, puntos)
Training      → sesión de entrenamiento
TrainingTemplate → plantilla de entrenamiento recurrente
Attendance    → asistencia a entrenamiento
Convocatoria  → convocatoria para un partido
ConvocatoriaJugador → jugador en una convocatoria (disponibilidad)
Pareja        → pareja de jugadores dentro de una convocatoria
Standing      → clasificación (liga/temporada)
Notification  → notificación de usuario
ClubDeletionSnapshot → snapshot para restaurar clubes eliminados
```

### Relaciones clave

```
Club → Teams, Players, Coaches, Trainings, Convocatorias, Seasons
Team → Players, Matches, Convocatorias, Trainings, Standings
Player → User, Team, Club
Match → Matchday, MatchResult, Convocation
Training → Club, Team, Coach, Attendances
Convocatoria → Club, Team, ConvocatoriaJugadores, Parejas
Season → Club, Leagues, Standings
```

### Soft-delete

Los modelos principales (`Club`, `Team`, `Player`) tienen campo `deletedAt: DateTime?`.  
- Registros con `deletedAt != null` están eliminados (no se muestran, no participan en consultas normales)
- Se pueden restaurar. `ClubDeletionSnapshot` guarda el estado antes de borrar un club para restauración completa con sus relaciones.

---

## 🔐 Autenticación y Roles

- **Estrategia:** JWT (no sesiones en DB)
- **Login:** email + contraseña (bcryptjs)
- **Roles:**
  - `PLAYER` — jugador del club
  - `COACH` — entrenador
  - `MANAGER` — gestor del club (usuario principal del producto)
  - `ADMIN` — administrador de plataforma

**Datos en el token JWT:**
```ts
session.user.role     // PLAYER | COACH | MANAGER | ADMIN
session.user.clubId   // ID del club asociado
session.user.playerId // ID del perfil de jugador (si aplica)
session.user.coachId  // ID del perfil de entrenador (si aplica)
```

**Protección de rutas:** verificar sesión en Server Components o middleware. Las API routes deben comprobar `session.user.clubId` para garantizar aislamiento multi-tenant.

---

## 🌐 Convenciones de API

Todas las rutas viven en `src/app/api/`. Patrón estándar:

```
GET  /api/[recurso]           → listar (filtrar por clubId de la sesión)
POST /api/[recurso]           → crear
GET  /api/[recurso]/[id]      → obtener uno
PUT  /api/[recurso]/[id]      → actualizar
DELETE /api/[recurso]/[id]    → eliminar (soft-delete si aplica)
```

**Regla crítica de multi-tenant:** Toda consulta debe incluir `where: { clubId: session.user.clubId }` para evitar acceso cruzado entre clubes.

---

## 🧩 Convenciones de Componentes UI

- **Base:** siempre usar componentes de `src/components/ui/` (shadcn/ui)
- **Estilos:** Tailwind CSS + `cn()` de `src/lib/utils.ts` para clases condicionales
- **Iconos:** Lucide React
- **Toasts:** `sonner` — importar `toast` de `"sonner"`
- **Formularios:** React Hook Form + resolver Zod (`src/lib/validations.ts`)
- **Modales:** `Dialog` o `AlertDialog` de Radix UI (ya instalados)
- **Tema:** colores `padel-*` (verdes), dark mode por clase

---

## 🎛️ Guía de Campos de Formulario — Qué Usar Para Cada Tipo

> **Regla:** Nunca inventar un control nuevo. Buscar primero en esta tabla.  
> Si el tipo de campo no está aquí, preguntar antes de crear algo custom.

### Tabla de referencia

| Tipo de dato | Componente | Import | Props clave |
|---|---|---|---|
| **Hora** | `TimeInput` | `@/components/ui/time-input` | `value: string` ("HH:MM"), `onChange: (v: string) => void` |
| **Fecha** | `Popover` + `Calendar` | `@/components/ui/popover`, `@/components/ui/calendar` | Ver patrón más abajo |
| **Teléfono** | `Input` | `@/components/ui/input` | `type="tel"` |
| **Email** | `Input` | `@/components/ui/input` | `type="email"` |
| **Número entero** | `Input` | `@/components/ui/input` | `type="number"` + `step={1}` |
| **Precio / decimal** | `Input` | `@/components/ui/input` | `type="number"` + `step={0.01}` + `min={0}` |
| **Texto corto** | `Input` | `@/components/ui/input` | `type="text"` |
| **Texto largo** | `Textarea` | `@/components/ui/textarea` | `rows={3}` por defecto |
| **Selector (1 opción)** | `Select` | `@/components/ui/select` | Ver patrón más abajo |
| **Checkbox** | `Checkbox` | `@/components/ui/checkbox` | `checked`, `onCheckedChange` |
| **Toggle on/off** | `Switch` | `@/components/ui/switch` | `checked`, `onCheckedChange` |

---

### Patrones de uso

#### ⏰ Hora — `TimeInput`
Siempre `TimeInput`. Nunca `<input type="time">` suelto.  
Incrementa/decrementa en bloques de 15 min. `addHourAndHalf(time)` calcula hora fin automáticamente.

```tsx
import { TimeInput, addHourAndHalf } from "@/components/ui/time-input";

<TimeInput
  id="startTime"
  value={startTime}           // "HH:MM"
  onChange={(v) => {
    setStartTime(v);
    setEndTime(addHourAndHalf(v)); // rellenar hora fin automáticamente
  }}
/>
```

---

#### 📅 Fecha — `Popover` + `Calendar`
Nunca `<input type="date">` nativo. Siempre el combo Popover + Calendar de shadcn/ui.

```tsx
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline" className="w-full justify-start text-left font-normal">
      <CalendarIcon className="mr-2 h-4 w-4" />
      {date ? format(date, "PPP", { locale: es }) : "Seleccionar fecha"}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-auto p-0">
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      locale={es}
      initialFocus
    />
  </PopoverContent>
</Popover>
```

---

#### 📋 Selector — `Select`
Para listas de opciones fijas. Nunca `<select>` HTML nativo.

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

<Select value={value} onValueChange={onChange}>
  <SelectTrigger>
    <SelectValue placeholder="Seleccionar..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="opcion1">Opción 1</SelectItem>
    <SelectItem value="opcion2">Opción 2</SelectItem>
  </SelectContent>
</Select>
```

---

#### ✅ Checkbox con label
```tsx
import { Checkbox } from "@/components/ui/checkbox";

<div className="flex items-center gap-2">
  <Checkbox id="activo" checked={activo} onCheckedChange={setActivo} />
  <label htmlFor="activo" className="text-sm font-medium leading-none">
    Activo
  </label>
</div>
```

---

### Reglas generales de formulario

1. **Labels siempre encima del campo**, nunca como placeholder único.
2. **Placeholder** solo como ejemplo del formato esperado (ej: `"612 345 678"`, `"precio sin IVA"`).
3. **Mensajes de error** debajo del campo, en `text-sm text-destructive`.
4. **Campos requeridos** marcados con `*` en el label, validados en Zod.
5. **Botones en formulario:**
   - Acción principal → `<Button type="submit">` (variante `default`)
   - Cancelar → `<Button type="button" variant="outline">`
   - Eliminar / acción destructiva → `<Button variant="destructive">`
   - Acción secundaria sin peso visual → `<Button variant="ghost">`
6. **Ancho de campos:** usar `w-full` dentro de un grid/flex. No mezclar anchos fijos con responsivos.
7. **Layout de formulario:** `grid grid-cols-1 gap-4` o `grid grid-cols-2 gap-4` para formularios en modal.

---

## ⚠️ Decisiones de Diseño Importantes

1. **SQLite en desarrollo, preparado para PostgreSQL en producción** — no usar funciones SQL específicas de Postgres.
2. **App Router de Next.js 13** — usar `route.ts` para API, no `pages/api/`. Hooks de cliente en archivos con `"use client"`.
3. **Prisma singleton** — siempre importar desde `src/lib/prisma.ts`, nunca instanciar `PrismaClient` directamente.
4. **Validación con Zod** — los esquemas reutilizables van en `src/lib/validations.ts`.
5. **Soft-delete** — nunca hacer `DELETE` real en Club/Team/Player; actualizar `deletedAt = new Date()`.
6. **Multi-tenant estricto** — cada query debe filtrar por `clubId`; no existe vista global de datos entre clubes.

---

## 📋 Comandos Útiles

```bash
npm run dev              # Servidor de desarrollo
npm run db:push          # Sincronizar schema Prisma con DB (sin migración)
npm run db:migrate       # Crear y aplicar migración
npm run db:studio        # GUI de Prisma Studio (ver/editar datos)
npm run db:seed          # Poblar DB con datos de prueba
npm run db:reset         # Resetear DB completa
npm run build            # Build de producción
```

---

## 🚧 Estado Actual del Proyecto

- ✅ CRUD completo de: clubes, equipos, jugadores, entrenadores
- ✅ Sistema de convocatorias con gestión de parejas y disponibilidad
- ✅ Entrenamientos con plantillas recurrentes y asistencia
- ✅ Ligas, jornadas y partidos con resultados detallados
- ✅ Clasificaciones (standings)
- ✅ Notificaciones internas
- ✅ Soft-delete y restauración de clubes (con snapshot)
- ✅ Autenticación completa (login, registro, roles, JWT)
- 🔲 Envío de correos para convocatorias (infraestructura pendiente)
- 🔲 Subida de fotos de partidos
- 🔲 Registro de resultados en tiempo real (mobile-friendly)
