"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, TrendingUp, TrendingDown, Minus, Calendar } from "lucide-react";

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

export default function LeaguePage() {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use demo data for now
    const demoStandings: Standing[] = [
      { id: "1", position: 1, matchesPlayed: 10, wins: 8, losses: 2, setsWon: 22, setsLost: 10, gamesWon: 180, gamesLost: 130, points: 24, team: { id: "t1", name: "TC Barcelona", category: "MALE", club: { name: "TC Barcelona" } } },
      { id: "2", position: 2, matchesPlayed: 10, wins: 7, losses: 3, setsWon: 19, setsLost: 11, gamesWon: 165, gamesLost: 140, points: 21, team: { id: "t2", name: "Padel Club A", category: "MALE", club: { name: "Padel Club Barcelona" } } },
      { id: "3", position: 3, matchesPlayed: 10, wins: 6, losses: 4, setsWon: 17, setsLost: 12, gamesWon: 155, gamesLost: 145, points: 18, team: { id: "t3", name: "Real Padel", category: "MALE", club: { name: "Real Padel" } } },
      { id: "4", position: 4, matchesPlayed: 10, wins: 5, losses: 5, setsWon: 15, setsLost: 14, gamesWon: 145, gamesLost: 150, points: 15, team: { id: "t4", name: "CD Tennis", category: "MALE", club: { name: "CD Tennis" } } },
      { id: "5", position: 5, matchesPlayed: 10, wins: 4, losses: 6, setsWon: 13, setsLost: 16, gamesWon: 135, gamesLost: 155, points: 12, team: { id: "t5", name: "Padel Club B", category: "MALE", club: { name: "Padel Club Barcelona" } } },
      { id: "6", position: 6, matchesPlayed: 10, wins: 3, losses: 7, setsWon: 10, setsLost: 18, gamesWon: 120, gamesLost: 160, points: 9, team: { id: "t6", name: "ATM Padel", category: "MALE", club: { name: "ATM Padel" } } },
      { id: "7", position: 7, matchesPlayed: 10, wins: 2, losses: 8, setsWon: 8, setsLost: 20, gamesWon: 100, gamesLost: 170, points: 6, team: { id: "t7", name: "Club Natación", category: "MALE", club: { name: "Club Natación" } } },
      { id: "8", position: 8, matchesPlayed: 10, wins: 1, losses: 9, setsWon: 5, setsLost: 23, gamesWon: 85, gamesLost: 185, points: 3, team: { id: "t8", name: "Uni Padel", category: "MALE", club: { name: "Uni Padel" } } },
    ];
    setStandings(demoStandings);
    setLoading(false);
  }, []);

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