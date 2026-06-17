import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prismadb from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clubId = searchParams.get("clubId");

    if (!clubId) {
      return NextResponse.json({ error: "clubId es obligatorio" }, { status: 400 });
    }

    const convocatorias = await prismadb.convocatoria.findMany({
      where: { clubId },
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
          orderBy: { createdAt: "asc" },
        },
        parejas: {
          include: {
            jugador1: { select: { id: true, userId: true } },
            jugador2: { select: { id: true, userId: true } },
          },
          orderBy: { numero: "asc" },
        },
      },
      orderBy: { matchDate: "desc" },
    });

    const result = convocatorias.map((c) => ({
      ...c,
      confirmados: c.jugadores.filter((j) => j.disponibilidad === "SI").length,
      totalJugadores: c.jugadores.length,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("[CONVOCATORIAS_GET]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const role = (session.user as any).role;
    if (!["GLOBAL_ADMIN", "CLUB_MANAGER"].includes(role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { clubId, teamId, rival, matchDate, deadline, numParejas } = await req.json();

    if (!clubId || !teamId || !rival || !matchDate || !deadline) {
      return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
    }

    const numParejasVal = typeof numParejas === "number" && numParejas >= 1 && numParejas <= 5 ? numParejas : 3;

    // Validate dates
    const matchDateObj = new Date(matchDate);
    const deadlineObj = new Date(deadline);
    if (deadlineObj >= matchDateObj) {
      return NextResponse.json({ error: "La fecha límite debe ser anterior a la fecha del partido" }, { status: 400 });
    }

    // Get all active players from the team
    const players = await prismadb.player.findMany({
      where: { teamId, isActive: true, deletedAt: null },
      select: { id: true },
    });

    // Buscar un equipo rival del mismo club para el awayTeamId
    const rivalTeam = await prismadb.team.findFirst({
      where: { clubId, id: { not: teamId }, isActive: true, deletedAt: null },
      select: { id: true },
    });

    // Auto-crear el partido asociado a la convocatoria
    const match = await prismadb.match.create({
      data: {
        matchDate: matchDateObj,
        homeTeamId: teamId,
        awayTeamId: rivalTeam?.id || teamId, // Si no hay rival en el club, usar el mismo equipo
        status: "SCHEDULED",
      },
    });

    const convocatoria = await prismadb.convocatoria.create({
      data: {
        clubId,
        teamId,
        rival,
        matchDate: matchDateObj,
        deadline: deadlineObj,
        numParejas: numParejasVal,
        matchId: match.id,
        jugadores: {
          create: players.map((p) => ({
            playerId: p.id,
            disponibilidad: "PENDIENTE",
          })),
        },
        parejas: {
          create: Array.from({ length: numParejasVal }, (_, i) => ({
            numero: i + 1,
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
        parejas: {
          orderBy: { numero: "asc" },
          include: {
            jugador1: { select: { id: true, userId: true } },
            jugador2: { select: { id: true, userId: true } },
          },
        },
      },
    });

    return NextResponse.json({ ...convocatoria, matchId: match.id }, { status: 201 });
  } catch (error) {
    console.error("[CONVOCATORIAS_POST]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
