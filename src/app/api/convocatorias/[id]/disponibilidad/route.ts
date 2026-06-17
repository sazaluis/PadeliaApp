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
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { playerId, disponibilidad } = await req.json();
    const currentUser = session.user as any;
    const role = currentUser?.role;

    if (!playerId || !["SI", "NO"].includes(disponibilidad)) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const convocatoria = await prismadb.convocatoria.findUnique({
      where: { id: params.id },
    });

    if (!convocatoria) {
      return NextResponse.json({ error: "Convocatoria no encontrada" }, { status: 404 });
    }

    if (convocatoria.status !== "ENVIADA") {
      return NextResponse.json({ error: "La convocatoria debe estar en estado ENVIADA" }, { status: 400 });
    }

    // Check deadline only for non-admin users
    if (role !== "GLOBAL_ADMIN" && role !== "CLUB_MANAGER") {
      if (new Date() > convocatoria.deadline) {
        return NextResponse.json({ error: "La fecha límite ha pasado" }, { status: 400 });
      }
    }

    // Build user name for log
    const userName = `${currentUser?.name ?? ""} ${currentUser?.surname ?? ""}`.trim() || currentUser?.email || "Usuario";

    const updated = await prismadb.convocatoriaJugador.updateMany({
      where: {
        convocatoriaId: params.id,
        playerId,
      },
      data: {
        disponibilidad,
        updatedBy: currentUser?.id || null,
        updatedByName: userName,
      },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: "Jugador no encontrado en esta convocatoria" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CONVOCATORIA_DISPONIBILIDAD]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}