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

    const role = (session.user as any).role;
    const userClubId = (session.user as any).clubId;

    const { searchParams } = new URL(req.url);
    const matchdayId = searchParams.get("matchdayId");
    const teamId = searchParams.get("teamId");
    const status = searchParams.get("status");
    const clubId = searchParams.get("clubId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};
    if (matchdayId) where.matchdayId = matchdayId;
    if (teamId) {
      where.OR = [{ homeTeamId: teamId }, { awayTeamId: teamId }];
    }
    if (status) where.status = status;
    if (startDate && endDate) {
      where.matchDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Filtrado multi-tenant: admin ve todo, club users solo ven su club
    if (role !== "GLOBAL_ADMIN") {
      if (userClubId) {
        // Filtrar por equipos del club del usuario
        const clubTeams = await prismadb.team.findMany({
          where: { clubId: userClubId },
          select: { id: true },
        });
        const teamIds = clubTeams.map(t => t.id);
        where.OR = [
          ...(where.OR || []),
          { homeTeamId: { in: teamIds } },
          { awayTeamId: { in: teamIds } },
        ];
      }
    } else if (clubId) {
      // Admin puede filtrar por club específico
      const clubTeams = await prismadb.team.findMany({
        where: { clubId },
        select: { id: true },
      });
      const teamIds = clubTeams.map(t => t.id);
      where.OR = [
        { homeTeamId: { in: teamIds } },
        { awayTeamId: { in: teamIds } },
      ];
    }

    const matches = await prismadb.match.findMany({
      where,
      include: {
        homeTeam: {
          select: { id: true, name: true, category: true, clubId: true },
        },
        awayTeam: {
          select: { id: true, name: true, category: true, clubId: true },
        },
        matchday: {
          select: { id: true, number: true, name: true },
        },
        result: true,
      },
      orderBy: { matchDate: "asc" },
    });

    // Get all match IDs
    const matchIds = matches.map(m => m.id);

    // Find convocatorias for these matches
    const convocatorias = await prismadb.convocatoria.findMany({
      where: { matchId: { in: matchIds } },
      select: { matchId: true, rival: true, id: true },
    });

    // Create a map of matchId -> convocatoria
    const convMap = new Map(convocatorias.map(c => [c.matchId, c]));

    // Attach convocatoria data to matches
    const matchesWithConvocatoria = matches.map(m => ({
      ...m,
      convocation: convMap.get(m.id) ? { id: convMap.get(m.id)!.id, rival: convMap.get(m.id)!.rival } : null,
    }));

    return NextResponse.json(matchesWithConvocatoria);
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