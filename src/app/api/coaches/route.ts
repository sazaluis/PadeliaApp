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
    const clubId = searchParams.get("clubId");
    const includeDeleted = searchParams.get("deleted") === "true";

    const where: any = includeDeleted
      ? {}
      : { isActive: true };

    if (clubId) where.clubId = clubId;

    const coaches = await prismadb.coach.findMany({
      where,
      include: { user: { select: { id: true, name: true, surname: true, email: true } } },
    });

    return NextResponse.json(coaches);
  } catch (error) {
    console.error("[COACHES_GET]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}