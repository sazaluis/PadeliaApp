# Implementación del Selector de Club

## Resumen de Cambios

### 1. Corrección del Error de Prisma
**Archivo**: `padelia/src/app/api/leagues/route.ts`

**Problema**: El modelo `League` no tiene un campo `clubId` directo. La relación es a través de `Season` → `clubId`.

**Solución**: Cambiado el filtro de:
```typescript
where.clubId = userClubId;  // ❌ Incorrecto
```

A:
```typescript
where.season = { clubId: userClubId };  // ✅ Correcto
```

Esto aplica para:
- Filtrado de usuarios normales (no admin)
- Filtrado de administradores globales cuando seleccionan un club

### 2. Implementación del Selector de Club en Páginas

#### Páginas ACTUALIZADAS con selector para GLOBAL_ADMIN:
- ✅ **Clubs** (`/clubs`): Gestión de clubes (no requiere selector, es la página principal de clubs)
- ✅ **Teams** (`/teams`): Ahora tiene selector de club para administradores
- ✅ **Players** (`/players`): Ahora tiene selector de club para administradores
- ✅ **Trainings** (`/trainings`): Ya tenía selector implementado
- ✅ **Convocations** (`/convocations`): Ya tenía selector implementado
- ✅ **Matches** (`/matches`): Ahora tiene selector de club para administradores
- ✅ **League** (`/league`): Ahora tiene selector de club para administradores
- ✅ **Notifications** (`/notifications`): Ahora tiene selector de club para administradores

#### Páginas que NO necesitan selector:
- ⚪ **Dashboard** (`/dashboard`): Ya tiene selector implementado
- ⚪ **Settings** (`/settings`): Configuración personal del usuario

## Comportamiento por Rol

### GLOBAL_ADMIN (Administrador Global)
- Ve el selector de club en: Teams, Players, Trainings, Convocations, Matches, League, Notifications
- Puede cambiar entre clubs libremente
- Los datos se filtran según el club seleccionado
- En Clubs ve todos los clubs (es la página de gestión de clubs)

### CLUB_MANAGER (Responsable de Club)
- NO ve el selector (se asigna automáticamente a su club)
- Solo ve datos de su club asignado

### TEAM_CAPTAIN, COACH, PLAYER
- NO ven el selector
- Solo ven datos de su club asignado

## Archivos Modificados

1. `padelia/src/app/api/leagues/route.ts` - Corrección del filtro Prisma
2. `padelia/src/app/matches/page.tsx` - Agregado selector de club
3. `padelia/src/app/league/page.tsx` - Agregado selector de club
4. `padelia/src/app/teams/page.tsx` - Agregado selector de club
5. `padelia/src/app/players/page.tsx` - Agregado selector de club
6. `padelia/src/app/notifications/page.tsx` - Agregado selector de club

## Características del Selector

- **Componente**: Select de shadcn/ui
- **Icono**: Building2 de lucide-react
- **Ancho**: 250px
- **Formato**: "Nombre del Club - Ciudad"
- **Comportamiento**: 
  - Solo visible para GLOBAL_ADMIN
  - Se carga automáticamente el primer club si no hay uno seleccionado
  - Al cambiar de club, se actualizan todos los datos de la página

## Testing

Para probar la implementación:

1. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Verificar que no aparece el error de Prisma al acceder a:
   - `/league`
   - Cualquier endpoint que llame a `/api/leagues`

3. Verificar que el selector de club aparece para GLOBAL_ADMIN en:
   - `/teams`
   - `/players`
   - `/trainings`
   - `/convocations`
   - `/matches`
   - `/league`
   - `/notifications`

4. Verificar que al cambiar de club se actualizan los datos

5. Verificar que usuarios no-admin NO ven el selector y solo ven datos de su club

## Notas Técnicas

- El selector usa el componente `Select` de shadcn/ui
- Icono `Building2` de lucide-react para identificación visual
- El estado del selector se sincroniza con la sesión del usuario
- Para usuarios no-admin, se usa su `clubId` de la sesión
- Para admin, se carga la lista completa de clubs desde `/api/clubs`