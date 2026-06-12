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
    const matchdayId = searchParams.get("matchdayId");
    const teamId = searchParams.get("teamId");
    const status = searchParams.get("status");

    const where: any = {};
    if (matchdayId) where.matchdayId = matchdayId;
    if (teamId) {
      where.OR = [{ homeTeamId: teamId }, { awayTeamId: teamId }];
    }
    if (status) where.status = status;

    const matches = await prismadb.match.findMany({
      where,
      include: {
        homeTeam: {
          select: { id: true, name: true, category: true },
        },
        awayTeam: {
          select: { id: true, name: true, category: true },
        },
        matchday: {
          select: { id: true, number: true, name: true },
        },
        result: true,
        convocation: {
          include: {
            players: {
              include: {
                player: {
                  include: {
                    user: { select: { name: true, surname: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { matchDate: "asc" },
    });

    return NextResponse.json(matches);
  } catch (error) {
    console.error("[MATCHES_GET]", error);
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
    if (!session || !["GLOBAL_ADMIN", "CLUB_MANAGER", "TEAM_CAPTAIN"].includes(role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { matchDate, matchTime, court, homeTeamId, awayTeamId, matchdayId, notes } = body;

    if (!matchDate || !homeTeamId || !awayTeamId || !matchdayId) {
      return NextResponse.json(
        { error: "Fecha, equipos y jornada son obligatorios" },
        { status: 400 }
      );
    }

    const match = await prismadb.match.create({
      data: {
        matchDate: new Date(matchDate),
        matchTime,
        court,
        homeTeamId,
        awayTeamId,
        matchdayId,
        notes,
      },
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
      },
    });

    return NextResponse.json(match, { status: 201 });
  } catch (error) {
    console.error("[MATCHES_POST]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}