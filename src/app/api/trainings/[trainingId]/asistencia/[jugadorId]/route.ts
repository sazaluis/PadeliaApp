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
    const { estado } = body;

    if (!["PENDIENTE", "CONFIRMADO", "AUSENTE"].includes(estado)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    const existing = await prismadb.asistenciaEntrenamiento.findUnique({
      where: {
        entrenamientoId_jugadorId: {
          entrenamientoId: params.trainingId,
          jugadorId: params.jugadorId,
        },
      },
    });

    let asistencia;
    if (existing) {
      asistencia = await prismadb.asistenciaEntrenamiento.update({
        where: { id: existing.id },
        data: { estado },
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
    } else {
      asistencia = await prismadb.asistenciaEntrenamiento.create({
        data: {
          entrenamientoId: params.trainingId,
          jugadorId: params.jugadorId,
          estado,
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
    }

    return NextResponse.json(asistencia);
  } catch (error) {
    console.error("[ASISTENCIA_PATCH]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}