import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prismadb from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const match = await prismadb.match.findUnique({
      where: { id: params.id },
      include: {
        homeTeam: {
          select: { id: true, name: true, category: true, clubId: true },
        },
        awayTeam: {
          select: { id: true, name: true, category: true, clubId: true },
        },
        matchday: {
          select: { id: true, number: true, name: true, league: { select: { name: true } } },
        },
        result: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
    }

    // Filtrado multi-tenant: verificar que el usuario tenga acceso al club del partido
    const role = (session.user as any).role;
    const userClubId = (session.user as any).clubId;
    if (role !== "GLOBAL_ADMIN" && userClubId) {
      const matchClubId = match.homeTeam.clubId;
      if (matchClubId !== userClubId) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
    }

    // Buscar convocatoria vinculada al partido
    const convocatoria = await prismadb.convocatoria.findFirst({
      where: { matchId: params.id },
      include: {
        jugadores: {
          include: {
            player: {
              include: {
                user: { select: { name: true, surname: true } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ ...match, convocatoria });
  } catch (error) {
    console.error("[MATCH_GET]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || !["GLOBAL_ADMIN", "CLUB_MANAGER"].includes(role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar acceso multi-tenant
    const existingMatch = await prismadb.match.findUnique({
      where: { id: params.id },
      include: { homeTeam: { select: { clubId: true } } },
    });
    if (!existingMatch) {
      return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
    }
    const userRole = (session.user as any).role;
    const userClubId = (session.user as any).clubId;
    if (userRole !== "GLOBAL_ADMIN" && userClubId && existingMatch.homeTeam.clubId !== userClubId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { observations, status, notes, court, matchTime } = body;

    const data: any = {};
    if (observations !== undefined) data.observations = observations;
    if (status !== undefined) data.status = status;
    if (notes !== undefined) data.notes = notes;
    if (court !== undefined) data.court = court;
    if (matchTime !== undefined) data.matchTime = matchTime;

    const updated = await prismadb.match.update({
      where: { id: params.id },
      data,
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
        result: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[MATCH_PUT]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}