import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prismadb from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; parejaId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== "GLOBAL_ADMIN" && (session.user as any).role !== "CLUB_MANAGER")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { jugador1Id, jugador2Id } = await req.json();

    // Verify convocatoria exists
    const convocatoria = await prismadb.convocatoria.findUnique({
      where: { id: params.id },
      include: {
        jugadores: {
          where: { disponibilidad: "SI" },
          select: { playerId: true },
        },
        parejas: {
          where: { id: { not: params.parejaId } },
          select: { jugador1Id: true, jugador2Id: true },
        },
      },
    });

    if (!convocatoria) {
      return NextResponse.json({ error: "Convocatoria no encontrada" }, { status: 404 });
    }

    // Validate jugador1Id if provided
    if (jugador1Id !== undefined && jugador1Id !== null) {
      const isAvailable = convocatoria.jugadores.some((j) => j.playerId === jugador1Id);
      if (!isAvailable) {
        return NextResponse.json({ error: "El jugador 1 no ha confirmado disponibilidad o no pertenece a esta convocatoria" }, { status: 400 });
      }

      // Check jugador is not already in another pareja
      const alreadyInPareja = convocatoria.parejas.some(
        (p) => p.jugador1Id === jugador1Id || p.jugador2Id === jugador1Id
      );
      if (alreadyInPareja) {
        return NextResponse.json({ error: "El jugador 1 ya está asignado a otra pareja" }, { status: 400 });
      }
    }

    // Validate jugador2Id if provided
    if (jugador2Id !== undefined && jugador2Id !== null) {
      const isAvailable = convocatoria.jugadores.some((j) => j.playerId === jugador2Id);
      if (!isAvailable) {
        return NextResponse.json({ error: "El jugador 2 no ha confirmado disponibilidad o no pertenece a esta convocatoria" }, { status: 400 });
      }

      // Check jugador is not already in another pareja
      const alreadyInPareja = convocatoria.parejas.some(
        (p) => p.jugador1Id === jugador2Id || p.jugador2Id === jugador2Id
      );
      if (alreadyInPareja) {
        return NextResponse.json({ error: "El jugador 2 ya está asignado a otra pareja" }, { status: 400 });
      }
    }

    // Same player in both slots validation
    if (jugador1Id && jugador2Id && jugador1Id === jugador2Id) {
      return NextResponse.json({ error: "No se puede asignar el mismo jugador a ambos slots" }, { status: 400 });
    }

    const updatedPareja = await prismadb.pareja.update({
      where: { id: params.parejaId },
      data: {
        jugador1Id: jugador1Id !== undefined ? jugador1Id : undefined,
        jugador2Id: jugador2Id !== undefined ? jugador2Id : undefined,
      },
      include: {
        jugador1: { select: { id: true, userId: true } },
        jugador2: { select: { id: true, userId: true } },
      },
    });

    return NextResponse.json(updatedPareja);
  } catch (error) {
    console.error("[PAREJA_PATCH]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}