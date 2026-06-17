import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prismadb from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const convocatoria = await prismadb.convocatoria.findUnique({
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

    if (!convocatoria) {
      return NextResponse.json({ error: "Convocatoria no encontrada" }, { status: 404 });
    }

    return NextResponse.json(convocatoria);
  } catch (error) {
    console.error("[CONVOCATORIA_GET]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== "GLOBAL_ADMIN" && (session.user as any).role !== "CLUB_MANAGER")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userName = [session.user?.name, (session.user as any)?.surname].filter(Boolean).join(" ").trim() || session.user?.email || "Desconocido";
    const userId = session.user?.id;

    const convocatoria = await prismadb.convocatoria.findUnique({
      where: { id: params.id },
    });

    if (!convocatoria) {
      return NextResponse.json({ error: "Convocatoria no encontrada" }, { status: 404 });
    }

    const body = await req.json();
    const { teamId, rival, matchDate, deadline } = body;

    // Validate dates: deadline must be before matchDate
    if (matchDate || deadline) {
      const matchDateObj = matchDate ? new Date(matchDate) : convocatoria.matchDate;
      const deadlineObj = deadline ? new Date(deadline) : convocatoria.deadline;
      if (deadlineObj >= matchDateObj) {
        return NextResponse.json({ error: "La fecha límite debe ser anterior a la fecha del partido" }, { status: 400 });
      }
    }

    const data: any = {
      lastModifiedBy: userName,
      lastModifiedByUserId: userId,
    };
    if (rival !== undefined) data.rival = rival;
    if (matchDate !== undefined) data.matchDate = new Date(matchDate);
    if (deadline !== undefined) data.deadline = new Date(deadline);

    // If convocatoria is ENVIADA, only allow editing rival, matchDate and deadline (no team change)
    if (convocatoria.status !== "BORRADOR") {
      if (teamId !== undefined && teamId !== convocatoria.teamId) {
        return NextResponse.json({ error: "No se puede cambiar el equipo de una convocatoria ya enviada" }, { status: 400 });
      }

      const updated = await prismadb.convocatoria.update({
        where: { id: params.id },
        data,
        include: {
          team: { select: { id: true, name: true, category: true } },
          jugadores: {
            include: {
              player: {
                include: {
                  user: { select: { name: true, surname: true } },
                },
              },
            },
          },
        },
      });

      return NextResponse.json(updated);
    }

    // If teamId changed (BORRADOR only), delete old jugadores and create new ones for the new team
    if (teamId !== undefined && teamId !== convocatoria.teamId) {
      data.teamId = teamId;
      
      // Delete existing jugadores
      await prismadb.convocatoriaJugador.deleteMany({
        where: { convocatoriaId: params.id },
      });

      // Create new jugadores for the new team
      const players = await prismadb.player.findMany({
        where: { teamId, isActive: true, deletedAt: null },
        select: { id: true },
      });

      // Update the convocatoria with new team and create new jugadores
      const updated = await prismadb.convocatoria.update({
        where: { id: params.id },
        data: {
          ...data,
          jugadores: {
            create: players.map((p) => ({
              playerId: p.id,
              disponibilidad: "PENDIENTE",
            })),
          },
        },
        include: {
          team: { select: { id: true, name: true, category: true } },
          jugadores: {
            include: {
              player: {
                include: {
                  user: { select: { name: true, surname: true } },
                },
              },
            },
          },
        },
      });

      return NextResponse.json(updated);
    }

    const updated = await prismadb.convocatoria.update({
      where: { id: params.id },
      data,
      include: {
        team: { select: { id: true, name: true, category: true } },
        jugadores: {
          include: {
            player: {
              include: {
                user: { select: { name: true, surname: true } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[CONVOCATORIA_PATCH]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "GLOBAL_ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const convocatoria = await prismadb.convocatoria.findUnique({
      where: { id: params.id },
    });

    if (!convocatoria) {
      return NextResponse.json({ error: "Convocatoria no encontrada" }, { status: 404 });
    }

    if (convocatoria.status !== "BORRADOR") {
      return NextResponse.json({ error: "Solo se puede eliminar convocatorias en estado BORRADOR" }, { status: 400 });
    }

    await prismadb.convocatoria.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CONVOCATORIA_DELETE]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}