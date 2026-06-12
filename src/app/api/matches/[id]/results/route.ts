import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prismadb from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || !["GLOBAL_ADMIN", "CLUB_MANAGER", "TEAM_CAPTAIN"].includes(role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { pair1, pair2, pair3 } = body;

    // Validate scores
    if (!pair1 || !pair2 || !pair3) {
      return NextResponse.json(
        { error: "Se requieren resultados de las 3 parejas" },
        { status: 400 }
      );
    }

    // Get match
    const match = await prismadb.match.findUnique({
      where: { id: params.id },
      include: { matchday: { include: { league: true } } },
    });

    if (!match) {
      return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
    }

    // Calculate totals
    const totalSetsHome = (pair1.home > pair1.away ? 1 : 0) + (pair2.home > pair2.away ? 1 : 0) + (pair3.home > pair3.away ? 1 : 0);
    const totalSetsAway = (pair1.away > pair1.home ? 1 : 0) + (pair2.away > pair2.home ? 1 : 0) + (pair3.away > pair3.home ? 1 : 0);

    const totalGamesHome = pair1.home + pair2.home + pair3.home;
    const totalGamesAway = pair1.away + pair2.away + pair3.away;

    // Calculate points (padel scoring: 3 pts for winning, 1 for each pair won)
    let homePoints = 0;
    let awayPoints = 0;

    if (totalSetsHome > totalSetsAway) {
      homePoints = 3;
    } else if (totalSetsAway > totalSetsHome) {
      awayPoints = 3;
    } else {
      homePoints = 1;
      awayPoints = 1;
    }

    // Create or update result
    const result = await prismadb.matchResult.upsert({
      where: { matchId: params.id },
      create: {
        matchId: params.id,
        pair1SetsHome: pair1.home,
        pair1SetsAway: pair1.away,
        pair1TiebreakHome: pair1.tiebreakHome || null,
        pair1TiebreakAway: pair1.tiebreakAway || null,
        pair2SetsHome: pair2.home,
        pair2SetsAway: pair2.away,
        pair2TiebreakHome: pair2.tiebreakHome || null,
        pair2TiebreakAway: pair2.tiebreakAway || null,
        pair3SetsHome: pair3.home,
        pair3SetsAway: pair3.away,
        pair3TiebreakHome: pair3.tiebreakHome || null,
        pair3TiebreakAway: pair3.tiebreakAway || null,
        totalSetsHome,
        totalSetsAway,
        totalGamesHome,
        totalGamesAway,
        homePoints,
        awayPoints,
      },
      update: {
        pair1SetsHome: pair1.home,
        pair1SetsAway: pair1.away,
        pair1TiebreakHome: pair1.tiebreakHome || null,
        pair1TiebreakAway: pair1.tiebreakAway || null,
        pair2SetsHome: pair2.home,
        pair2SetsAway: pair2.away,
        pair2TiebreakHome: pair2.tiebreakHome || null,
        pair2TiebreakAway: pair2.tiebreakAway || null,
        pair3SetsHome: pair3.home,
        pair3SetsAway: pair3.away,
        pair3TiebreakHome: pair3.tiebreakHome || null,
        pair3TiebreakAway: pair3.tiebreakAway || null,
        totalSetsHome,
        totalSetsAway,
        totalGamesHome,
        totalGamesAway,
        homePoints,
        awayPoints,
      },
    });

    // Update match status
    await prismadb.match.update({
      where: { id: params.id },
      data: { status: "COMPLETED" },
    });

    // Update standings for both teams
    if (match.matchday?.leagueId) {
      await updateStandings(match.matchday.leagueId, match.homeTeamId, match.awayTeamId, {
        homeSetsWon: totalSetsHome,
        homeSetsLost: totalSetsAway,
        homeGamesWon: totalGamesHome,
        homeGamesLost: totalGamesAway,
        homePoints,
        awayPoints,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[RESULTS_POST]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

async function updateStandings(
  leagueId: string,
  homeTeamId: string,
  awayTeamId: string,
  data: {
    homeSetsWon: number;
    homeSetsLost: number;
    homeGamesWon: number;
    homeGamesLost: number;
    homePoints: number;
    awayPoints: number;
  }
) {
  const season = await prismadb.league.findUnique({
    where: { id: leagueId },
    select: { seasonId: true },
  });

  if (!season) return;

  // Update home team standing
  const homeStanding = await prismadb.standing.findFirst({
    where: { leagueId, teamId: homeTeamId },
  });

  if (homeStanding) {
    await prismadb.standing.update({
      where: { id: homeStanding.id },
      data: {
        matchesPlayed: homeStanding.matchesPlayed + 1,
        wins: homeStanding.wins + (data.homePoints === 3 ? 1 : 0),
        losses: homeStanding.losses + (data.awayPoints === 3 ? 1 : 0),
        setsWon: homeStanding.setsWon + data.homeSetsWon,
        setsLost: homeStanding.setsLost + data.homeSetsLost,
        gamesWon: homeStanding.gamesWon + data.homeGamesWon,
        gamesLost: homeStanding.gamesLost + data.homeGamesLost,
        points: homeStanding.points + data.homePoints,
        pointsFor: homeStanding.pointsFor + data.homeGamesWon,
        pointsAgainst: homeStanding.pointsAgainst + data.homeGamesLost,
      },
    });
  }

  // Update away team standing
  const awayStanding = await prismadb.standing.findFirst({
    where: { leagueId, teamId: awayTeamId },
  });

  if (awayStanding) {
    await prismadb.standing.update({
      where: { id: awayStanding.id },
      data: {
        matchesPlayed: awayStanding.matchesPlayed + 1,
        wins: awayStanding.wins + (data.awayPoints === 3 ? 1 : 0),
        losses: awayStanding.losses + (data.homePoints === 3 ? 1 : 0),
        setsWon: awayStanding.setsWon + data.homeSetsLost,
        setsLost: awayStanding.setsLost + data.homeSetsWon,
        gamesWon: awayStanding.gamesWon + data.homeGamesLost,
        gamesLost: awayStanding.gamesLost + data.homeGamesWon,
        points: awayStanding.points + data.awayPoints,
        pointsFor: awayStanding.pointsFor + data.homeGamesLost,
        pointsAgainst: awayStanding.pointsAgainst + data.homeGamesWon,
      },
    });
  }

  // Recalculate positions
  const standings = await prismadb.standing.findMany({
    where: { leagueId },
    orderBy: [
      { points: "desc" },
      { setsWon: "desc" },
      { gamesWon: "desc" },
    ],
  });

  for (let i = 0; i < standings.length; i++) {
    await prismadb.standing.update({
      where: { id: standings[i].id },
      data: { position: i + 1 },
    });
  }
}