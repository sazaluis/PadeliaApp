"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Medal, TrendingUp, TrendingDown, Minus, Calendar, Building2 } from "lucide-react";

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

export default function LeaguePage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const userClubId = (session?.user as any)?.clubId;
  
  const [standings, setStandings] = useState<Standing[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClubId, setSelectedClubId] = useState<string>(userClubId || "");

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
        .catch(() => {});
    }
  }, [userRole]);

  useEffect(() => {
    async function fetchStandings() {
      setLoading(true);
      try {
        let url = "/api/standings";
        const params = new URLSearchParams();
        
        if (userRole === "GLOBAL_ADMIN" && selectedClubId) {
          // For admin, we need to get leagues for this club first
          const leaguesRes = await fetch(`/api/leagues?clubId=${selectedClubId}`);
          if (leaguesRes.ok) {
            const leagues = await leaguesRes.json();
            if (leagues.length > 0) {
              params.append("leagueId", leagues[0].id);
            }
          }
        } else if (userClubId) {
          // For non-admin users, get their club's leagues
          const leaguesRes = await fetch(`/api/leagues`);
          if (leaguesRes.ok) {
            const leagues = await leaguesRes.json();
            if (leagues.length > 0) {
              params.append("leagueId", leagues[0].id);
            }
          }
        }
        
        if (params.toString()) {
          const res = await fetch(`${url}?${params.toString()}`);
          if (res.ok) {
            const data = await res.json();
            setStandings(data);
          }
        }
      } catch (error) {
        console.error("Error fetching standings:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchStandings();
  }, [selectedClubId, userClubId, userRole]);

  const getPositionIcon = (pos: number) => {
    if (pos === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (pos === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (pos === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="w-5 text-center text-sm font-bold text-muted-foreground">{pos}</span>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
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

        {/* League Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Liga Senior Masculina</CardTitle>
                <CardDescription>Temporada 2024-2025</CardDescription>
              </div>
              <Badge variant="success">En curso</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-primary">10</p>
                <p className="text-sm text-muted-foreground">Jornadas</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">8</p>
                <p className="text-sm text-muted-foreground">Equipos</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">40</p>
                <p className="text-sm text-muted-foreground">Partidos jugados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Standings Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Clasificación
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (
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
                    {standings.map((s, idx) => (
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
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}