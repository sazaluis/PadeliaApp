import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prismadb from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: { playerId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || !["GLOBAL_ADMIN", "CLUB_MANAGER"].includes(role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const player = await prismadb.player.findUnique({
      where: { id: params.playerId },
      include: { user: { select: { id: true } }, team: { select: { id: true, category: true } } },
    });

    if (!player) {
      return NextResponse.json(
        { error: "Jugador no encontrado" },
        { status: 404 }
      );
    }

    // Soft delete: mark as inactive to preserve financial/payment records
    await prismadb.player.update({
      where: { id: params.playerId },
      data: { deletedAt: new Date(), isActive: false, teamId: null },
    });

    await prismadb.user.update({
      where: { id: player.user.id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PLAYER_DELETE]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { playerId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || !["GLOBAL_ADMIN", "CLUB_MANAGER", "TEAM_CAPTAIN"].includes(role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const {
      // User fields
      name, surname, email, phone,
      // Player fields
      level, gender, dominantHand, preferredPosition, teamId, ranking, clubId,
      restore,
    } = body;

    // Restore player
    if (restore) {
      const pl = await prismadb.player.findUnique({ where: { id: params.playerId }, include: { user: true } });
      if (!pl) return NextResponse.json({ error: "Jugador no encontrado" }, { status: 404 });
      await prismadb.$transaction(async (tx) => {
        await tx.player.update({ where: { id: params.playerId }, data: { isActive: true } });
        await tx.user.update({ where: { id: pl.user.id }, data: { isActive: true } });
      });
      const restored = await prismadb.player.findUnique({
        where: { id: params.playerId },
        include: {
          user: { select: { id: true, name: true, surname: true, email: true, phone: true, image: true } },
          team: { select: { id: true, name: true, category: true } },
          club: { select: { id: true, name: true } },
        },
      });
      return NextResponse.json(restored);
    }

    const player = await prismadb.player.findUnique({
      where: { id: params.playerId },
      include: { user: { select: { id: true } } },
    });

    if (!player) {
      return NextResponse.json(
        { error: "Jugador no encontrado" },
        { status: 404 }
      );
    }

    // If email is changing, check it's not taken by another user
    if (email && email !== undefined) {
      const existingUser = await prismadb.user.findFirst({
        where: {
          email,
          id: { not: player.user.id },
        },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: "Ya existe otro usuario con este email" },
          { status: 400 }
        );
      }
    }

    // Update user fields (only if provided)
    const userData: any = {};
    if (name !== undefined) userData.name = name;
    if (surname !== undefined) userData.surname = surname;
    if (email !== undefined) userData.email = email;
    if (phone !== undefined) userData.phone = phone || null;

    if (Object.keys(userData).length > 0) {
      await prismadb.user.update({
        where: { id: player.user.id },
        data: userData,
      });
    }

    // Validate gender compatibility when assigning to a team
    if (teamId !== undefined && teamId !== null) {
      const targetTeam = await prismadb.team.findUnique({ where: { id: teamId } });
      const playerGender = gender || player.gender;
      if (targetTeam && playerGender && playerGender !== "NONE" && playerGender !== "MIXED") {
        if (targetTeam.category !== "MIXED" && targetTeam.category !== playerGender) {
          return NextResponse.json(
            { error: `No se puede asignar un jugador ${playerGender === "MALE" ? "masculino" : "femenino"} a un equipo ${targetTeam.category === "MALE" ? "masculino" : "femenino"}` },
            { status: 400 }
          );
        }
      }
    }

    // Update player fields (only if provided)
    const playerData: any = {};
    if (level !== undefined) playerData.level = level || null;
    if (gender !== undefined) playerData.gender = gender || null;
    if (dominantHand !== undefined) playerData.dominantHand = dominantHand;
    if (preferredPosition !== undefined) playerData.preferredPosition = preferredPosition || null;
    if (teamId !== undefined) playerData.teamId = teamId || null;
    if (ranking !== undefined) playerData.ranking = ranking || null;

    // When assigning a new club manually, clear originalClubId
    if (clubId !== undefined && clubId !== null) {
      playerData.clubId = clubId;
      playerData.originalClubId = null;
    }

    const updated = await prismadb.player.update({
      where: { id: params.playerId },
      data: playerData,
      include: {
        user: { select: { id: true, name: true, surname: true, email: true, phone: true, image: true } },
        team: { select: { id: true, name: true, category: true } },
        club: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PLAYER_PATCH]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}