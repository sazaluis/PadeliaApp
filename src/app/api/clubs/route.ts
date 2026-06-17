import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prismadb from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const includeDeleted = searchParams.get("deleted") === "true";

    const where: any = includeDeleted
      ? { deletedAt: { not: null } }
      : { deletedAt: null };

    const clubs = await prismadb.club.findMany({
      where,
      include: {
        _count: {
          select: { teams: true, players: true, coaches: true },
        },
      },
      orderBy: { name: "asc" },
    });

    // Add managers info for each club
    const managers = await prismadb.user.findMany({
      where: { role: "CLUB_MANAGER", clubId: { in: clubs.map(c => c.id) } },
      select: { id: true, name: true, surname: true, clubId: true },
    });

    const clubsWithManagers = clubs.map(club => ({
      ...club,
      manager: managers.find(m => m.clubId === club.id)
    }));

    return NextResponse.json(clubsWithManagers);
  } catch (error) {
    console.error("[CLUBS_GET]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "GLOBAL_ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { name, city, address, phone, email, website, description, responsable, courts, schedule } = body;

    const missing: string[] = [];
    if (!name?.trim()) missing.push("Nombre del club");
    if (!city?.trim()) missing.push("Ciudad");
    if (!responsable?.trim()) missing.push("Responsable");
    if (!address?.trim()) missing.push("Dirección");
    if (!phone?.trim()) missing.push("Teléfono");
    if (!email?.trim()) missing.push("Email");

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Faltan por rellenar los siguientes campos obligatorios: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    const courtsNum = courts !== undefined ? parseInt(courts) : 1;
    if (isNaN(courtsNum) || courtsNum < 1) {
      return NextResponse.json(
        { error: "Un club debe tener al menos 1 pista" },
        { status: 400 }
      );
    }

    const slug = slugify(name);

    // Check unique slug (excluding soft-deleted clubs)
    const existing = await prismadb.club.findFirst({
      where: { slug, deletedAt: null },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un club con ese nombre" },
        { status: 400 }
      );
    }

    const club = await prismadb.club.create({
      data: {
        name,
        slug,
        city,
        address,
        phone,
        email,
        website,
        description,
        responsable: responsable || null,
        courts: courtsNum,
        schedule: schedule || null,
      },
    });

    return NextResponse.json(club, { status: 201 });
  } catch (error) {
    console.error("[CLUBS_POST]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}