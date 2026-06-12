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

    if (!clubId) {
      return NextResponse.json({ error: "clubId es obligatorio" }, { status: 400 });
    }

    const templates = await prismadb.trainingTemplate.findMany({
      where: { clubId, isActive: true },
      include: {
        team: { select: { id: true, name: true, category: true } },
        coach: { include: { user: { select: { name: true, surname: true } } } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("[TEMPLATES_GET]", error);
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
    const { clubId, teamId, coachId, court, dayOfWeek, startTime, endTime } = body;

    if (!clubId || !teamId || dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json({ error: "Campos obligatorios: clubId, teamId, dayOfWeek, startTime, endTime" }, { status: 400 });
    }

    const template = await prismadb.trainingTemplate.create({
      data: {
        clubId,
        teamId,
        coachId: coachId || null,
        court: court || null,
        dayOfWeek,
        startTime,
        endTime,
      },
      include: {
        team: { select: { id: true, name: true, category: true } },
        coach: { include: { user: { select: { name: true, surname: true } } } },
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("[TEMPLATES_POST]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}