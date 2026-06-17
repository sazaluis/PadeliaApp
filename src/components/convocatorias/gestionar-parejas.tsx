"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Jugador {
  id: string;
  playerId: string;
  disponibilidad: "PENDIENTE" | "SI" | "NO";
  player: {
    id: string;
    user: { name?: string; surname?: string };
  };
}

interface Pareja {
  id: string;
  numero: number;
  jugador1Id: string | null;
  jugador2Id: string | null;
  jugador1: { id: string; userId: string } | null;
  jugador2: { id: string; userId: string } | null;
}

interface ConvocatoriaConParejas {
  id: string;
  status: string;
  numParejas: number;
  jugadores: Jugador[];
  parejas: Pareja[];
}

interface GestionarParejasProps {
  convocatoria: ConvocatoriaConParejas;
  onClose: () => void;
  onSave: () => void;
}

function getInitials(name?: string, surname?: string): string {
  const first = (name || "")[0] || "";
  const last = (surname || "")[0] || "";
  return (first + last).toUpperCase() || "—";
}

export default function GestionarParejas({ convocatoria, onClose, onSave }: GestionarParejasProps) {
  const [parejas, setParejas] = useState<Pareja[]>(convocatoria.parejas);
  const [saving, setSaving] = useState(false);
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const jugadoresDisponibles = convocatoria.jugadores.filter((j) => j.disponibilidad === "SI");

  const getPlayerName = (playerId: string | null): string => {
    if (!playerId) return "";
    const jugador = convocatoria.jugadores.find((j) => j.playerId === playerId);
    if (!jugador) return "";
    const { name, surname } = jugador.player.user;
    return `${name ?? ""} ${surname ?? ""}`.trim() || "Jugador";
  };

  const getAssignedPlayerIds = (excludeParejaId?: string): string[] => {
    const ids: string[] = [];
    for (const p of parejas) {
      if (excludeParejaId && p.id === excludeParejaId) continue;
      if (p.jugador1Id) ids.push(p.jugador1Id);
      if (p.jugador2Id) ids.push(p.jugador2Id);
    }
    return ids;
  };

  const isPlayerDisabled = (playerId: string, parejaId: string, currentSlot: "jugador1Id" | "jugador2Id"): string | false => {
    // Check if player is in the OTHER slot of the SAME pareja
    const pareja = parejas.find((p) => p.id === parejaId);
    if (pareja) {
      const otherSlot = currentSlot === "jugador1Id" ? "jugador2Id" : "jugador1Id";
      if (pareja[otherSlot] === playerId) {
        return `(en Pareja ${pareja.numero})`;
      }
    }

    // Check if player is in any OTHER pareja
    for (const p of parejas) {
      if (p.id === parejaId) continue;
      if (p.jugador1Id === playerId || p.jugador2Id === playerId) {
        return `(en Pareja ${p.numero})`;
      }
    }
    return false;
  };

  const handleUpdatePareja = useCallback(
    (parejaId: string, field: "jugador1Id" | "jugador2Id", value: string | null) => {
      setParejas((prev) =>
        prev.map((p) => (p.id === parejaId ? { ...p, [field]: value } : p))
      );

      // Debounced save
      if (debounceTimers.current.has(parejaId)) {
        clearTimeout(debounceTimers.current.get(parejaId)!);
      }

      const timer = setTimeout(async () => {
        const updatedPareja = parejas.find((p) => p.id === parejaId);
        if (!updatedPareja) return;

        const newJugador1Id = field === "jugador1Id" ? value : updatedPareja.jugador1Id;
        const newJugador2Id = field === "jugador2Id" ? value : updatedPareja.jugador2Id;

        // Validate same player
        if (newJugador1Id && newJugador2Id && newJugador1Id === newJugador2Id) {
          toast.error("No se puede asignar el mismo jugador a ambos slots");
          return;
        }

        // Validate player not in another pareja
        const allParejas = parejas.map((p) =>
          p.id === parejaId
            ? { ...p, jugador1Id: newJugador1Id, jugador2Id: newJugador2Id }
            : p
        );

        const assignedIds: string[] = [];
        for (const p of allParejas) {
          if (p.jugador1Id) {
            if (assignedIds.includes(p.jugador1Id)) {
              toast.error(`Jugador ya asignado en Pareja ${p.numero}`);
              return;
            }
            assignedIds.push(p.jugador1Id);
          }
          if (p.jugador2Id) {
            if (assignedIds.includes(p.jugador2Id)) {
              toast.error(`Jugador ya asignado en Pareja ${p.numero}`);
              return;
            }
            assignedIds.push(p.jugador2Id);
          }
        }

        try {
          const res = await fetch(
            `/api/convocatorias/${convocatoria.id}/parejas/${parejaId}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                jugador1Id: newJugador1Id,
                jugador2Id: newJugador2Id,
              }),
            }
          );
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Error al guardar pareja");
          }
          const data = await res.json();
          setParejas((prev) =>
            prev.map((p) => (p.id === parejaId ? { ...p, ...data } : p))
          );
        } catch (e: any) {
          toast.error(e.message);
        }
      }, 400);

      debounceTimers.current.set(parejaId, timer);
    },
    [convocatoria.id, parejas]
  );

  const getParejaAssignmentCount = (pareja: Pareja): number => {
    let count = 0;
    if (pareja.jugador1Id) count++;
    if (pareja.jugador2Id) count++;
    return count;
  };

  return (
    <div className="mt-4 space-y-3">
      <h4 className="text-sm font-medium">Gestionar parejas</h4>

      {jugadoresDisponibles.length < 2 && (
        <p className="text-xs text-amber-600">
          Solo {jugadoresDisponibles.length} jugador(es) han confirmado disponibilidad.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {parejas.map((pareja) => {
          const assignedCount = getParejaAssignmentCount(pareja);
          const assignedIds = getAssignedPlayerIds(pareja.id);
          const availablePlayers = jugadoresDisponibles.filter(
            (j) => !assignedIds.includes(j.playerId)
          );

          const getParejaNumLabel = () => {
            if (assignedCount === 0) return "Sin asignar";
            if (assignedCount === 1) return "1/2 asignado";
            return "2/2 asignados";
          };

          return (
            <div
              key={pareja.id}
              className="border rounded-lg p-3 bg-white space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Pareja {pareja.numero}</span>
                <Badge variant="outline" className="text-[10px]">
                  {getParejaNumLabel()}
                </Badge>
              </div>

              <div className="flex gap-2 items-center">
                {/* Jugador 1 */}
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      pareja.jugador1Id
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {pareja.jugador1Id
                      ? getInitials(
                          convocatoria.jugadores.find((j) => j.playerId === pareja.jugador1Id)
                            ?.player?.user?.name,
                          convocatoria.jugadores.find((j) => j.playerId === pareja.jugador1Id)
                            ?.player?.user?.surname
                        )
                      : "—"}
                  </div>
                  <Select
                    value={pareja.jugador1Id || "__none__"}
                    onValueChange={(val) =>
                      handleUpdatePareja(pareja.id, "jugador1Id", val === "__none__" ? null : val)
                    }
                  >
                    <SelectTrigger className="h-8 text-xs flex-1">
                      <SelectValue placeholder="— Sin asignar —" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Sin asignar —</SelectItem>
                      {jugadoresDisponibles.map((j) => {
                        const playerName = getPlayerName(j.playerId);
                        const disabledInfo = isPlayerDisabled(j.playerId, pareja.id, "jugador1Id");
                        const isSelectedInThisSlot = pareja.jugador1Id === j.playerId;
                        return (
                          <SelectItem
                            key={j.playerId}
                            value={j.playerId}
                            disabled={!!disabledInfo && !isSelectedInThisSlot}
                          >
                            {playerName}
                            {disabledInfo && !isSelectedInThisSlot
                              ? ` ${disabledInfo}`
                              : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <span className="text-xs text-muted-foreground">/</span>

                {/* Jugador 2 */}
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      pareja.jugador2Id
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {pareja.jugador2Id
                      ? getInitials(
                          convocatoria.jugadores.find((j) => j.playerId === pareja.jugador2Id)
                            ?.player?.user?.name,
                          convocatoria.jugadores.find((j) => j.playerId === pareja.jugador2Id)
                            ?.player?.user?.surname
                        )
                      : "—"}
                  </div>
                  <Select
                    value={pareja.jugador2Id || "__none__"}
                    onValueChange={(val) =>
                      handleUpdatePareja(pareja.id, "jugador2Id", val === "__none__" ? null : val)
                    }
                  >
                    <SelectTrigger className="h-8 text-xs flex-1">
                      <SelectValue placeholder="— Sin asignar —" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Sin asignar —</SelectItem>
                      {jugadoresDisponibles.map((j) => {
                        const playerName = getPlayerName(j.playerId);
                        const disabledInfo = isPlayerDisabled(j.playerId, pareja.id, "jugador2Id");
                        const isSelectedInThisSlot = pareja.jugador2Id === j.playerId;
                        return (
                          <SelectItem
                            key={j.playerId}
                            value={j.playerId}
                            disabled={!!disabledInfo && !isSelectedInThisSlot}
                          >
                            {playerName}
                            {disabledInfo && !isSelectedInThisSlot
                              ? ` ${disabledInfo}`
                              : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cerrar
        </Button>
        <Button size="sm" onClick={() => { onSave(); toast.success("Parejas guardadas"); }} disabled={saving}>
          {saving ? "Guardando..." : "Guardar parejas"}
        </Button>
      </div>
    </div>
  );
}