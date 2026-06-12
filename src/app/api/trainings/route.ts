import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prismadb from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clubId = searchParams.get("clubId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!clubId) {
      return NextResponse.json({ error: "clubId es obligatorio" }, { status: 400 });
    }

    const where: any = { clubId, isCancelled: false };
    if (startDate && endDate) {
      where.date = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const trainings = await prismadb.training.findMany({
      where,
      include: {
        team: { select: { id: true, name: true, category: true } },
        coach: { include: { user: { select: { name: true, surname: true } } } },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json(trainings);
  } catch (error) {
    console.error("[TRAININGS_GET]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || !["GLOBAL_ADMIN", "CLUB_MANAGER"].includes(role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { clubId, teamId, coachId, court, date, startTime, endTime, notes } = body;

    if (!clubId || !teamId || !date || !startTime || !endTime) {
      return NextResponse.json({ error: "Campos obligatorios: clubId, teamId, date, startTime, endTime" }, { status: 400 });
    }

    const team = await prismadb.team.findUnique({ where: { id: teamId } });
    if (!team) {
      return NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 });
    }

    const training = await prismadb.training.create({
      data: {
        title: team.name,
        clubId,
        teamId,
        coachId: coachId || null,
        court: court || null,
        date: new Date(date),
        startTime,
        endTime,
        notes: notes || null,
      },
      include: {
        team: { select: { id: true, name: true, category: true } },
        coach: { include: { user: { select: { name: true, surname: true } } } },
      },
    });

    return NextResponse.json(training, { status: 201 });
  } catch (error) {
    console.error("[TRAININGS_POST]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}