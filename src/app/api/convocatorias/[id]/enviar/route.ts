import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prismadb from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function PATCH(
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
      include: {
        team: { select: { name: true } },
        jugadores: {
          include: {
            player: {
              include: {
                user: { select: { id: true, name: true, surname: true } },
              },
            },
          },
        },
      },
    });

    if (!convocatoria) {
      return NextResponse.json({ error: "Convocatoria no encontrada" }, { status: 404 });
    }

    // Always allow sending (even if already sent) to notify new players
    await prismadb.convocatoria.update({
      where: { id: params.id },
      data: { status: "ENVIADA" },
    });

    // Create notifications for all players
    const matchDateFormatted = new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(convocatoria.matchDate);

    for (const jugador of convocatoria.jugadores) {
      if (jugador.player.user) {
        await createNotification({
          userId: jugador.player.user.id,
          type: "CONVOCATORIA",
          title: "Nueva convocatoria",
          message: `Tienes una convocatoria para el partido ${convocatoria.team.name} vs ${convocatoria.rival} el ${matchDateFormatted}. Confirma tu disponibilidad.`,
          link: "/convocatorias",
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CONVOCATORIA_ENVIAR]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}