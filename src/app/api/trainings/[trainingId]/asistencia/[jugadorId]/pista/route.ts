import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prismadb from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { trainingId: string; jugadorId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { pistaAsignada } = body;

    const existing = await prismadb.asistenciaEntrenamiento.findUnique({
      where: {
        entrenamientoId_jugadorId: {
          entrenamientoId: params.trainingId,
          jugadorId: params.jugadorId,
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Registro de asistencia no encontrado" }, { status: 404 });
    }

    if (existing.estado !== "CONFIRMADO" && pistaAsignada !== null) {
      return NextResponse.json({ error: "Solo jugadores confirmados pueden ser asignados a pista" }, { status: 400 });
    }

    if (pistaAsignada !== null && pistaAsignada !== undefined) {
      const courtCount = await prismadb.asistenciaEntrenamiento.count({
        where: {
          entrenamientoId: params.trainingId,
          pistaAsignada: pistaAsignada,
          estado: "CONFIRMADO",
        },
      });

      if (courtCount >= 4) {
        return NextResponse.json({ error: "La pista ya tiene 4 jugadores asignados" }, { status: 400 });
      }
    }

    const asistencia = await prismadb.asistenciaEntrenamiento.update({
      where: { id: existing.id },
      data: { pistaAsignada: pistaAsignada ?? null },
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

    return NextResponse.json(asistencia);
  } catch (error) {
    console.error("[ASISTENCIA_PISTA_PATCH]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}