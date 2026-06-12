import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prismadb from "@/lib/prisma";
import { startOfWeek, addDays } from "date-fns";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || !["GLOBAL_ADMIN", "CLUB_MANAGER"].includes(role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { clubId, weekStart } = body;

    if (!clubId || !weekStart) {
      return NextResponse.json({ error: "clubId y weekStart son obligatorios" }, { status: 400 });
    }

    // Get Monday of the target week
    const monday = startOfWeek(new Date(weekStart), { weekStartsOn: 1 });

    // Get all active templates for this club
    const templates = await prismadb.trainingTemplate.findMany({
      where: { clubId, isActive: true },
    });

    if (templates.length === 0) {
      return NextResponse.json({ created: 0, skipped: 0, total: 0 });
    }

    let created = 0;
    let skipped = 0;

    for (const template of templates) {
      // Calculate the date for this template's day of week
      const trainingDate = addDays(monday, template.dayOfWeek);

      // Check if session already exists for this team, date & startTime
      const existing = await prismadb.training.findFirst({
        where: {
          clubId,
          teamId: template.teamId,
          date: trainingDate,
          startTime: template.startTime,
          isCancelled: false,
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Get the team name for the title
      const team = await prismadb.team.findUnique({
        where: { id: template.teamId },
        select: { name: true },
      });

      await prismadb.training.create({
        data: {
          title: team?.name || "Entrenamiento",
          clubId,
          teamId: template.teamId,
          coachId: template.coachId,
          court: template.court,
          date: trainingDate,
          startTime: template.startTime,
          endTime: template.endTime,
        },
      });

      created++;
    }

    return NextResponse.json({
      created,
      skipped,
      total: templates.length,
    });
  } catch (error) {
    console.error("[APPLY_TEMPLATES_POST]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}