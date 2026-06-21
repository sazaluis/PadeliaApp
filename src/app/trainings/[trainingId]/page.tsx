"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Clock, MapPin, Users, Dumbbell, Trash2, Pencil, X, Save } from "lucide-react";
import { AsistenciaEntrenamiento } from "@/components/trainings/asistencia-entrenamiento";
import { TimeInput, addHourAndHalf } from "@/components/ui/time-input";
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

interface Coach {
  id: string;
  user: { name: string; surname: string };
}

export default function TrainingDetailPage() {
  const params = useParams();
  const trainingId = params.trainingId as string;
  const router = useRouter();
  const [training, setTraining] = useState<Training | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
    courts: [] as string[],
    coachId: "",
    notes: "",
  });
  const [clubCourts, setClubCourts] = useState(0);
  const [coaches, setCoaches] = useState<Coach[]>([]);

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

  useEffect(() => {
    if (!training?.team?.club?.id) return;
    const clubId = training.team.club.id;
    fetch(`/api/clubs/${clubId}`)
      .then(r => r.json())
      .then(data => { if (data?.courts) setClubCourts(data.courts); })
      .catch(() => {});
    fetch(`/api/coaches?clubId=${clubId}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCoaches(data); })
      .catch(() => {});
  }, [training]);

  const openEdit = () => {
    if (!training) return;
    setEditForm({
      date: format(new Date(training.date), "yyyy-MM-dd"),
      startTime: training.startTime,
      endTime: training.endTime || "",
      courts: training.court || [],
      coachId: training.coach?.id || "",
      notes: training.notes || "",
    });
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const saveEdit = async () => {
    if (!training) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/trainings/${trainingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setTraining(updated);
      setEditing(false);
    } catch {
      setError("Error al guardar los cambios");
    }
    setSaving(false);
  };

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

  const courtOptions = Array.from({ length: clubCourts }, (_, i) => `Pista ${i + 1}`);

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
          {editing ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={cancelEdit}>
                <X className="mr-1.5 h-4 w-4" />Cancelar
              </Button>
              <Button size="sm" onClick={saveEdit} disabled={saving}>
                <Save className="mr-1.5 h-4 w-4" />
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={openEdit}>
                <Pencil className="mr-1.5 h-4 w-4" />Editar
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
                <Trash2 className="mr-2 h-4 w-4" />
                {deleting ? "Eliminando..." : "Eliminar"}
              </Button>
            </div>
          )}
        </div>

        {/* Info cards / Edit form */}
        {editing ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Editar sesión</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Fecha</label>
                  <Input
                    type="date"
                    value={editForm.date}
                    onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Hora inicio</label>
                    <TimeInput
                      value={editForm.startTime}
                      onChange={(v) => setEditForm({
                        ...editForm,
                        startTime: v,
                        endTime: addHourAndHalf(v),
                      })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Hora fin</label>
                    <TimeInput
                      value={editForm.endTime}
                      onChange={(v) => setEditForm({ ...editForm, endTime: v })}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <label className="text-sm font-medium">Pistas</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {courtOptions.map(c => {
                    const checked = editForm.courts.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setEditForm({
                            ...editForm,
                            courts: checked
                              ? editForm.courts.filter(x => x !== c)
                              : [...editForm.courts, c],
                          });
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          checked
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-muted border-input"
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="mt-4">
                <label className="text-sm font-medium">Entrenador</label>
                <Select
                  value={editForm.coachId || "__none__"}
                  onValueChange={v => setEditForm({ ...editForm, coachId: v === "__none__" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar entrenador" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin entrenador</SelectItem>
                    {coaches.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.user.name} {c.user.surname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-4">
                <label className="text-sm font-medium">Notas</label>
                <Textarea
                  value={editForm.notes}
                  onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
            </CardContent>
          </Card>
        ) : (
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
        )}

        {/* Notes */}
        {!editing && training.notes && (
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
        {!editing && (
          <AsistenciaEntrenamiento 
            entrenamientoId={trainingId} 
            numPistas={training.court?.length || 2} 
          />
        )}
      </div>
    </DashboardLayout>
  );
}
