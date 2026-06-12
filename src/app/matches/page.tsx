"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Swords, Calendar, Clock, MapPin } from "lucide-react";

interface Match {
  id: string;
  matchDate: string;
  matchTime?: string;
  court?: string;
  status: string;
  homeTeam: { id: string; name: string; category: string };
  awayTeam: { id: string; name: string; category: string };
  matchday?: { number: number; name?: string };
  result?: {
    totalSetsHome: number;
    totalSetsAway: number;
    pair1SetsHome: number;
    pair1SetsAway: number;
    pair2SetsHome: number;
    pair2SetsAway: number;
    pair3SetsHome: number;
    pair3SetsAway: number;
  };
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    // Demo data
    const demoMatches: Match[] = [
      { id: "1", matchDate: "2024-09-15", matchTime: "10:00", court: "Pista 1", status: "COMPLETED", homeTeam: { id: "t1", name: "Padel Club A", category: "MALE" }, awayTeam: { id: "t2", name: "TC Barcelona", category: "MALE" }, matchday: { number: 1 }, result: { totalSetsHome: 2, totalSetsAway: 1, pair1SetsHome: 6, pair1SetsAway: 4, pair2SetsHome: 4, pair2SetsAway: 6, pair3SetsHome: 7, pair3SetsAway: 5 } },
      { id: "2", matchDate: "2024-09-22", matchTime: "10:00", court: "Pista 2", status: "COMPLETED", homeTeam: { id: "t3", name: "Padel Club B", category: "MALE" }, awayTeam: { id: "t4", name: "CD Tennis", category: "MALE" }, matchday: { number: 2 }, result: { totalSetsHome: 1, totalSetsAway: 2, pair1SetsHome: 3, pair1SetsAway: 6, pair2SetsHome: 6, pair2SetsAway: 4, pair3SetsHome: 5, pair3SetsAway: 7 } },
      { id: "3", matchDate: "2024-09-29", matchTime: "10:00", court: "Pista 1", status: "SCHEDULED", homeTeam: { id: "t1", name: "Padel Club A", category: "MALE" }, awayTeam: { id: "t3", name: "Real Padel", category: "MALE" }, matchday: { number: 3 } },
      { id: "4", matchDate: "2024-09-29", matchTime: "12:00", court: "Pista 3", status: "SCHEDULED", homeTeam: { id: "t2", name: "CD Tennis", category: "MALE" }, awayTeam: { id: "t5", name: "ATM Padel", category: "MALE" }, matchday: { number: 3 } },
      { id: "5", matchDate: "2024-10-06", matchTime: "10:00", court: "Pista 1", status: "SCHEDULED", homeTeam: { id: "t1", name: "Padel Club A", category: "MALE" }, awayTeam: { id: "t4", name: "Club Natación", category: "MALE" }, matchday: { number: 4 } },
    ];
    setMatches(demoMatches);
    setLoading(false);
  }, []);

  const filtered = matches.filter((m) => {
    if (filter === "ALL") return true;
    return m.status === filter;
  });

  const formatDate = (d: string) =>
    new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "2-digit", month: "short" }).format(new Date(d));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED": return <Badge variant="success">Jugado</Badge>;
      case "SCHEDULED": return <Badge variant="outline">Programado</Badge>;
      case "IN_PROGRESS": return <Badge>En curso</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Partidos</h1>
          <p className="text-muted-foreground">Gestión de partidos de liga</p>
        </div>

        <div className="flex gap-2">
          {[
            { key: "ALL", label: "Todos" },
            { key: "SCHEDULED", label: "Programados" },
            { key: "COMPLETED", label: "Jugados" },
          ].map((f) => (
            <Button key={f.key} variant={filter === f.key ? "default" : "outline"} size="sm" onClick={() => setFilter(f.key)}>
              {f.label}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        ) : (
          <div className="space-y-3">
            {filtered.map((match) => (
              <Card key={match.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Calendar className="h-4 w-4" />
                        <span>Jornada {match.matchday?.number}</span>
                        <span>·</span>
                        <span>{formatDate(match.matchDate)}</span>
                        {match.matchTime && <><span>·</span><span className="flex items-center gap-1"><Clock className="h-3 w-3" />{match.matchTime}</span></>}
                        {match.court && <><span>·</span><span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{match.court}</span></>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-lg">{match.homeTeam.name}</span>
                        <Swords className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold text-lg">{match.awayTeam.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {match.result && (
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {match.result.totalSetsHome} - {match.result.totalSetsAway}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {match.result.pair1SetsHome}-{match.result.pair1SetsAway} · {match.result.pair2SetsHome}-{match.result.pair2SetsAway} · {match.result.pair3SetsHome}-{match.result.pair3SetsAway}
                          </div>
                        </div>
                      )}
                      {getStatusBadge(match.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}