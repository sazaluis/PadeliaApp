import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prismadb from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { trainingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const training = await prismadb.training.findUnique({
      where: { id: params.trainingId },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            category: true,
            club: { select: { id: true, name: true } },
          },
        },
        coach: {
          include: {
            user: { select: { name: true, surname: true } },
          },
        },
      },
    });

    if (!training) {
      return NextResponse.json({ error: "Entrenamiento no encontrado" }, { status: 404 });
    }

    const parsed = {
      ...training,
      court: training.court ? JSON.parse(training.court) : null,
    };

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("[TRAINING_GET]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { trainingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || !["GLOBAL_ADMIN", "CLUB_MANAGER"].includes(role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { action, teamId, coachId, courts, date, startTime, endTime, notes } = body;

    // Restaurar entrenamiento eliminado
    if (action === "restore") {
      await prismadb.training.update({
        where: { id: params.trainingId },
        data: { isCancelled: false },
      });
      return NextResponse.json({ success: true });
    }

    // Editar entrenamiento
    const data: any = {};
    if (teamId !== undefined) data.teamId = teamId;
    if (coachId !== undefined) data.coachId = coachId || null;
    if (courts !== undefined) {
      data.court = Array.isArray(courts) && courts.length > 0 ? JSON.stringify(courts) : null;
    }
    if (date !== undefined) data.date = new Date(date);
    if (startTime !== undefined) data.startTime = startTime;
    if (endTime !== undefined) data.endTime = endTime;
    if (notes !== undefined) data.notes = notes || null;

    const training = await prismadb.training.update({
      where: { id: params.trainingId },
      data,
      include: {
        team: { select: { id: true, name: true, category: true } },
        coach: { include: { user: { select: { name: true, surname: true } } } },
      },
    });

    const parsed = {
      ...training,
      court: training.court ? JSON.parse(training.court) : null,
    };

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("[TRAINING_PATCH]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { trainingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || !["GLOBAL_ADMIN", "CLUB_MANAGER"].includes(role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Soft delete: marcar como cancelado (evita problemas con claves foráneas)
    await prismadb.training.update({
      where: { id: params.trainingId },
      data: { isCancelled: true },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[TRAINING_DELETE]", error);
    return NextResponse.json(
      { error: error?.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

