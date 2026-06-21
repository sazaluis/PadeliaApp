"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock, MapPin, Users, Dumbbell, Trash2 } from "lucide-react";
import { AsistenciaEntrenamiento } from "@/components/trainings/asistencia-entrenamiento";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Training {
  id: string;
  title: string;
  description: string | null;
  date: string;
  startTime: string;
  endTime: string | null;
  court: string[] | null;
  notes: string | null;
  isCancelled: boolean;
  team: {
    id: string;
    name: string;
    category: string;
    club: {
      id: string;
      name: string;
    };
  };
  coach: {
    id: string;
    user: {
      name: string;
      surname: string;
    };
  } | null;
}

export default function TrainingDetailPage() {
  const params = useParams();
  const trainingId = params.trainingId as string;
  const [training, setTraining] = useState<Training | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchTraining = async () => {
      try {
        const res = await fetch(`/api/trainings/${trainingId}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setTraining(data);
      } catch {
        setError("Error al cargar el entrenamiento");
      } finally {
        setLoading(false);
      }
    };
    fetchTraining();
  }, [trainingId]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !training) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <Card>
            <CardContent className="py-8 text-center text-destructive">
              {error || "Entrenamiento no encontrado"}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que deseas eliminar este entrenamiento?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/trainings/${trainingId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al eliminar");
      }
      router.push("/trainings");
    } catch (err: any) {
      setError(err.message || "Error al eliminar el entrenamiento");
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{training.title}</h1>
            <p className="text-sm text-muted-foreground">
              {training.team.name} · {training.team.category}
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {deleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-md">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fecha</p>
                  <p className="text-sm font-medium">
                    {format(new Date(training.date), "d MMM yyyy", { locale: es })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-md">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Horario</p>
                  <p className="text-sm font-medium">
                    {training.startTime}
                    {training.endTime ? ` - ${training.endTime}` : ""}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {training.court && training.court.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pistas</p>
                    <p className="text-sm font-medium">{training.court.join(", ")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {training.coach && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Entrenador</p>
                    <p className="text-sm font-medium">
                      {training.coach.user.name} {training.coach.user.surname}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Notes */}
        {training.notes && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Dumbbell className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Notas</p>
                  <p className="text-sm">{training.notes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Asistencia component */}
        <AsistenciaEntrenamiento 
          entrenamientoId={trainingId} 
          numPistas={training.court?.length || 2} 
        />
      </div>
    </DashboardLayout>
  );
}