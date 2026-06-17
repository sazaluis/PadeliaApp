import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prismadb from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || !["GLOBAL_ADMIN", "CLUB_MANAGER"].includes(role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { addPlayerIds, removePlayerIds } = body;

    if (!Array.isArray(addPlayerIds) && !Array.isArray(removePlayerIds)) {
      return NextResponse.json(
        { error: "Se requiere addPlayerIds y/o removePlayerIds como arrays" },
        { status: 400 }
      );
    }

    const convocatoria = await prismadb.convocatoria.findUnique({
      where: { id: params.id },
      include: {
        team: { select: { id: true, name: true } },
        jugadores: {
          select: { id: true, playerId: true },
        },
      },
    });

    if (!convocatoria) {
      return NextResponse.json(
        { error: "Convocatoria no encontrada" },
        { status: 404 }
      );
    }

    if (convocatoria.status !== "ENVIADA") {
      return NextResponse.json(
        { error: "Solo se pueden añadir/eliminar jugadores de una convocatoria enviada" },
        { status: 400 }
      );
    }

    const existingPlayerIds = convocatoria.jugadores.map((j) => j.playerId);

    // Add new players
    const addedPlayers: any[] = [];
    if (Array.isArray(addPlayerIds) && addPlayerIds.length > 0) {
      // Filter out players already in the convocatoria
      const newPlayerIds = addPlayerIds.filter(
        (pid: string) => !existingPlayerIds.includes(pid)
      );

      if (newPlayerIds.length > 0) {
        // Verify these players exist and are active
        const validPlayers = await prismadb.player.findMany({
          where: {
            id: { in: newPlayerIds },
            isActive: true,
            deletedAt: null,
          },
          include: {
            user: { select: { id: true, name: true, surname: true } },
          },
        });

        // Create ConvocatoriaJugador records for new players
        for (const player of validPlayers) {
          const created = await prismadb.convocatoriaJugador.create({
            data: {
              convocatoriaId: params.id,
              playerId: player.id,
              disponibilidad: "PENDIENTE",
            },
          });
          addedPlayers.push({ ...created, player });

          // Send notification to the newly added player
          if (player.user) {
            const matchDateFormatted = new Intl.DateTimeFormat("es-ES", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }).format(convocatoria.matchDate);

            await createNotification({
              userId: player.user.id,
              type: "CONVOCATORIA",
              title: "Convocatoria añadida",
              message: `Has sido añadido a la convocatoria ${convocatoria.team.name} vs ${convocatoria.rival} el ${matchDateFormatted}. Confirma tu disponibilidad.`,
              link: "/convocatorias",
            });
          }
        }
      }
    }

    // Remove players
    if (Array.isArray(removePlayerIds) && removePlayerIds.length > 0) {
      // Find ConvocatoriaJugador records to remove
      const toRemove = convocatoria.jugadores.filter((j) =>
        removePlayerIds.includes(j.playerId)
      );

      if (toRemove.length > 0) {
        await prismadb.convocatoriaJugador.deleteMany({
          where: {
            id: { in: toRemove.map((j) => j.id) },
          },
        });
      }
    }

    // Fetch updated convocatoria
    const updated = await prismadb.convocatoria.findUnique({
      where: { id: params.id },
      include: {
        team: { select: { id: true, name: true, category: true } },
        jugadores: {
          include: {
            player: {
              include: {
                user: { select: { name: true, surname: true, id: true } },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        parejas: {
          orderBy: { numero: "asc" },
          include: {
            jugador1: { select: { id: true, userId: true } },
            jugador2: { select: { id: true, userId: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      added: addedPlayers.length,
      removed: Array.isArray(removePlayerIds) ? removePlayerIds.length : 0,
      convocatoria: updated,
    });
  } catch (error) {
    console.error("[CONVOCATORIA_JUGADORES]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}