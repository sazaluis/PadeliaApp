import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prismadb from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { trainingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { jugadorId, equipoOrigenId } = body;

    if (!jugadorId || !equipoOrigenId) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    const training = await prismadb.training.findUnique({
      where: { id: params.trainingId },
      include: { team: { include: { club: true } } },
    });

    if (!training) {
      return NextResponse.json({ error: "Entrenamiento no encontrado" }, { status: 404 });
    }

    const player = await prismadb.player.findUnique({
      where: { id: jugadorId },
      include: { team: true },
    });

    if (!player) {
      return NextResponse.json({ error: "Jugador no encontrado" }, { status: 404 });
    }

    if (player.teamId === training.teamId) {
      return NextResponse.json({ error: "El jugador ya pertenece al equipo del entrenamiento" }, { status: 400 });
    }

    if (player.clubId !== training.team.clubId) {
      return NextResponse.json({ error: "El jugador no pertenece al mismo club" }, { status: 400 });
    }

    const existing = await prismadb.asistenciaEntrenamiento.findUnique({
      where: {
        entrenamientoId_jugadorId: {
          entrenamientoId: params.trainingId,
          jugadorId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "El jugador ya está registrado en este entrenamiento" }, { status: 400 });
    }

    const asistencia = await prismadb.asistenciaEntrenamiento.create({
      data: {
        entrenamientoId: params.trainingId,
        jugadorId,
        estado: "PENDIENTE",
        esInvitado: true,
        equipoOrigenId,
      },
      include: {
        jugador: {
          include: {
            user: { select: { name: true, surname: true } },
            team: { select: { id: true, name: true, category: true } },
          },
        },
        equipoOrigen: { select: { id: true, name: true, category: true } },
      },
    });

    return NextResponse.json(asistencia, { status: 201 });
  } catch (error) {
    console.error("[ASISTENCIA_INVITADO_POST]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}