import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prismadb from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { templateId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || !["GLOBAL_ADMIN", "CLUB_MANAGER"].includes(role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const template = await prismadb.trainingTemplate.update({
      where: { id: params.templateId },
      data: {
        teamId: body.teamId,
        coachId: body.coachId || null,
        court: body.court || null,
        dayOfWeek: body.dayOfWeek,
        startTime: body.startTime,
        endTime: body.endTime,
      },
      include: {
        team: { select: { id: true, name: true, category: true } },
        coach: { include: { user: { select: { name: true, surname: true } } } },
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("[TEMPLATE_PATCH]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { templateId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || !["GLOBAL_ADMIN", "CLUB_MANAGER"].includes(role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Soft delete: just set isActive to false
    await prismadb.trainingTemplate.update({
      where: { id: params.templateId },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[TEMPLATE_DELETE]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}