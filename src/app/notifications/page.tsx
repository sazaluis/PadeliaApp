"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Bell, Check, CheckCheck, Calendar, ClipboardList, Trophy, Settings, Building2 } from "lucide-react";

interface Notification {
  id: string;
  type: "TRAINING" | "CONVOCATION" | "MATCH" | "RESULT" | "RANKING" | "GENERAL";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const userClubId = (session?.user as any)?.clubId;
  
  const [clubs, setClubs] = useState<{id: string; name: string; city: string}[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string>(userClubId || "");
  
  const notifications: Notification[] = [
    { id: "1", type: "CONVOCATION", title: "Convocatoria para Jornada 8", message: "Se ha abierto la convocatoria para el partido del sábado. Confirma tu asistencia.", isRead: false, createdAt: "2024-09-25T10:00:00" },
    { id: "2", type: "TRAINING", title: "Entrenamiento Táctico - Hoy", message: "Recuerda: entrenamiento hoy a las 18:00 en Pista Cubierta.", isRead: false, createdAt: "2024-09-25T08:00:00" },
    { id: "3", type: "RESULT", title: "Resultado registrado", message: "Padel Club A 2-1 CD Tennis - Jornada 7 completada.", isRead: true, createdAt: "2024-09-22T14:00:00" },
    { id: "4", type: "RANKING", title: "Clasificación actualizada", message: "Tu equipo ha subido al 2º puesto en la clasificación.", isRead: true, createdAt: "2024-09-22T15:00:00" },
    { id: "5", type: "GENERAL", title: "Bienvenido a PadelIA", message: "Tu cuenta ha sido creada correctamente. ¡Bienvenido!", isRead: true, createdAt: "2024-09-01T10:00:00" },
  ];

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      TRAINING: <Calendar className="h-4 w-4 text-blue-500" />,
      CONVOCATION: <ClipboardList className="h-4 w-4 text-yellow-500" />,
      MATCH: <Trophy className="h-4 w-4 text-green-500" />,
      RESULT: <Trophy className="h-4 w-4 text-purple-500" />,
      RANKING: <Trophy className="h-4 w-4 text-orange-500" />,
      GENERAL: <Settings className="h-4 w-4 text-gray-500" />,
    };
    return icons[type] || <Bell className="h-4 w-4" />;
  };

  const formatTime = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "Hace minutos";
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    return `Hace ${Math.floor(diffHours / 24)} días`;
  };

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

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notificaciones</h1>
            <p className="text-muted-foreground">Centro de notificaciones</p>
          </div>
          <div className="flex items-center gap-2">
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
            <Button variant="outline" size="sm">
              <CheckCheck className="mr-2 h-4 w-4" />
              Marcar todas como leídas
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`transition-colors hover:bg-muted/50 ${!n.isRead ? "border-l-4 border-l-primary bg-primary/5" : ""}`}
            >
              <CardContent className="flex items-start gap-4 p-4">
                <div className="mt-1 rounded-lg bg-muted p-2">
                  {getTypeIcon(n.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{n.title}</p>
                    {!n.isRead && (
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">{formatTime(n.createdAt)}</p>
                </div>
                {!n.isRead && (
                  <Button variant="ghost" size="sm">
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}