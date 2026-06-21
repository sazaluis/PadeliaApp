"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Check, X, HelpCircle, Plus, Users, MapPin, GripVertical } from "lucide-react";
import { PistaPadel } from "@/components/trainings/pista-padel";

interface Jugador {
  jugadorId: string;
  nombre: string;
  equipo: { id: string; name: string; category: string } | null;
  estado: string;
  esInvitado: boolean;
  equipoOrigen: { id: string; name: string; category: string } | null;
  pistaAsignada: number | null;
  asistenciaId: string | null;
}

interface EntrenamientoInfo {
  id: string;
  titulo: string;
  fecha: string;
  horaInicio: string;
  clubId: string;
  equipoId: string;
}

interface AsistenciaEntrenamientoProps {
  entrenamientoId: string;
  numPistas?: number;
}

export function AsistenciaEntrenamiento({ entrenamientoId, numPistas = 2 }: AsistenciaEntrenamientoProps) {
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [entrenamiento, setEntrenamiento] = useState<EntrenamientoInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showInvitadoDialog, setShowInvitadoDialog] = useState(false);
  const [equiposClub, setEquiposClub] = useState<{ id: string; name: string; category: string }[]>([]);
  const [jugadoresEquipo, setJugadoresEquipo] = useState<any[]>([]);
  const [selectedEquipo, setSelectedEquipo] = useState("");
  const [selectedJugador, setSelectedJugador] = useState("");
  const [isDragging, setIsDragging] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/trainings/${entrenamientoId}/asistencia`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setJugadores(data.jugadores);
      setEntrenamiento(data.entrenamiento);
    } catch {
      toast.error("Error al cargar datos de asistencia");
    } finally {
      setLoading(false);
    }
  }, [entrenamientoId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (entrenamiento?.clubId) {
      fetch(`/api/teams?clubId=${entrenamiento.clubId}`)
        .then((r) => r.json())
        .then((data) => {
          const equipos = Array.isArray(data) ? data : [];
          setEquiposClub(equipos);
        })
        .catch(() => {});
    }
  }, [entrenamiento?.clubId]);

  const updateEstado = async (jugadorId: string, estado: string) => {
    setSaving(true);
    const previous = jugadores.find((j) => j.jugadorId === jugadorId);
    setJugadores((prev) =>
      prev.map((j) =>
        j.jugadorId === jugadorId
          ? {
              ...j,
              estado,
              pistaAsignada: estado === "AUSENTE" ? null : j.pistaAsignada,
            }
          : j
      )
    );

    try {
      const res = await fetch(`/api/trainings/${entrenamientoId}/asistencia/${jugadorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      if (!res.ok) throw new Error();
      toast.success("Estado actualizado");
    } catch {
      setJugadores((prev) => prev.map((j) => (j.jugadorId === jugadorId ? previous! : j)));
      toast.error("Error al actualizar estado");
    } finally {
      setSaving(false);
    }
  };

  const updatePista = async (jugadorId: string, pistaAsignada: number | null) => {
    setSaving(true);
    const previous = jugadores.find((j) => j.jugadorId === jugadorId);
    setJugadores((prev) =>
      prev.map((j) => (j.jugadorId === jugadorId ? { ...j, pistaAsignada } : j))
    );

    try {
      const res = await fetch(`/api/trainings/${entrenamientoId}/asistencia/${jugadorId}/pista`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pistaAsignada }),
      });
      if (!res.ok) throw new Error();
      toast.success("Pista actualizada");
    } catch {
      setJugadores((prev) => prev.map((j) => (j.jugadorId === jugadorId ? previous! : j)));
      toast.error("Error al asignar pista");
    } finally {
      setSaving(false);
    }
  };

  const handleEquipoChange = async (equipoId: string) => {
    setSelectedEquipo(equipoId);
    setSelectedJugador("");
    try {
      const res = await fetch(`/api/teams/${equipoId}/players`);
      if (res.ok) {
        const data = await res.json();
        setJugadoresEquipo(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error("Error al cargar jugadores del equipo");
    }
  };

  const handleDropEnPista = async (jugadorId: string, numeroPista: number) => {
    const previous = jugadores.find((j) => j.jugadorId === jugadorId);
    setJugadores((prev) =>
      prev.map((j) =>
        j.jugadorId === jugadorId ? { ...j, pistaAsignada: numeroPista } : j
      )
    );

    try {
      const res = await fetch(`/api/trainings/${entrenamientoId}/asistencia/${jugadorId}/pista`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pistaAsignada: numeroPista }),
      });
      if (!res.ok) throw new Error();
      toast.success("Pista actualizada");
    } catch {
      setJugadores((prev) =>
        prev.map((j) =>
          j.jugadorId === jugadorId ? { ...j, pistaAsignada: previous?.pistaAsignada || null } : j
        )
      );
      toast.error("Error al asignar jugador a la pista");
    }
  };

  const handleDragStart = (e: React.DragEvent, jugadorId: string) => {
    e.dataTransfer.setData("jugadorId", jugadorId);
    e.dataTransfer.effectAllowed = "move";
    setIsDragging(jugadorId);
  };

  const handleDragEnd = () => {
    setIsDragging(null);
  };

  const handleAddInvitado = async () => {
    if (!selectedJugador || !selectedEquipo) {
      toast.error("Selecciona un jugador");
      return;
    }
    try {
      const res = await fetch(`/api/trainings/${entrenamientoId}/asistencia/invitado`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jugadorId: selectedJugador, equipoOrigenId: selectedEquipo }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error");
      }
      toast.success("Jugador invitado añadido");
      setShowInvitadoDialog(false);
      setSelectedEquipo("");
      setSelectedJugador("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Error al añadir invitado");
    }
  };

  const confirmados = jugadores.filter((j) => j.estado === "CONFIRMADO").length;
  const ausentes = jugadores.filter((j) => j.estado === "AUSENTE").length;
  const pendientes = jugadores.filter((j) => j.estado === "PENDIENTE").length;

  const jugadoresPorPista = Array.from({ length: numPistas }, (_, i) => i + 1).map((pista) =>
    jugadores.filter((j) => j.pistaAsignada === pista && j.estado === "CONFIRMADO")
  );

  const jugadoresSinPista = jugadores.filter(
    (j) => j.estado === "CONFIRMADO" && !j.pistaAsignada
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Cargando asistencia...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Contadores */}
      <div className="flex items-center gap-4 text-xs">
        <span className="font-medium">
          Confirmados: <span className="text-green-600">{confirmados}</span>
        </span>
        <span className="font-medium">
          Ausentes: <span className="text-red-600">{ausentes}</span>
        </span>
        <span className="font-medium">
          Pendientes: <span className="text-gray-500">{pendientes}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de jugadores */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Jugadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {jugadores.map((j) => {
                    const isDraggable = j.estado === "CONFIRMADO" && !j.pistaAsignada;
                    const isDraggingThis = isDragging === j.jugadorId;
                    return (
                <div
                  key={j.jugadorId}
                  className={`flex items-center justify-between rounded-md border p-2.5 ${isDraggingThis ? "opacity-50" : ""} ${isDraggable ? "cursor-grab active:cursor-grabbing" : ""} ${j.pistaAsignada ? "opacity-40" : ""}`}
                  draggable={isDraggable}
                  onDragStart={isDraggable ? (e) => handleDragStart(e, j.jugadorId) : undefined}
                  onDragEnd={isDraggable ? handleDragEnd : undefined}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    {isDraggable && (
                      <GripVertical className="h-4 w-4 text-gray-300 mr-2 flex-shrink-0" />
                    )}
                    {j.estado === "CONFIRMADO" && j.pistaAsignada && (
                      <GripVertical className="h-4 w-4 text-gray-300 mr-2 flex-shrink-0 opacity-20" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{j.nombre}</span>
                        {j.esInvitado && j.equipoOrigen && (
                          <Badge variant="secondary" className="text-[10px] bg-indigo-100 text-indigo-700">
                            Invitado · {j.equipoOrigen.name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {j.pistaAsignada && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Pista {j.pistaAsignada}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    <Button
                      size="icon"
                      variant={j.estado === "CONFIRMADO" ? "default" : "ghost"}
                      className={`h-7 w-7 ${j.estado === "CONFIRMADO" ? "bg-green-600 hover:bg-green-700" : ""}`}
                      onClick={() => updateEstado(j.jugadorId, "CONFIRMADO")}
                      disabled={saving}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant={j.estado === "AUSENTE" ? "default" : "ghost"}
                      className={`h-7 w-7 ${j.estado === "AUSENTE" ? "bg-red-600 hover:bg-red-700" : ""}`}
                      onClick={() => updateEstado(j.jugadorId, "AUSENTE")}
                      disabled={saving}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant={j.estado === "PENDIENTE" ? "default" : "ghost"}
                      className={`h-7 w-7 ${j.estado === "PENDIENTE" ? "bg-gray-500 hover:bg-gray-600" : ""}`}
                      onClick={() => updateEstado(j.jugadorId, "PENDIENTE")}
                      disabled={saving}
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                    );
                  })}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3"
              onClick={() => setShowInvitadoDialog(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Añadir jugador invitado
            </Button>
          </CardContent>
        </Card>

        {/* Vista de pistas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Pistas
            </CardTitle>
            <p className="text-xs text-gray-400 mb-3">
              Arrastra jugadores confirmados a una pista, o usa el selector en cada jugador
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: numPistas }, (_, i) => i + 1).map((pista) => (
                <div key={pista}>
                  <PistaPadel
                    numero={pista}
                    jugadores={
                      jugadores
                        .filter((j) => j.pistaAsignada === pista && j.estado === "CONFIRMADO")
                        .map((j) => ({
                          jugadorId: j.jugadorId,
                          nombre: j.nombre,
                          esInvitado: j.esInvitado,
                          equipoOrigenNombre: j.equipoOrigen?.name || null,
                        }))
                    }
                    onQuitarJugador={(jugadorId) => updatePista(jugadorId, null)}
                    onDropJugador={(jugadorId) => handleDropEnPista(jugadorId, pista)}
                  />
                  <Select
                    value="__placeholder__"
                    onValueChange={(value) => {
                      if (value && value !== "__placeholder__") {
                        updatePista(value, pista);
                      }
                    }}
                  >
                    <SelectTrigger className="mt-2 h-8 text-xs">
                      <SelectValue placeholder="Asignar jugador confirmado" />
                    </SelectTrigger>
                    <SelectContent>
                      {jugadoresSinPista.length === 0 ? (
                        <SelectItem value="__no_players__" disabled>
                          No hay jugadores disponibles
                        </SelectItem>
                      ) : (
                        jugadoresSinPista.map((j) => (
                          <SelectItem key={j.jugadorId} value={j.jugadorId}>
                            {j.nombre}
                            {j.esInvitado && j.equipoOrigen ? ` (${j.equipoOrigen.name})` : ""}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog añadir invitado */}
      <Dialog open={showInvitadoDialog} onOpenChange={setShowInvitadoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir jugador invitado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Equipo origen</label>
              <Select value={selectedEquipo} onValueChange={handleEquipoChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar equipo" />
                </SelectTrigger>
                <SelectContent>
                  {equiposClub
                    .filter((e) => e.id !== entrenamiento?.equipoId)
                    .map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name} - {e.category}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {selectedEquipo && (
              <div>
                <label className="text-sm font-medium">Jugador</label>
                <Select value={selectedJugador} onValueChange={setSelectedJugador}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar jugador" />
                  </SelectTrigger>
                  <SelectContent>
                    {jugadoresEquipo
                      .filter(
                        (p) => !jugadores.some((j) => j.jugadorId === p.id)
                      )
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.user?.name} {p.user?.surname}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvitadoDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddInvitado} disabled={!selectedJugador}>
              Añadir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}