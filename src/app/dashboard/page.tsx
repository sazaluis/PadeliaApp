"use client";

import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Calendar,
  Swords,
  Building2,
  ClipboardList,
  Bell,
  UserCheck,
  AlertCircle,
  Trophy,
  ExternalLink,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

interface Team {
  id: string;
  name: string;
  category: string;
  club: { name: string };
  _count: { players: number };
}

interface Match {
  id: string;
  matchDate: string;
  matchTime: string | null;
  court: string | null;
  status: string;
  homeTeam: { id: string; name: string; category: string };
  awayTeam: { id: string; name: string; category: string };
  matchday?: { number: number; name: string };
  result?: { id: string; homeScore: number; awayScore: number } | null;
}

interface Training {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string | null;
  facility: string | null;
  team: { id: string; name: string };
  _count?: { players: number };
}

interface Convocatoria {
  id: string;
  teamId: string;
  rival: string;
  matchDate: string;
  deadline: string;
  status: "BORRADOR" | "ENVIADA";
  confirmados: number;
  totalJugadores: number;
  team: { id: string; name: string; category: string };
}

interface Club {
  id: string;
  name: string;
  city: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const userClubId = (session?.user as any)?.clubId;

  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string>(userClubId || "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Si es administrador global, cargar lista de clubs
        if (userRole === "GLOBAL_ADMIN") {
          const clubsRes = await fetch("/api/clubs");
          if (clubsRes.ok) {
            const clubsData = await clubsRes.json();
            setClubs(clubsData);
            
            // Si no hay club seleccionado y hay clubs, seleccionar el primero
            if (!selectedClubId && clubsData.length > 0) {
              setSelectedClubId(clubsData[0].id);
            }
          }
        }

        // Si no hay clubId para cargar datos específicos, salir
        if (!selectedClubId) {
          setLoading(false);
          return;
        }

        // Fetch teams
        const teamsUrl = `/api/teams?clubId=${selectedClubId}&deleted=false`;
        const teamsRes = await fetch(teamsUrl);
        if (teamsRes.ok) {
          const teamsData = await teamsRes.json();
          setTeams(teamsData);
        }

        // Fetch upcoming matches (next 7 days)
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        const matchesUrl = `/api/matches?clubId=${selectedClubId}&status=SCHEDULED&startDate=${today.toISOString()}&endDate=${nextWeek.toISOString()}`;
        const matchesRes = await fetch(matchesUrl);
        if (matchesRes.ok) {
          const matchesData = await matchesRes.json();
          setMatches(matchesData.slice(0, 5));
        }

        // Fetch upcoming trainings (next 7 days)
        const trainingsUrl = `/api/trainings?clubId=${selectedClubId}&startDate=${today.toISOString()}&endDate=${nextWeek.toISOString()}`;
        const trainingsRes = await fetch(trainingsUrl);
        if (trainingsRes.ok) {
          const trainingsData = await trainingsRes.json();
          setTrainings(trainingsData.slice(0, 5));
        }

        // Fetch convocatorias pendientes
        const convocatoriasUrl = `/api/convocatorias?clubId=${selectedClubId}`;
        const convocatoriasRes = await fetch(convocatoriasUrl);
        if (convocatoriasRes.ok) {
          const convocatoriasData = await convocatoriasRes.json();
          // Filtrar convocatorias pendientes (sin completar)
          const pending = convocatoriasData.filter((c: Convocatoria) => 
            c.status === "BORRADOR" || c.confirmados < c.totalJugadores
          );
          setConvocatorias(pending.slice(0, 5));
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (session) {
      fetchData();
    }
  }, [session, userClubId, selectedClubId, userRole]);

  // Calculate stats
  const totalTeams = teams.length;
  const totalPlayers = teams.reduce((acc, t) => acc + (t._count?.players || 0), 0);
  const upcomingTrainings = trainings.length;
  const upcomingMatches = matches.length;

  // Formato de fecha completo
  const formatFullDate = (date: Date, time: string) => {
    const dateStr = date.toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    return `${dateStr} · ${time}`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cargando...</h1>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-20 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Welcome */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Bienvenido, {session?.user?.name || "Usuario"}
              </h1>
              <p className="text-muted-foreground">
                Panel de control - {getRoleLabel(userRole)}
              </p>
            </div>
            {userRole === "GLOBAL_ADMIN" && clubs.length > 0 && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedClubId} onValueChange={setSelectedClubId}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Seleccionar club" />
                  </SelectTrigger>
                  <SelectContent>
                    {clubs.map(club => (
                      <SelectItem key={club.id} value={club.id}>
                        {club.name} - {club.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Equipos"
            value={totalTeams.toString()}
            description={`${teams.filter(t => t.category === "MASCULINO").length} masculinos, ${teams.filter(t => t.category === "FEMENINO").length} femeninos, ${teams.filter(t => t.category === "MIXTO").length} mixtos`}
            icon={Users}
            trend={`${totalPlayers} jugadores totales`}
            href="/teams"
          />
          <StatCard
            title="Próximos Entrenamientos"
            value={upcomingTrainings.toString()}
            description="Esta semana"
            icon={Calendar}
            trend={
              trainings.length > 0
                ? formatFullDate(new Date(trainings[0].date), trainings[0].startTime)
                : "Sin entrenamientos"
            }
            href="/trainings"
          />
          <StatCard
            title="Partidos Pendientes"
            value={upcomingMatches.toString()}
            description="Próximos 7 días"
            icon={Swords}
            trend={
              matches.length > 0
                ? `${matches[0].homeTeam.name} vs ${matches[0].awayTeam.name}`
                : "Sin partidos"
            }
            href="/matches"
          />
          <StatCard
            title="Jugadores"
            value={totalPlayers.toString()}
            description="En el club"
            icon={UserCheck}
            trend={`${teams.length} equipos`}
            href="/players"
          />
        </div>

        {/* Tareas Pendientes / Resumen de Actividad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Tareas Pendientes
            </CardTitle>
            <CardDescription>
              Acciones que requieren tu atención
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Convocatorias sin completar */}
              <PendingItem
                title="Convocatorias pendientes"
                count={convocatorias.length}
                icon={ClipboardList}
                items={convocatorias.map(c => ({
                  id: c.id,
                  title: `${c.team.name} vs ${c.rival}`,
                  subtitle: `${c.confirmados}/${c.totalJugadores} confirmados`,
                  href: `/convocations`,
                  status: c.status === "BORRADOR" ? "Borrador" : "Enviada",
                }))}
                emptyMessage="No hay convocatorias pendientes"
              />

              {/* Partidos sin resultado */}
              <PendingItem
                title="Partidos sin resultado"
                count={matches.filter(m => !m.result).length}
                icon={Swords}
                items={matches
                  .filter(m => !m.result)
                  .map(m => ({
                    id: m.id,
                    title: `${m.homeTeam.name} vs ${m.awayTeam.name}`,
                    subtitle: formatFullDate(new Date(m.matchDate), m.matchTime || "TBD"),
                    href: `/matches/${m.id}`,
                    status: "Pendiente",
                  }))}
                emptyMessage="No hay partidos pendientes de resultado"
              />

              {/* Próxima jornada de Liga */}
              <Card className="border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    Próxima jornada
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Consulta las clasificaciones externas
                    </p>
                    <Link href="/league">
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Ver Liga
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Acción rápida */}
              <Card className="border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-primary" />
                    Acción rápida
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Crea una nueva convocatoria
                    </p>
                    <Link href="/convocations">
                      <Button size="sm" className="w-full gap-2">
                        <ClipboardList className="h-3.5 w-3.5" />
                        Nueva Convocatoria
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

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
              {matches.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay partidos programados
                </p>
              ) : (
                <div className="space-y-4">
                  {matches.map(match => (
                    <MatchItem
                      key={match.id}
                      homeTeam={match.homeTeam.name}
                      awayTeam={match.awayTeam.name}
                      date={formatFullDate(new Date(match.matchDate), match.matchTime || "TBD")}
                      court={match.court || "Por determinar"}
                      status={match.status}
                    />
                  ))}
                </div>
              )}
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
              {trainings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay entrenamientos programados
                </p>
              ) : (
                <div className="space-y-4">
                  {trainings.map(training => (
                    <TrainingItem
                      key={training.id}
                      title={training.title}
                      date={formatFullDate(new Date(training.date), `${training.startTime}${training.endTime ? ` - ${training.endTime}` : ""}`)}
                      facility={training.facility || "Por determinar"}
                      attendees={training._count?.players || 0}
                      total={teams.find(t => t.id === training.team.id)?._count.players || 10}
                    />
                  ))}
                </div>
              )}
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
  href,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  trend: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="cursor-pointer transition-shadow hover:shadow-md">
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
    </Link>
  );
}

function PendingItem({
  title,
  count,
  icon: Icon,
  items,
  emptyMessage,
}: {
  title: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  items: Array<{
    id: string;
    title: string;
    subtitle: string;
    href: string;
    status: string;
  }>;
  emptyMessage: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </h3>
        {count > 0 && (
          <Badge variant="secondary" className="text-xs">
            {count}
          </Badge>
        )}
      </div>
      {count === 0 ? (
        <p className="text-xs text-muted-foreground py-2">{emptyMessage}</p>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-start justify-between rounded-lg border p-2.5 transition-colors hover:bg-muted/50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.subtitle}</p>
              </div>
              <Badge variant="outline" className="text-xs ml-2">
                {item.status}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function MatchItem({
  homeTeam,
  awayTeam,
  date,
  court,
  status,
}: {
  homeTeam: string;
  awayTeam: string;
  date: string;
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
          {date} · {court}
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
  facility,
  attendees,
  total,
}: {
  title: string;
  date: string;
  facility: string;
  attendees: number;
  total: number;
}) {
  const percentage = total > 0 ? Math.round((attendees / total) * 100) : 0;
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">
            {date} · {facility}
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