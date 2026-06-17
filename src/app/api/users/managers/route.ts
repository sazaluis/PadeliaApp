import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prismadb from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const managers = await prismadb.user.findMany({
      where: { role: "CLUB_MANAGER" },
      select: { id: true, name: true, surname: true, email: true, clubId: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(managers);
  } catch (error) {
    console.error("[MANAGERS_GET]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}