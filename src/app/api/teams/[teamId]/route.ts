import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prismadb from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || !["GLOBAL_ADMIN", "CLUB_MANAGER"].includes(role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const team = await prismadb.team.findUnique({
      where: { id: params.teamId },
      include: { _count: { select: { players: true } } },
    });

    if (!team) {
      return NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 });
    }

    // Soft delete team + unlink players in a transaction
    await prismadb.$transaction(async (tx) => {
      // Unlink all players from this team
      await tx.player.updateMany({
        where: { teamId: params.teamId },
        data: { teamId: null },
      });

      // Soft delete the team
      await tx.team.update({
        where: { id: params.teamId },
        data: { deletedAt: new Date(), isActive: false },
      });
    });

    return NextResponse.json({
      success: true,
      affectedPlayers: team._count.players,
    });
  } catch (error) {
    console.error("[TEAM_DELETE]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || !["GLOBAL_ADMIN", "CLUB_MANAGER"].includes(role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

  const body = await req.json();
  const { name, category, level, restore, coachId, entrenador } = body;

  // Restore team
  if (restore) {
    const team = await prismadb.team.findUnique({ where: { id: params.teamId } });
    if (!team) return NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 });
    await prismadb.team.update({
      where: { id: params.teamId },
      data: { deletedAt: null, isActive: true },
    });
    return NextResponse.json({ success: true });
  }

    const team = await prismadb.team.findUnique({
      where: { id: params.teamId },
    });

    if (!team) {
      return NextResponse.json(
        { error: "Equipo no encontrado" },
        { status: 404 }
      );
    }

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (category !== undefined) data.category = category;
    if (level !== undefined) data.level = level || null;
    if (coachId !== undefined) data.coachId = coachId || null;
    if (entrenador !== undefined) data.entrenador = entrenador || null;

    const updated = await prismadb.team.update({
      where: { id: params.teamId },
      data,
      include: {
        club: { select: { id: true, name: true, city: true } },
        captain: { select: { id: true, name: true, surname: true } },
        coach: {
          select: { id: true, user: { select: { name: true, surname: true } } },
        },
        _count: { select: { players: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[TEAM_PATCH]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}