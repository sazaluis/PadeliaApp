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
    const leagueId = searchParams.get("leagueId");

    if (!leagueId) {
      return NextResponse.json(
        { error: "leagueId es obligatorio" },
        { status: 400 }
      );
    }

    const standings = await prismadb.standing.findMany({
      where: { leagueId },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            category: true,
            club: { select: { name: true } },
          },
        },
      },
      orderBy: { position: "asc" },
    });

    return NextResponse.json(standings);
  } catch (error) {
    console.error("[STANDINGS_GET]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}