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
    if (!session || !["GLOBAL_ADMIN", "CLUB_MANAGER"].includes(role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const club = await prismadb.club.findUnique({
      where: { id: params.clubId },
      include: {
        _count: { select: { teams: true, players: true } },
        teams: {
          include: {
            players: { select: { id: true } },
          },
        },
      },
    });

    if (!club) {
      return NextResponse.json({ error: "Club no encontrado" }, { status: 404 });
    }

    if (club.deletedAt) {
      return NextResponse.json({ error: "El club ya está eliminado" }, { status: 400 });
    }

    // Create snapshot with current state for potential restoration
    const snapshotData = {
      clubId: club.id,
      clubName: club.name,
      deletedAt: new Date(),
      teamsSnapshot: JSON.stringify(
        club.teams.map((team) => ({
          id: team.id,
          name: team.name,
          category: team.category,
          playerIds: team.players.map((p) => p.id),
        }))
      ),
    };

    // Soft delete the club and all its teams in a transaction
    await prismadb.$transaction(async (tx) => {
      // Create snapshot
      await tx.clubDeletionSnapshot.create({ data: snapshotData });

      // Unlink all players from their teams (but keep them in the club)
      await tx.player.updateMany({
        where: { teamId: { in: club.teams.map((t) => t.id) } },
        data: { teamId: null },
      });

      // Soft delete all teams
      await tx.team.updateMany({
        where: { clubId: params.clubId },
        data: { deletedAt: new Date(), isActive: false },
      });

      // Soft delete the club
      await tx.club.update({
        where: { id: params.clubId },
        data: { deletedAt: new Date(), isActive: false },
      });
    });

    return NextResponse.json({
      success: true,
      affectedTeams: club._count.teams,
      affectedPlayers: club._count.players,
    });
  } catch (error) {
    console.error("[CLUB_DELETE]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { clubId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || !["GLOBAL_ADMIN", "CLUB_MANAGER"].includes(role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { restore, reassignPlayers, playerAssignments, managerId, ...rest } = body;

    if (!restore) {
      const { name, city, address, phone, email, website, description, responsable, courts, schedule } = rest;
      const data: any = {};
      if (name !== undefined) data.name = name;
      if (city !== undefined) data.city = city;
      if (address !== undefined) data.address = address;
      if (phone !== undefined) data.phone = phone;
      if (email !== undefined) data.email = email;
      if (website !== undefined) data.website = website;
      if (description !== undefined) data.description = description;
      if (responsable !== undefined) data.responsable = responsable || null;
      if (courts !== undefined) {
        const courtsNum = parseInt(courts);
        if (isNaN(courtsNum) || courtsNum < 1) {
          return NextResponse.json(
            { error: "Un club debe tener al menos 1 pista" },
            { status: 400 }
          );
        }
        data.courts = courtsNum;
      }
      if (schedule !== undefined) data.schedule = schedule;

      const updated = await prismadb.club.update({
        where: { id: params.clubId },
        data,
      });

      // Update manager assignment if provided
      if (managerId !== undefined) {
        // First, unlink any existing manager from this club
        await prismadb.user.updateMany({
          where: { role: "CLUB_MANAGER", clubId: params.clubId },
          data: { clubId: null },
        });

        // If a new manager is provided, link them to this club
        if (managerId !== null) {
          const manager = await prismadb.user.findUnique({ where: { id: managerId } });
          if (manager && manager.role === "CLUB_MANAGER") {
            await prismadb.user.update({ where: { id: managerId }, data: { clubId: params.clubId } });
          }
        }
      }

      return NextResponse.json(updated);
    }

    const club = await prismadb.club.findUnique({
      where: { id: params.clubId },
      include: {
        teams: { where: { deletedAt: { not: null } } },
        _count: { select: { teams: true, players: true } },
      },
    });

    if (!club) {
      return NextResponse.json({ error: "Club no encontrado" }, { status: 404 });
    }

    const snapshot = await prismadb.clubDeletionSnapshot.findFirst({
      where: { clubId: params.clubId },
      orderBy: { deletedAt: "desc" },
    });

    // Restore the club and its teams
    await prismadb.$transaction(async (tx) => {
      // Restore the club
      await tx.club.update({
        where: { id: params.clubId },
        data: { deletedAt: null, isActive: true },
      });

      // Restore all teams
      await tx.team.updateMany({
        where: { clubId: params.clubId, deletedAt: { not: null } },
        data: { deletedAt: null, isActive: true },
      });

      // If reassignPlayers, reassign players using snapshot or custom assignments
      if (reassignPlayers && snapshot) {
        const teamsSnapshot = JSON.parse(snapshot.teamsSnapshot);
        
        // Use custom assignments if provided, otherwise use snapshot defaults
        const assignments = playerAssignments || {};
        const assignmentsFromSnapshot = assignments;
        
        // Build a map of playerId -> teamId from either custom or snapshot assignments
        const finalAssignments: Record<string, string> = {};
        
        if (Object.keys(assignmentsFromSnapshot).length > 0) {
          // Custom assignments from UI
          Object.assign(finalAssignments, assignmentsFromSnapshot);
        } else {
          // Use snapshot assignments
          teamsSnapshot.forEach((teamData: { id: string; playerIds: string[] }) => {
            teamData.playerIds.forEach((playerId) => {
              finalAssignments[playerId] = teamData.id;
            });
          });
        }

        // Reassign players to teams
        for (const [playerId, teamId] of Object.entries(finalAssignments)) {
          const team = await tx.team.findUnique({
            where: { id: teamId },
          });
          
          if (team && team.deletedAt === null) {
            await tx.player.updateMany({
              where: {
                originalClubId: params.clubId,
                id: playerId,
              },
              data: { teamId: teamId as string },
            });
          }
        }

        // Update snapshot with restoration timestamp
        await tx.clubDeletionSnapshot.update({
          where: { id: snapshot.id },
          data: { restoredAt: new Date() },
        });
      }
    });

    return NextResponse.json({
      success: true,
      restoredTeams: club.teams.length,
    });
  } catch (error) {
    console.error("[CLUB_PATCH]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}