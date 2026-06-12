import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prismadb from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: { clubId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || role !== "GLOBAL_ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(_req.url);
    const permanent = searchParams.get("permanent") === "true";

    const club = await prismadb.club.findUnique({
      where: { id: params.clubId },
      include: {
        _count: { select: { teams: true, players: true } },
      },
    });

    if (!club) {
      return NextResponse.json({ error: "Club no encontrado" }, { status: 404 });
    }

    // Only allow hard delete on soft-deleted clubs
    if (!club.deletedAt && !permanent) {
      return NextResponse.json(
        { error: "El club no está eliminado. Usa soft-delete primero." },
        { status: 400 }
      );
    }

    if (!permanent) {
      return NextResponse.json(
        { error: "Se requiere confirmación adicional para borrado físico" },
        { status: 400 }
      );
    }

    // Hard delete: remove all related data in correct order to avoid FK constraints
    await prismadb.$transaction(async (tx) => {
      // Get teams first to clean up dependent records
      const teams = await tx.team.findMany({
        where: { clubId: params.clubId },
        select: { id: true },
      });

      // Delete all matches for these teams
      await tx.match.deleteMany({
        where: { OR: [{ homeTeamId: { in: teams.map(t => t.id) } }, { awayTeamId: { in: teams.map(t => t.id) } }] },
      });

      // Delete all trainings and related records for these teams
      const trainings = await tx.training.findMany({
        where: { teamId: { in: teams.map(t => t.id) } },
        select: { id: true },
      });

      await tx.attendance.deleteMany({
        where: { trainingId: { in: trainings.map(tr => tr.id) } },
      });
      await tx.trainingPlayer.deleteMany({
        where: { trainingId: { in: trainings.map(tr => tr.id) } },
      });
      await tx.training.deleteMany({
        where: { teamId: { in: teams.map(t => t.id) } },
      });

      // Delete convocations and related records
      const convocations = await tx.convocation.findMany({
        where: { teamId: { in: teams.map(t => t.id) } },
        select: { id: true },
      });
      await tx.convocationPlayer.deleteMany({
        where: { convocationId: { in: convocations.map(c => c.id) } },
      });
      await tx.convocation.deleteMany({
        where: { teamId: { in: teams.map(t => t.id) } },
      });

      // Delete standings
      await tx.standing.deleteMany({
        where: { teamId: { in: teams.map(t => t.id) } },
      });

      // Delete players and related records
      const players = await tx.player.findMany({
        where: { clubId: params.clubId },
        select: { id: true, userId: true },
      });

      await tx.trainingPlayer.deleteMany({
        where: { playerId: { in: players.map(p => p.id) } },
      });
      await tx.convocationPlayer.deleteMany({
        where: { playerId: { in: players.map(p => p.id) } },
      });
      await tx.attendance.deleteMany({
        where: { playerId: { in: players.map(p => p.id) } },
      });

      // Delete all teams
      await tx.team.deleteMany({ where: { clubId: params.clubId } });

      // Delete all players
      await tx.player.deleteMany({ where: { clubId: params.clubId } });

      // Delete all coaches
      const coaches = await tx.coach.findMany({ where: { clubId: params.clubId }, select: { userId: true } });
      await tx.coach.deleteMany({ where: { clubId: params.clubId } });

      // Delete seasons
      await tx.season.deleteMany({ where: { clubId: params.clubId } });

      // Delete snapshot
      await tx.clubDeletionSnapshot.deleteMany({ where: { clubId: params.clubId } });

      // Delete the club
      await tx.club.delete({ where: { id: params.clubId } });
    });

    return NextResponse.json({
      success: true,
      deletedTeams: club._count.teams,
      deletedPlayers: club._count.players,
    });
  } catch (error) {
    console.error("[CLUB_DELETE_PERMANENT]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}