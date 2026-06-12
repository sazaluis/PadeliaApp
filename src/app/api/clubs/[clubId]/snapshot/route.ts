import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prismadb from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { clubId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const snapshot = await prismadb.clubDeletionSnapshot.findFirst({
      where: { clubId: params.clubId },
      orderBy: { deletedAt: "desc" },
    });

    if (!snapshot) {
      return NextResponse.json({ error: "Snapshot no encontrado" }, { status: 404 });
    }

    // Get orphaned players (players with originalClubId pointing to this club)
    const orphanedPlayers = await prismadb.player.findMany({
      where: { originalClubId: params.clubId, isActive: true },
      include: {
        user: { select: { id: true, name: true, surname: true } },
      },
    });

    // Parse teams snapshot to get team info
    const teamsSnapshot = JSON.parse(snapshot.teamsSnapshot);

    // Get current active teams (will be restored)
    const activeTeams = await prismadb.team.findMany({
      where: { clubId: params.clubId, deletedAt: null },
      select: { id: true, name: true, category: true },
    });

    return NextResponse.json({
      snapshot,
      teamsSnapshot,
      activeTeams,
      orphanedPlayers: orphanedPlayers.map((p) => ({
        id: p.id,
        userId: p.userId,
        name: p.user.name,
        surname: p.user.surname,
      })),
    });
  } catch (error) {
    console.error("[CLUB_SNAPSHOT_GET]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}