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
    const category = searchParams.get("category");
    const includeDeleted = searchParams.get("deleted") === "true";

    const where: any = includeDeleted
      ? { deletedAt: { not: null } }
      : { deletedAt: null };
    if (clubId) where.clubId = clubId;
    if (category) where.category = category;

    const teams = await prismadb.team.findMany({
      where,
      include: {
        club: { select: { id: true, name: true, city: true } },
        captain: { select: { id: true, name: true, surname: true } },
        coach: {
          select: { id: true, user: { select: { name: true, surname: true } } },
        },
        _count: { select: { players: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(teams);
  } catch (error) {
    console.error("[TEAMS_GET]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
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
    const { name, category, level, clubId, captainId, coachId, entrenador } = body;

    if (!name || !category || !clubId) {
      return NextResponse.json(
        { error: "Nombre, categoría y club son obligatorios" },
        { status: 400 }
      );
    }

    const team = await prismadb.team.create({
      data: {
        name,
        category,
        level,
        clubId,
        captainId: captainId || null,
        coachId: coachId || null,
        entrenador: entrenador || null,
      },
      include: {
        club: { select: { id: true, name: true, city: true } },
        captain: { select: { id: true, name: true, surname: true } },
        coach: {
          select: { id: true, user: { select: { name: true, surname: true } } },
        },
        _count: { select: { players: true } },
      },
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error("[TEAMS_POST]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}