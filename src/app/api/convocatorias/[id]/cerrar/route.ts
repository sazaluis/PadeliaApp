import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prismadb from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== "GLOBAL_ADMIN" && (session.user as any).role !== "CLUB_MANAGER")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const convocatoria = await prismadb.convocatoria.findUnique({
      where: { id: params.id },
      include: {
        jugadores: true,
        parejas: true,
      },
    });

    if (!convocatoria) {
      return NextResponse.json({ error: "Convocatoria no encontrada" }, { status: 404 });
    }

    if (convocatoria.status !== "ENVIADA") {
      return NextResponse.json({ error: "Solo se pueden cerrar convocatorias en estado ENVIADA" }, { status: 400 });
    }

    // Validar que todos los jugadores hayan confirmado (no estén en PENDIENTE)
    const pendientes = convocatoria.jugadores.filter((j) => j.disponibilidad === "PENDIENTE");
    if (pendientes.length > 0) {
      return NextResponse.json({
        error: `Hay ${pendientes.length} jugadores sin confirmar disponibilidad`,
        pendientes: pendientes.map((j) => j.playerId),
      }, { status: 400 });
    }

    // Validar que todas las parejas estén asignadas (tengan jugador1 y jugador2)
    const numParejas = convocatoria.parejas.length;
    const parejasIncompletas = convocatoria.parejas.filter((p) => !p.jugador1Id || !p.jugador2Id);
    if (parejasIncompletas.length > 0) {
      return NextResponse.json({
        error: `Hay ${parejasIncompletas.length} parejas sin asignar`,
        parejasIncompletas: parejasIncompletas.map((p) => p.numero),
      }, { status: 400 });
    }

    // Cerrar la convocatoria
    const updated = await prismadb.convocatoria.update({
      where: { id: params.id },
      data: { status: "CERRADA" },
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

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[CONVOCATORIA_CERRAR]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}