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
  Building2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

interface Standing {
  position: number;
  team: { name: string };
  points: number;
  wins: number;
  losses: number;
  setsWon: number;
  setsLost: number;
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
  const [standings, setStandings] = useState<Standing[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string>(userClubId || "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        console.log("🔍 Dashboard: Iniciando carga de datos...");
        console.log("👤 Usuario:", session?.user);
        console.log("🏢 Club ID:", userClubId);
        console.log("🔑 Rol:", userRole);

        // Si es administrador global, cargar lista de clubs
        if (userRole === "GLOBAL_ADMIN") {
          console.log("👑 Modo administrador global detectado");
          const clubsRes = await fetch("/api/clubs");
          if (clubsRes.ok) {
            const clubsData = await clubsRes.json();
            console.log("📊 Clubs disponibles:", clubsData);
            setClubs(clubsData);
            
            // Si no hay club seleccionado y hay clubs, seleccionar el primero
            if (!selectedClubId && clubsData.length > 0) {
              setSelectedClubId(clubsData[0].id);
            }
          }
        }

        // Si no hay clubId para cargar datos específicos, salir
        if (!selectedClubId) {
          console.log("⚠️ No hay clubId seleccionado");
          setLoading(false);
          return;
        }

        // Fetch teams
        const teamsUrl = `/api/teams?clubId=${selectedClubId}&deleted=false`;
        console.log("📡 Fetching teams from:", teamsUrl);
        const teamsRes = await fetch(teamsUrl);
        console.log("✅ Teams response status:", teamsRes.status);
        if (teamsRes.ok) {
          const teamsData = await teamsRes.json();
          console.log("📊 Teams data:", teamsData);
          setTeams(teamsData);
        } else {
          console.error("❌ Error fetching teams:", teamsRes.status, teamsRes.statusText);
        }

        // Fetch upcoming matches (next 7 days)
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        const matchesUrl = `/api/matches?clubId=${selectedClubId}&status=SCHEDULED&startDate=${today.toISOString()}&endDate=${nextWeek.toISOString()}`;
        console.log("📡 Fetching matches from:", matchesUrl);
        const matchesRes = await fetch(matchesUrl);
        console.log("✅ Matches response status:", matchesRes.status);
        if (matchesRes.ok) {
          const matchesData = await matchesRes.json();
          console.log("📊 Matches data:", matchesData);
          setMatches(matchesData.slice(0, 5));
        } else {
          console.error("❌ Error fetching matches:", matchesRes.status, matchesRes.statusText);
        }

        // Fetch upcoming trainings (next 7 days)
        const trainingsUrl = `/api/trainings?clubId=${selectedClubId}&startDate=${today.toISOString()}&endDate=${nextWeek.toISOString()}`;
        console.log("📡 Fetching trainings from:", trainingsUrl);
        const trainingsRes = await fetch(trainingsUrl);
        console.log("✅ Trainings response status:", trainingsRes.status);
        if (trainingsRes.ok) {
          const trainingsData = await trainingsRes.json();
          console.log("📊 Trainings data:", trainingsData);
          setTrainings(trainingsData.slice(0, 5));
        } else {
          console.error("❌ Error fetching trainings:", trainingsRes.status, trainingsRes.statusText);
        }

        // Fetch standings (first active league for the club)
        const leaguesUrl = `/api/leagues?clubId=${selectedClubId}`;
        console.log("📡 Fetching leagues from:", leaguesUrl);
        const leaguesRes = await fetch(leaguesUrl);
        console.log("✅ Leagues response status:", leaguesRes.status);
        if (leaguesRes.ok) {
          const leaguesData = await leaguesRes.json();
          console.log("📊 Leagues data:", leaguesData);
          if (leaguesData.length > 0) {
            const standingsUrl = `/api/standings?leagueId=${leaguesData[0].id}`;
            console.log("📡 Fetching standings from:", standingsUrl);
            const standingsRes = await fetch(standingsUrl);
            console.log("✅ Standings response status:", standingsRes.status);
            if (standingsRes.ok) {
              const standingsData = await standingsRes.json();
              console.log("📊 Standings data:", standingsData);
              setStandings(standingsData.slice(0, 8));
            } else {
              console.error("❌ Error fetching standings:", standingsRes.status, standingsRes.statusText);
            }
          } else {
            console.log("⚠️ No leagues found for this club");
          }
        } else {
          console.error("❌ Error fetching leagues:", leaguesRes.status, leaguesRes.statusText);
        }
      } catch (error) {
        console.error("❌ Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
        console.log("✅ Dashboard: Carga de datos finalizada");
      }
    }

    if (session) {
      fetchData();
    }
  }, [session, userClubId, selectedClubId, userRole]);

  // Calculate stats
  const totalTeams = teams.length;
  const upcomingTrainings = trainings.length;
  const upcomingMatches = matches.length;

  // Get user's team for standings highlight
  const userPlayer = (session?.user as any)?.player;
  const userTeamId = userPlayer?.teamId;
  const userTeam = teams.find(t => t.id === userTeamId);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Cargando...
            </h1>
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
            trend={`${teams.reduce((acc, t) => acc + t._count.players, 0)} jugadores totales`}
          />
          <StatCard
            title="Próximos Entrenamientos"
            value={upcomingTrainings.toString()}
            description="Esta semana"
            icon={Calendar}
            trend={
              trainings.length > 0
                ? `Próximo: ${trainings[0].startTime}`
                : "Sin entrenamientos"
            }
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
          />
          <StatCard
            title="Clasificación"
            value={
              userTeam
                ? `${userTeam.name}`
                : standings.length > 0
                ? `${standings[0].team.name}`
                : "N/A"
            }
            description={
              userTeam
                ? `Posición ${standings.find(s => s.team.name === userTeam.name)?.position || "-"}`
                : standings.length > 0
                ? "Liga activa"
                : "Sin liga activa"
            }
            icon={Trophy}
            trend={
              userTeam
                ? `${standings.find(s => s.team.name === userTeam.name)?.points || 0} puntos`
                : standings.length > 0
                ? `${standings[0].points} puntos (1º)`
                : "-"
            }
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
                      date={new Date(match.matchDate).toLocaleDateString("es-ES", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                      time={match.matchTime || "TBD"}
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
                      date={new Date(training.date).toLocaleDateString("es-ES", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                      time={`${training.startTime}${training.endTime ? ` - ${training.endTime}` : ""}`}
                      facility={training.facility || "Por determinar"}
                      attendees={training._count?.players || 0}
                      total={teams.find(t => t.id === training.team.id)?._count.players || 10}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Standing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Clasificación
              </CardTitle>
              <CardDescription>
                {standings.length > 0 ? "Liga activa" : "Sin liga activa"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {standings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay clasificación disponible
                </p>
              ) : (
                <div className="space-y-2">
                  {standings.map(standing => (
                    <StandingRow
                      key={standing.team.name}
                      position={standing.position}
                      team={standing.team.name}
                      points={standing.points}
                      wins={standing.wins}
                      losses={standing.losses}
                      sets={`+${standing.setsWon - standing.setsLost}`}
                      highlight={userTeam?.name === standing.team.name}
                    />
                  ))}
                </div>
              )}
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
                {matches.slice(0, 2).map(match => (
                  <ActivityItem
                    key={match.id}
                    type="result"
                    text={`Partido programado: ${match.homeTeam.name} vs ${match.awayTeam.name}`}
                    time={new Date(match.matchDate).toLocaleDateString("es-ES")}
                  />
                ))}
                {trainings.slice(0, 2).map(training => (
                  <ActivityItem
                    key={training.id}
                    type="training"
                    text={`Entrenamiento: ${training.title}`}
                    time={new Date(training.date).toLocaleDateString("es-ES")}
                  />
                ))}
                {matches.length === 0 && trainings.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Sin actividad reciente
                  </p>
                )}
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
  const percentage = total > 0 ? Math.round((attendees / total) * 100) : 0;
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