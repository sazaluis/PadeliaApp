import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prismadb from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { trainingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const training = await prismadb.training.findUnique({
      where: { id: params.trainingId },
      include: {
        team: { include: { club: true } },
        asistencias: {
          include: {
            jugador: {
              include: {
                user: { select: { name: true, surname: true } },
                team: { select: { id: true, name: true, category: true } },
              },
            },
            equipoOrigen: { select: { id: true, name: true, category: true } },
          },
        },
      },
    });

    if (!training) {
      return NextResponse.json({ error: "Entrenamiento no encontrado" }, { status: 404 });
    }

    const teamPlayers = await prismadb.player.findMany({
      where: {
        teamId: training.teamId,
        isActive: true,
        deletedAt: null,
      },
      include: {
        user: { select: { name: true, surname: true } },
        team: { select: { id: true, name: true, category: true } },
      },
    });

    const attendanceMap = new Map(
      training.asistencias.map((a) => [a.jugadorId, a])
    );

    const result = teamPlayers.map((player) => {
      const attendance = attendanceMap.get(player.id);
      return {
        jugadorId: player.id,
        nombre: `${player.user.name || ""} ${player.user.surname || ""}`.trim() || "Sin nombre",
        equipo: player.team,
        estado: attendance?.estado || "PENDIENTE",
        esInvitado: false,
        equipoOrigen: null,
        pistaAsignada: attendance?.pistaAsignada || null,
        asistenciaId: attendance?.id || null,
      };
    });

    const invitedAttendances = training.asistencias.filter((a) => a.esInvitado);
    for (const attendance of invitedAttendances) {
      const player = await prismadb.player.findUnique({
        where: { id: attendance.jugadorId },
        include: {
          user: { select: { name: true, surname: true } },
          team: { select: { id: true, name: true, category: true } },
        },
      });
      if (player) {
        result.push({
          jugadorId: player.id,
          nombre: `${player.user.name || ""} ${player.user.surname || ""}`.trim() || "Sin nombre",
          equipo: player.team,
          estado: attendance.estado,
          esInvitado: true,
          equipoOrigen: attendance.equipoOrigen,
          pistaAsignada: attendance.pistaAsignada,
          asistenciaId: attendance.id,
        });
      }
    }

    return NextResponse.json({
      entrenamiento: {
        id: training.id,
        titulo: training.title,
        fecha: training.date,
        horaInicio: training.startTime,
        clubId: training.team.clubId,
        equipoId: training.teamId,
      },
      jugadores: result,
    });
  } catch (error) {
    console.error("[ASISTENCIA_GET]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}