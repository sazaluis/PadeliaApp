import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prismadb from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const players = await prismadb.player.findMany({
      where: {
        teamId: params.teamId,
        isActive: true,
        deletedAt: null,
      },
      include: {
        user: { select: { name: true, surname: true, email: true } },
      },
      orderBy: [{ user: { name: "asc" } }],
    });

    return NextResponse.json(players);
  } catch (error) {
    console.error("[TEAM_PLAYERS_GET]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}