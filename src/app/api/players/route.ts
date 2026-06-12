import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prismadb from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId");
    const clubId = searchParams.get("clubId");
    const originalClubId = searchParams.get("originalClubId");
    const gender = searchParams.get("gender");
    const level = searchParams.get("level");
    const includeDeleted = searchParams.get("deleted") === "true";

    const where: any = includeDeleted
      ? { isActive: false }
      : { isActive: true };
    if (teamId) where.teamId = teamId;
    if (clubId) where.clubId = clubId;
    if (originalClubId) where.originalClubId = originalClubId;
    if (gender) where.gender = gender;
    if (level) where.level = level;

    const players = await prismadb.player.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, surname: true, email: true, phone: true, image: true } },
        team: { select: { id: true, name: true, category: true } },
        club: { select: { id: true, name: true } },
      },
      orderBy: { ranking: "asc" },
    });

    return NextResponse.json(players);
  } catch (error) {
    console.error("[PLAYERS_GET]", error);
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
    if (!session || !["GLOBAL_ADMIN", "CLUB_MANAGER", "TEAM_CAPTAIN"].includes(role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { name, surname, email, password, phone, level, gender, dominantHand, preferredPosition, teamId, clubId } = body;

    if (!name || !surname || !email || !password) {
      return NextResponse.json(
        { error: "Nombre, apellidos, email y contraseña son obligatorios" },
        { status: 400 }
      );
    }

    // Resolve the clubId: use provided one or fall back to session user's club
    const resolvedClubId = clubId || (session.user as any)?.clubId;

    if (!resolvedClubId) {
      return NextResponse.json(
        { error: "El club es obligatorio para crear un jugador" },
        { status: 400 }
      );
    }


    // Check existing user
    const existing = await prismadb.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un usuario con este email" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Use a transaction to atomically create user + player.
    // If either operation fails, both are rolled back, preventing orphaned users.
    const player = await prismadb.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          surname,
          email,
          passwordHash,
          phone,
          role: "PLAYER",
          clubId: resolvedClubId,
        },
      });

      return tx.player.create({
        data: {
          userId: user.id,
          clubId: resolvedClubId,
          teamId: teamId || null,
          level: level || null,
          gender: gender || null,
          dominantHand: dominantHand || "RIGHT",
          preferredPosition: preferredPosition || null,
        },
        include: {
          user: { select: { id: true, name: true, surname: true, email: true, phone: true, image: true } },
          team: { select: { id: true, name: true, category: true } },
          club: { select: { id: true, name: true } },
        },
      });
    });

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    console.error("[PLAYERS_POST]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}