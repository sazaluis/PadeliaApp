"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, Plus, CheckCircle, Clock, XCircle, Calendar } from "lucide-react";

interface ConvocationPlayer {
  id: string;
  name: string;
  status: "CONFIRMED" | "PENDING" | "ABSENT";
}

interface Convocation {
  id: string;
  matchInfo: string;
  teamName: string;
  date: string;
  status: "SENT" | "CONFIRMED" | "PARTIAL" | "DRAFT";
  players: ConvocationPlayer[];
  deadline?: string;
}

export default function ConvocationsPage() {
  const [convocations] = useState<Convocation[]>([
    {
      id: "1",
      matchInfo: "Padel Club A vs Real Padel",
      teamName: "Padel Club A",
      date: "2024-09-29",
      status: "SENT",
      deadline: "2024-09-27",
      players: [
        { id: "p1", name: "Juan Martínez", status: "CONFIRMED" },
        { id: "p2", name: "Pedro López", status: "CONFIRMED" },
        { id: "p3", name: "Antonio Sánchez", status: "PENDING" },
        { id: "p4", name: "Luis Hernández", status: "CONFIRMED" },
        { id: "p5", name: "Miguel González", status: "PENDING" },
        { id: "p6", name: "Carlos Fernández", status: "ABSENT" },
      ],
    },
    {
      id: "2",
      matchInfo: "Padel Club A vs Club Natación",
      teamName: "Padel Club A",
      date: "2024-10-06",
      status: "DRAFT",
      deadline: "2024-10-04",
      players: [
        { id: "p1", name: "Juan Martínez", status: "PENDING" },
        { id: "p2", name: "Pedro López", status: "PENDING" },
        { id: "p3", name: "Antonio Sánchez", status: "PENDING" },
        { id: "p4", name: "Luis Hernández", status: "PENDING" },
      ],
    },
  ]);

  const formatDate = (d: string) =>
    new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED": return <Badge variant="success">Confirmada</Badge>;
      case "SENT": return <Badge variant="outline">Enviada</Badge>;
      case "PARTIAL": return <Badge variant="warning">Parcial</Badge>;
      case "DRAFT": return <Badge variant="secondary">Borrador</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getPlayerStatusIcon = (status: string) => {
    switch (status) {
      case "CONFIRMED": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "PENDING": return <Clock className="h-4 w-4 text-yellow-500" />;
      case "ABSENT": return <XCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Convocatorias</h1>
            <p className="text-muted-foreground">Gestión de convocatorias para partidos</p>
          </div>
          <Button><Plus className="mr-2 h-4 w-4" />Nueva Convocatoria</Button>
        </div>

        <div className="space-y-4">
          {convocations.map((conv) => {
            const confirmed = conv.players.filter((p) => p.status === "CONFIRMED").length;
            const total = conv.players.length;
            return (
              <Card key={conv.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-primary" />
                        {conv.matchInfo}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(conv.date)} · {conv.teamName}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(conv.status)}
                      {conv.status === "DRAFT" && <Button size="sm">Enviar</Button>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <span>Confirmados: <strong className="text-foreground">{confirmed}/{total}</strong></span>
                    {conv.deadline && <span>· Límite: {formatDate(conv.deadline)}</span>}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {conv.players.map((p) => (
                      <div key={p.id} className="flex items-center gap-2 rounded-lg border p-2">
                        {getPlayerStatusIcon(p.status)}
                        <span className="text-sm font-medium">{p.name}</span>
                        <Badge variant={p.status === "CONFIRMED" ? "success" : p.status === "ABSENT" ? "destructive" : "secondary"} className="ml-auto text-xs">
                          {p.status === "CONFIRMED" ? "Sí" : p.status === "PENDING" ? "Pendiente" : "No"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}