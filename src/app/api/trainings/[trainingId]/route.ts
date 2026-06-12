import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prismadb from "@/lib/prisma";

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
    const { teamId, coachId, court, date, startTime, endTime, notes } = body;

    const data: any = {};
    if (teamId !== undefined) data.teamId = teamId;
    if (coachId !== undefined) data.coachId = coachId || null;
    if (court !== undefined) data.court = court || null;
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

    return NextResponse.json(training);
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

    await prismadb.training.update({
      where: { id: params.trainingId },
      data: { isCancelled: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[TRAINING_DELETE]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}