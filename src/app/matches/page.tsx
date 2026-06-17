"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Swords, Calendar, Clock, MapPin, Link2, Building2 } from "lucide-react";

interface Match {
  id: string;
  matchDate: string;
  matchTime?: string;
  court?: string;
  status: string;
  homeTeam: { id: string; name: string; category: string; clubId?: string };
  awayTeam: { id: string; name: string; category: string; clubId?: string };
  matchday?: { number: number; name?: string };
  convocation?: { id: string; rival?: string };
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

interface Club {
  id: string;
  name: string;
  city: string;
}

export default function MatchesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const userRole = (session?.user as any)?.role;
  const userClubId = (session?.user as any)?.clubId;
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
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
    fetchMatches();
  }, [selectedClubId]);

  const fetchMatches = async () => {
    try {
      let url = "/api/matches";
      const params = new URLSearchParams();
      
      if (userRole === "GLOBAL_ADMIN" && selectedClubId) {
        params.append("clubId", selectedClubId);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMatches(data);
      }
    } catch {
      // Si falla, mostramos lista vacía
    } finally {
      setLoading(false);
    }
  };

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Partidos</h1>
              <p className="text-muted-foreground">Gestión de partidos de liga</p>
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
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground"><Swords className="mx-auto mb-4 h-12 w-12 opacity-50" /><p>No se encontraron partidos</p></CardContent></Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((match) => (
              <Card
                key={match.id}
                className="transition-shadow hover:shadow-md cursor-pointer"
                onClick={() => router.push(`/matches/${match.id}`)}
              >
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
                        {match.convocation && <span className="flex items-center gap-1 text-primary"><Link2 className="h-3 w-3" />Convocatoria</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-lg">{match.homeTeam.name}</span>
                        <Swords className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold text-lg">
                          {match.convocation?.rival || match.awayTeam.name}
                        </span>
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