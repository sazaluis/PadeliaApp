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
    const role = searchParams.get("role");
    const clubId = searchParams.get("clubId");

    const where: any = {};
    if (role) where.role = role;
    if (clubId) where.clubId = clubId;

    const users = await prismadb.user.findMany({
      where,
      select: { id: true, name: true, surname: true, email: true, role: true, clubId: true },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("[USERS_GET]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}