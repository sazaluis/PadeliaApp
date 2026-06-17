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
    const clubId = searchParams.get("clubId");
    const seasonId = searchParams.get("seasonId");

    const where: any = { isActive: true };

    // Filtrado multi-tenant a través de season.clubId
    if (role !== "GLOBAL_ADMIN") {
      if (userClubId) {
        where.season = { clubId: userClubId };
      } else {
        // Si no tiene clubId, no mostrar nada
        return NextResponse.json([]);
      }
    } else if (clubId) {
      where.season = { clubId: clubId };
    }

    if (seasonId) {
      where.seasonId = seasonId;
    }

    const leagues = await prismadb.league.findMany({
      where,
      include: {
        season: {
          select: {
            id: true,
            name: true,
            year: true,
          },
        },
        _count: {
          select: {
            matchdays: true,
            standings: true,
          },
        },
      },
      orderBy: [
        { season: { year: "desc" } },
        { name: "asc" },
      ],
    });

    return NextResponse.json(leagues);
  } catch (error) {
    console.error("[LEAGUES_GET]", error);
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
    if (!session || !["GLOBAL_ADMIN", "CLUB_MANAGER"].includes(role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, category, level, maxTeams, seasonId, clubId } = body;

    if (!name || !category || !seasonId || !clubId) {
      return NextResponse.json(
        { error: "Nombre, categoría, temporada y club son obligatorios" },
        { status: 400 }
      );
    }

    const league = await prismadb.league.create({
      data: {
        name,
        description,
        category,
        level,
        maxTeams: maxTeams || 16,
        seasonId,
        clubId,
      },
      include: {
        season: {
          select: {
            id: true,
            name: true,
            year: true,
          },
        },
      },
    });

    return NextResponse.json(league, { status: 201 });
  } catch (error) {
    console.error("[LEAGUES_POST]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}