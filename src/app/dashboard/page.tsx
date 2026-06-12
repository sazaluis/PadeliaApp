"use client";

import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Calendar,
  Trophy,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Swords,
} from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Welcome */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Bienvenido, {session?.user?.name || "Usuario"}
          </h1>
          <p className="text-muted-foreground">
            Panel de control - {getRoleLabel(userRole)}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Equipos"
            value="6"
            description="3 masculinos, 2 femeninos, 1 mixto"
            icon={Users}
            trend="+2 este mes"
          />
          <StatCard
            title="Próximos Entrenamientos"
            value="4"
            description="Esta semana"
            icon={Calendar}
            trend="Hoy: 18:00"
          />
          <StatCard
            title="Partidos Pendientes"
            value="2"
            description="Jornada 8"
            icon={Swords}
            trend="Sábado 10:00"
          />
          <StatCard
            title="Clasificación"
            value="2º"
            description="Liga Senior Masculina"
            icon={Trophy}
            trend="+1 posición"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upcoming Matches */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Swords className="h-5 w-5 text-primary" />
                Próximos Partidos
              </CardTitle>
              <CardDescription>Partidos programados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <MatchItem
                  homeTeam="Padel Club A"
                  awayTeam="TC Barcelona"
                  date="Sáb, 15 Jun"
                  time="10:00"
                  court="Pista 1"
                  status="SCHEDULED"
                />
                <MatchItem
                  homeTeam="Padel Club B"
                  awayTeam="CD Tennis"
                  date="Sáb, 15 Jun"
                  time="12:00"
                  court="Pista 3"
                  status="SCHEDULED"
                />
                <MatchItem
                  homeTeam="Padel Club A"
                  awayTeam="Real Padel"
                  date="Sáb, 22 Jun"
                  time="10:00"
                  court="Pista 2"
                  status="SCHEDULED"
                />
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Trainings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Próximos Entrenamientos
              </CardTitle>
              <CardDescription>Entrenamientos programados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <TrainingItem
                  title="Entrenamiento Táctico"
                  date="Hoy"
                  time="18:00 - 20:00"
                  facility="Pista Cubierta"
                  attendees={8}
                  total={10}
                />
                <TrainingItem
                  title="Sesión de Saque"
                  date="Mié, 12 Jun"
                  time="19:00 - 21:00"
                  facility="Pista 1"
                  attendees={6}
                  total={10}
                />
                <TrainingItem
                  title="Partido Amistoso"
                  date="Vie, 14 Jun"
                  time="18:00 - 20:00"
                  facility="Pista 2"
                  attendees={10}
                  total={10}
                />
              </div>
            </CardContent>
          </Card>

          {/* Standing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Clasificación
              </CardTitle>
              <CardDescription>Liga Senior Masculina</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <StandingRow position={1} team="TC Barcelona" points={24} wins={8} losses={2} sets="+12" />
                <StandingRow position={2} team="Padel Club A" points={21} wins={7} losses={3} sets="+8" highlight />
                <StandingRow position={3} team="Real Padel" points={18} wins={6} losses={4} sets="+5" />
                <StandingRow position={4} team="CD Tennis" points={15} wins={5} losses={5} sets="+1" />
                <StandingRow position={5} team="Padel Club B" points={12} wins={4} losses={6} sets="-3" />
                <StandingRow position={6} team="ATM Padel" points={9} wins={3} losses={7} sets="-8" />
                <StandingRow position={7} team="Club Natación" points={6} wins={2} losses={8} sets="-12" />
                <StandingRow position={8} team="Uni Padel" points={3} wins={1} losses={9} sets="-15" />
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Actividad Reciente
              </CardTitle>
              <CardDescription>Últimas actualizaciones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ActivityItem
                  type="result"
                  text="Resultado registrado: Padel Club A 3 - 0 CD Tennis"
                  time="Hace 2 horas"
                />
                <ActivityItem
                  type="convocation"
                  text="Convocatoria enviada para jornada 8"
                  time="Hace 5 horas"
                />
                <ActivityItem
                  type="training"
                  text="Asistencia registrada: Entrenamiento Táctico"
                  time="Ayer"
                />
                <ActivityItem
                  type="result"
                  text="Resultado registrado: Padel Club B 2 - 1 ATM Padel"
                  time="Ayer"
                />
                <ActivityItem
                  type="general"
                  text="Nuevo jugador añadido: Carlos López"
                  time="Hace 2 días"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ============================================================
// Sub-components
// ============================================================

function getRoleLabel(role: string) {
  const labels: Record<string, string> = {
    GLOBAL_ADMIN: "Administrador Global",
    CLUB_MANAGER: "Responsable de Club",
    TEAM_CAPTAIN: "Capitán de Equipo",
    COACH: "Entrenador",
    PLAYER: "Jugador",
  };
  return labels[role] || role;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  trend: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
            <p className="text-xs text-primary mt-1">{trend}</p>
          </div>
          <div className="rounded-lg bg-primary/10 p-3">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MatchItem({
  homeTeam,
  awayTeam,
  date,
  time,
  court,
  status,
}: {
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  court: string;
  status: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span>{homeTeam}</span>
          <span className="text-muted-foreground">vs</span>
          <span>{awayTeam}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {date} · {time} · {court}
        </p>
      </div>
      <Badge variant="outline">
        {status === "SCHEDULED" ? "Programado" : status}
      </Badge>
    </div>
  );
}

function TrainingItem({
  title,
  date,
  time,
  facility,
  attendees,
  total,
}: {
  title: string;
  date: string;
  time: string;
  facility: string;
  attendees: number;
  total: number;
}) {
  const percentage = Math.round((attendees / total) * 100);
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">
            {date} · {time} · {facility}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">
            {attendees}/{total}
          </p>
          <div className="mt-1 h-1.5 w-16 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StandingRow({
  position,
  team,
  points,
  wins,
  losses,
  sets,
  highlight,
}: {
  position: number;
  team: string;
  points: number;
  wins: number;
  losses: number;
  sets: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
        highlight ? "bg-primary/5 border border-primary/20" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="w-6 text-center font-bold text-muted-foreground">
          {position}º
        </span>
        <span className={`font-medium ${highlight ? "text-primary" : ""}`}>
          {team}
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>{wins}V</span>
        <span>{losses}D</span>
        <span>{sets}</span>
        <span className="w-8 text-right font-bold text-foreground">
          {points}
        </span>
      </div>
    </div>
  );
}

function ActivityItem({
  type,
  text,
  time,
}: {
  type: "result" | "convocation" | "training" | "general";
  text: string;
  time: string;
}) {
  const icons = {
    result: <CheckCircle className="h-4 w-4 text-green-500" />,
    convocation: <AlertCircle className="h-4 w-4 text-yellow-500" />,
    training: <Calendar className="h-4 w-4 text-blue-500" />,
    general: <TrendingUp className="h-4 w-4 text-gray-500" />,
  };

  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">{icons[type]}</div>
      <div className="flex-1">
        <p className="text-sm">{text}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}