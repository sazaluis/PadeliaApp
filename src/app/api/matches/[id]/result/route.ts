import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prismadb from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || !["GLOBAL_ADMIN", "CLUB_MANAGER"].includes(role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { set1Local, set1Visitor, set2Local, set2Visitor, set3Local, set3Visitor } = body;

    // Validar que al menos los primeros 2 sets estén presentes
    if (set1Local === undefined || set1Visitor === undefined || set2Local === undefined || set2Visitor === undefined) {
      return NextResponse.json(
        { error: "Los sets 1 y 2 son obligatorios" },
        { status: 400 }
      );
    }

    // Validar que los valores sean números válidos
    const sets = [set1Local, set1Visitor, set2Local, set2Visitor, set3Local, set3Visitor].filter(v => v !== undefined && v !== null);
    if (sets.some(s => typeof s !== "number" || s < 0 || s > 7)) {
      return NextResponse.json(
        { error: "Los juegos por set deben estar entre 0 y 7" },
        { status: 400 }
      );
    }

    // Calcular sets ganados por cada equipo
    let localSets = 0;
    let visitorSets = 0;

    if (set1Local > set1Visitor) localSets++;
    else if (set1Visitor > set1Local) visitorSets++;

    if (set2Local > set2Visitor) localSets++;
    else if (set2Visitor > set2Local) visitorSets++;

    if (set3Local !== undefined && set3Visitor !== undefined) {
      if (set3Local > set3Visitor) localSets++;
      else if (set3Visitor > set3Local) visitorSets++;
    }

    // Validar que el partido exista
    const match = await prismadb.match.findUnique({
      where: { id: params.id },
    });

    if (!match) {
      return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
    }

    // Crear o actualizar resultado
    const result = await prismadb.matchResult.upsert({
      where: { matchId: params.id },
      create: {
        matchId: params.id,
        set1Local,
        set1Visitor,
        set2Local,
        set2Visitor,
        set3Local: set3Local ?? null,
        set3Visitor: set3Visitor ?? null,
        localSets,
        visitorSets,
        // Mantener compatibilidad con campos existentes
        pair1SetsHome: set1Local,
        pair1SetsAway: set1Visitor,
        pair2SetsHome: set2Local,
        pair2SetsAway: set2Visitor,
        pair3SetsHome: set3Local ?? 0,
        pair3SetsAway: set3Visitor ?? 0,
        totalSetsHome: localSets,
        totalSetsAway: visitorSets,
        totalGamesHome: set1Local + set2Local + (set3Local ?? 0),
        totalGamesAway: set1Visitor + set2Visitor + (set3Visitor ?? 0),
        homePoints: localSets > visitorSets ? 3 : localSets === visitorSets ? 1 : 0,
        awayPoints: visitorSets > localSets ? 3 : visitorSets === localSets ? 1 : 0,
      },
      update: {
        set1Local,
        set1Visitor,
        set2Local,
        set2Visitor,
        set3Local: set3Local ?? null,
        set3Visitor: set3Visitor ?? null,
        localSets,
        visitorSets,
        pair1SetsHome: set1Local,
        pair1SetsAway: set1Visitor,
        pair2SetsHome: set2Local,
        pair2SetsAway: set2Visitor,
        pair3SetsHome: set3Local ?? 0,
        pair3SetsAway: set3Visitor ?? 0,
        totalSetsHome: localSets,
        totalSetsAway: visitorSets,
        totalGamesHome: set1Local + set2Local + (set3Local ?? 0),
        totalGamesAway: set1Visitor + set2Visitor + (set3Visitor ?? 0),
        homePoints: localSets > visitorSets ? 3 : localSets === visitorSets ? 1 : 0,
        awayPoints: visitorSets > localSets ? 3 : visitorSets === localSets ? 1 : 0,
      },
    });

    // Actualizar estado del partido a COMPLETED
    await prismadb.match.update({
      where: { id: params.id },
      data: { status: "COMPLETED" },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[RESULT_POST]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}