"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Medal, TrendingUp, TrendingDown, Minus, Calendar, Building2, ExternalLink, AlertCircle, Link2 } from "lucide-react";

// TODO: Definir interfaces reales cuando se implemente la integración con las ligas externas
interface Standing {
  id: string;
  position: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
  points: number;
  team: {
    id: string;
    name: string;
    category: string;
    club: { name: string };
  };
}

interface Club {
  id: string;
  name: string;
  city: string;
}

// TODO: Definir tipo para las ligas externas cuando se implemente la integración
interface ExternalLeague {
  id: string;
  name: string;
  shortName: string;
  description: string;
  status: "EN_CURSO" | "PENDIENTE_SINCRONIZACION" | "SIN_CONECTAR";
  requiresLogin: boolean;
  officialUrl: string;
  logo?: string;
}

// Datos de ejemplo - TODO: Reemplazar con datos reales de la API
const MOCK_LEAGUES: ExternalLeague[] = [
  {
    id: "snp",
    name: "Series Nacionales de Pádel",
    shortName: "SNP",
    description: "Competición oficial de la Federación Española de Pádel",
    status: "EN_CURSO",
    requiresLogin: true,
    officialUrl: "https://seriesnacionalesdepadel.com/",
    logo: undefined,
  },
  {
    id: "ptl",
    name: "Padel Team League",
    shortName: "PTL",
    description: "Liga profesional por equipos - Bullpadel",
    status: "PENDIENTE_SINCRONIZACION",
    requiresLogin: false,
    officialUrl: "https://www.ptlcompetition.com/",
    logo: undefined,
  },
  {
    id: "ipt",
    name: "Interclubes Padel Tour",
    shortName: "IPT",
    description: "Circuito interclubes nacional",
    status: "SIN_CONECTAR",
    requiresLogin: true,
    officialUrl: "http://www.interclubespadeltour.com/",
    logo: undefined,
  },
];

// Datos de ejemplo para clasificación - TODO: Reemplazar con datos reales
const MOCK_STANDINGS: Standing[] = [
  {
    id: "1",
    position: 1,
    matchesPlayed: 10,
    wins: 8,
    losses: 2,
    setsWon: 16,
    setsLost: 6,
    gamesWon: 120,
    gamesLost: 85,
    points: 24,
    team: {
      id: "1",
      name: "Padel Club Barcelona A",
      category: "Masculino",
      club: { name: "Padel Club Barcelona" },
    },
  },
  {
    id: "2",
    position: 2,
    matchesPlayed: 10,
    wins: 7,
    losses: 3,
    setsWon: 14,
    setsLost: 8,
    gamesWon: 110,
    gamesLost: 90,
    points: 21,
    team: {
      id: "2",
      name: "Club Tennis Reus",
      category: "Masculino",
      club: { name: "Club Tennis Reus" },
    },
  },
  {
    id: "3",
    position: 3,
    matchesPlayed: 10,
    wins: 6,
    losses: 4,
    setsWon: 12,
    setsLost: 10,
    gamesWon: 100,
    gamesLost: 95,
    points: 18,
    team: {
      id: "3",
      name: "Padel Club Tarragona",
      category: "Masculino",
      club: { name: "Padel Club Tarragona" },
    },
  },
];

export default function LeaguePage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const userClubId = (session?.user as any)?.clubId;

  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClubId, setSelectedClubId] = useState<string>(userClubId || "");
  const [selectedLeague, setSelectedLeague] = useState<string>("snp");

  useEffect(() => {
    if (userRole === "GLOBAL_ADMIN") {
      fetch("/api/clubs")
        .then(r => r.json())
        .then(data => {
          setClubs(Array.isArray(data) ? data : []);
          if (!selectedClubId && data.length > 0) {
            setSelectedClubId(data[0].id);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [userRole]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "EN_CURSO":
        return <Badge variant="success" className="gap-1.5 py-1 px-3">En curso</Badge>;
      case "PENDIENTE_SINCRONIZACION":
        return <Badge variant="outline" className="gap-1.5 py-1 px-3 border-yellow-500 text-yellow-700">Pendiente de sincronizar</Badge>;
      case "SIN_CONECTAR":
        return <Badge variant="secondary" className="gap-1.5 py-1 px-3">Sin conectar</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPositionIcon = (pos: number) => {
    if (pos === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (pos === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (pos === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="w-5 text-center text-sm font-bold text-muted-foreground">{pos}</span>;
  };

  const renderLeagueContent = (league: ExternalLeague) => {
    // Estado: Sin conectar / No vinculado
    if (league.status === "SIN_CONECTAR") {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <Link2 className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aún no has vinculado tu equipo a esta liga</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Conecta tu equipo con {league.name} para ver la clasificación y resultados.
            </p>
            <Button variant="outline" className="gap-2">
              <Link2 className="h-4 w-4" />
              Configurar vínculo
            </Button>
          </CardContent>
        </Card>
      );
    }

    // Estado: Pendiente de sincronizar
    if (league.status === "PENDIENTE_SINCRONIZACION") {
      return (
        <>
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-900">
                    Datos pendientes de sincronización
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    La última sincronización fue hace más de 24 horas. Los datos pueden no estar actualizados.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clasificación con datos de ejemplo */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    Clasificación
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Datos de muestra — pendiente de integración
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  Ejemplo
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 pr-4 w-12">#</th>
                      <th className="pb-3 pr-4">Equipo</th>
                      <th className="pb-3 pr-4 text-center">PJ</th>
                      <th className="pb-3 pr-4 text-center">V</th>
                      <th className="pb-3 pr-4 text-center">D</th>
                      <th className="pb-3 pr-4 text-center">Sets</th>
                      <th className="pb-3 pr-4 text-center">Juegos</th>
                      <th className="pb-3 text-center font-bold">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_STANDINGS.map((s, idx) => (
                      <tr
                        key={s.id}
                        className={`border-b transition-colors hover:bg-muted/50 ${
                          idx < 2 ? "bg-primary/5" : ""
                        }`}
                      >
                        <td className="py-3 pr-4">
                          <div className="flex items-center">{getPositionIcon(s.position)}</div>
                        </td>
                        <td className="py-3 pr-4">
                          <div>
                            <p className="font-medium">{s.team.name}</p>
                            <p className="text-xs text-muted-foreground">{s.team.club.name}</p>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-center">{s.matchesPlayed}</td>
                        <td className="py-3 pr-4 text-center text-green-600 font-medium">{s.wins}</td>
                        <td className="py-3 pr-4 text-center text-red-600 font-medium">{s.losses}</td>
                        <td className="py-3 pr-4 text-center">
                          <span className={s.setsWon > s.setsLost ? "text-green-600" : s.setsWon < s.setsLost ? "text-red-600" : ""}>
                            {s.setsWon}-{s.setsLost}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-center">
                          <span className={s.gamesWon > s.gamesLost ? "text-green-600" : s.gamesWon < s.gamesLost ? "text-red-600" : ""}>
                            {s.gamesWon}-{s.gamesLost}
                          </span>
                        </td>
                        <td className="py-3 text-center font-bold text-lg">{s.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-4 text-center italic">
                Datos de ejemplo — TODO: Integrar con API de {league.name}
              </p>
            </CardContent>
          </Card>
        </>
      );
    }

    // Estado: En curso
    return (
      <>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Clasificación
                </CardTitle>
                <CardDescription className="mt-1">
                  Datos de muestra — pendiente de integración
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                Ejemplo
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 w-12">#</th>
                    <th className="pb-3 pr-4">Equipo</th>
                    <th className="pb-3 pr-4 text-center">PJ</th>
                    <th className="pb-3 pr-4 text-center">V</th>
                    <th className="pb-3 pr-4 text-center">D</th>
                    <th className="pb-3 pr-4 text-center">Sets</th>
                    <th className="pb-3 pr-4 text-center">Juegos</th>
                    <th className="pb-3 text-center font-bold">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_STANDINGS.map((s, idx) => (
                    <tr
                      key={s.id}
                      className={`border-b transition-colors hover:bg-muted/50 ${
                        idx < 2 ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="py-3 pr-4">
                        <div className="flex items-center">{getPositionIcon(s.position)}</div>
                      </td>
                      <td className="py-3 pr-4">
                        <div>
                          <p className="font-medium">{s.team.name}</p>
                          <p className="text-xs text-muted-foreground">{s.team.club.name}</p>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-center">{s.matchesPlayed}</td>
                      <td className="py-3 pr-4 text-center text-green-600 font-medium">{s.wins}</td>
                      <td className="py-3 pr-4 text-center text-red-600 font-medium">{s.losses}</td>
                      <td className="py-3 pr-4 text-center">
                        <span className={s.setsWon > s.setsLost ? "text-green-600" : s.setsWon < s.setsLost ? "text-red-600" : ""}>
                          {s.setsWon}-{s.setsLost}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-center">
                        <span className={s.gamesWon > s.gamesLost ? "text-green-600" : s.gamesWon < s.gamesLost ? "text-red-600" : ""}>
                          {s.gamesWon}-{s.gamesLost}
                        </span>
                      </td>
                      <td className="py-3 text-center font-bold text-lg">{s.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center italic">
              Datos de ejemplo — TODO: Integrar con API de {league.name}
            </p>
          </CardContent>
        </Card>
      </>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header con selector de club */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Liga</h1>
            <p className="text-muted-foreground">Clasificación y calendario de competiciones</p>
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

        {/* Tabs de ligas externas */}
        <Tabs value={selectedLeague} onValueChange={setSelectedLeague} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            {MOCK_LEAGUES.map((league) => (
              <TabsTrigger key={league.id} value={league.id} className="gap-2">
                <span className="font-semibold">{league.shortName}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {MOCK_LEAGUES.map((league) => (
            <TabsContent key={league.id} value={league.id} className="space-y-4">
              {/* Cabecera de la liga */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {/* Logo placeholder - TODO: Reemplazar con logo real cuando esté disponible */}
                      <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                        <Trophy className="h-8 w-8 text-muted-foreground opacity-50" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{league.name}</CardTitle>
                        <CardDescription className="mt-1">{league.description}</CardDescription>
                        <div className="mt-3">
                          {getStatusBadge(league.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="default"
                      className="gap-2"
                      onClick={() => window.open(league.officialUrl, "_blank", "noopener,noreferrer")}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Ver en {league.shortName}
                    </Button>
                    {league.requiresLogin && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Algunos datos requieren iniciar sesión en la plataforma oficial
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Contenido de la liga (clasificación o estado vacío) */}
              {renderLeagueContent(league)}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}