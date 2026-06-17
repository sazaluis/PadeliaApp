# Instrucciones del Proyecto PadelIA

## Lectura obligatoria al inicio de cada tarea

**SIEMPRE** lee el archivo `context.md` en la raíz del proyecto antes de empezar cualquier tarea. Este archivo contiene información contextual actualizada sobre el estado del proyecto, decisiones arquitectónicas, y convenciones que debes seguir.

```
1. Leer `context.md`
2. Leer los archivos relevantes para la tarea
3. Ejecutar los cambios
```

## Convenciones del Proyecto

- **Framework:** Next.js 13 (App Router) con TypeScript
- **Base de datos:** SQLite con Prisma ORM
- **Autenticación:** NextAuth.js con JWT
- **UI:** Tailwind CSS + shadcn/ui (Radix UI)
- **Idioma del código:** Comentarios y nombres en español cuando se refieren a negocio (convocatorias, parejas, jugadores)
- **Path alias:** `@/` equivale a `./src/`

## Reglas Generales

1. No instales dependencias nuevas sin confirmarlo primero
2. Mantén la consistencia con el estilo de código existente
3. Usa `replace_in_file` para cambios pequeños, `write_to_file` para archivos nuevos o reestructuraciones completas
4. Verifica que los cambios no rompan la estructura de Prisma antes de modificar modelos