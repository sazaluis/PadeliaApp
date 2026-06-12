import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prismadb from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || !["GLOBAL_ADMIN", "CLUB_MANAGER"].includes(role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { templateId, mode, year, month, quarter, onConflict } = body;

    if (!templateId || !mode || !year) {
      return NextResponse.json(
        { error: "templateId, mode y year son obligatorios" },
        { status: 400 }
      );
    }

    if (!["monthly", "quarterly", "annual"].includes(mode)) {
      return NextResponse.json(
        { error: "mode debe ser 'monthly', 'quarterly' o 'annual'" },
        { status: 400 }
      );
    }

    if (mode === "monthly" && (month === undefined || month < 1 || month > 12)) {
      return NextResponse.json(
        { error: "month es obligatorio para mode=monthly (1-12)" },
        { status: 400 }
      );
    }

    if (mode === "quarterly" && (quarter === undefined || quarter < 1 || quarter > 4)) {
      return NextResponse.json(
        { error: "quarter es obligatorio para mode=quarterly (1-4)" },
        { status: 400 }
      );
    }

    if (!["skip", "replace"].includes(onConflict)) {
      return NextResponse.json(
        { error: "onConflict debe ser 'skip' o 'replace'" },
        { status: 400 }
      );
    }

    // Get the template
    const template = await prismadb.trainingTemplate.findUnique({
      where: { id: templateId },
      include: {
        team: { select: { id: true, name: true } },
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Plantilla no encontrada" },
        { status: 404 }
      );
    }

    // Calculate date range based on mode
    let startDate: Date;
    let endDate: Date;

    if (mode === "monthly") {
      startDate = new Date(year, month! - 1, 1);
      endDate = new Date(year, month!, 0); // last day of month
    } else if (mode === "quarterly") {
      const startMonth = (quarter! - 1) * 3;
      startDate = new Date(year, startMonth, 1);
      endDate = new Date(year, startMonth + 3, 0); // last day of quarter
    } else {
      // annual
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if range includes past dates
    const hasPastDates = startDate < today;

    // Generate all dates in range that match the template's dayOfWeek
    const sessionsToCreate: { date: Date; dateStr: string }[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      // dayOfWeek: 0=Monday ... 6=Sunday
      // getDay(): 0=Sunday ... 6=Saturday
      // Convert: getDay() 0 -> 6 (Sunday), getDay() 1 -> 0 (Monday), etc.
      const isoDay = current.getDay() === 0 ? 6 : current.getDay() - 1;

      if (isoDay === template.dayOfWeek) {
        const dateStr = current.toISOString().split("T")[0];
        sessionsToCreate.push({ date: new Date(current), dateStr });
      }
      current.setDate(current.getDate() + 1);
    }

    if (sessionsToCreate.length === 0) {
      return NextResponse.json(
        { created: 0, skipped: 0, total: 0, hasPastDates },
        { status: 200 }
      );
    }

    // Check for existing sessions
    const templateDates = sessionsToCreate.map((s) => s.date);
    const existingTrainings = await prismadb.training.findMany({
      where: {
        templateId: templateId,
        date: { in: templateDates },
      },
      select: { date: true, id: true },
    });

    const existingDates = new Set(
      existingTrainings.map((t) => t.date.toISOString().split("T")[0])
    );

    let created = 0;
    let skipped = 0;

    const result = await prismadb.$transaction(async (tx) => {
      // If replacing, delete existing trainings first
      if (onConflict === "replace" && existingTrainings.length > 0) {
        for (const t of existingTrainings) {
          await tx.training.delete({ where: { id: t.id } });
        }
      }

      // Create new sessions
      for (const session of sessionsToCreate) {
        if (existingDates.has(session.dateStr) && onConflict === "skip") {
          skipped++;
          continue;
        }

        await tx.training.create({
          data: {
            title: template.team.name || "Entrenamiento",
            clubId: template.clubId,
            teamId: template.teamId,
            coachId: template.coachId,
            court: template.court,
            date: session.date,
            startTime: template.startTime,
            endTime: template.endTime,
            templateId: templateId,
          },
        });
        created++;
      }

      return { created, skipped };
    });

    return NextResponse.json({
      created: result.created,
      skipped: result.skipped,
      total: sessionsToCreate.length,
      hasPastDates,
    });
  } catch (error) {
    console.error("[APPLY_TEMPLATE_POST]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}