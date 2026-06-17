import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prismadb from "@/lib/prisma";

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

    const { playerIds } = await req.json();

    if (!Array.isArray(playerIds)) {
      return NextResponse.json({ error: "playerIds debe ser un array" }, { status: 400 });
    }

    const convocatoria = await prismadb.convocatoria.findUnique({
      where: { id: params.id },
      include: {
        jugadores: {
          select: { id: true, playerId: true, disponibilidad: true },
        },
      },
    });

    if (!convocatoria) {
      return NextResponse.json({ error: "Convocatoria no encontrada" }, { status: 404 });
    }

    if (convocatoria.status !== "ENVIADA") {
      return NextResponse.json({ error: "La convocatoria debe estar en estado ENVIADA" }, { status: 400 });
    }

    // Validate that all selected players have disponibilidad === "SI"
    for (const playerId of playerIds) {
      const jugador = convocatoria.jugadores.find((j) => j.playerId === playerId);
      if (!jugador) {
        return NextResponse.json({ error: `Jugador ${playerId} no está en esta convocatoria` }, { status: 400 });
      }
      if (jugador.disponibilidad !== "SI") {
        return NextResponse.json({ error: "Solo jugadores que hayan respondido SI pueden ser convocados" }, { status: 400 });
      }
    }

    // Set convocado: true for selected players, false for the rest
    await prismadb.$transaction(
      convocatoria.jugadores.map((j) =>
        prismadb.convocatoriaJugador.update({
          where: { id: j.id },
          data: { convocado: playerIds.includes(j.playerId) },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CONVOCATORIA_CONVOCADOS]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}