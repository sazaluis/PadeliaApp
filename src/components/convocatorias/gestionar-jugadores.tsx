"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserPlus, UserMinus, Search, Loader2, CheckCircle, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";

interface PlayerUser {
  name?: string | null;
  surname?: string | null;
}

interface PlayerData {
  id: string;
  userId: string;
  user: PlayerUser;
  team?: { id: string; name: string } | null;
}

interface JugadorActual {
  id: string;
  playerId: string;
  disponibilidad: "PENDIENTE" | "SI" | "NO";
  player: {
    id: string;
    user: PlayerUser;
  };
}

interface Convocatoria {
  id: string;
  teamId: string;
  team: { id: string; name: string };
  jugadores: JugadorActual[];
}

interface Props {
  convocatoria: Convocatoria;
  onClose: () => void;
  onSave: () => void;
}

export default function GestionarJugadores({ convocatoria, onClose, onSave }: Props) {
  const [open, setOpen] = useState(true);
  const [allPlayers, setAllPlayers] = useState<PlayerData[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);
  const [selectedToRemove, setSelectedToRemove] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const currentPlayerIds = convocatoria.jugadores.map((j) => j.playerId);

  // Players NOT in the convocatoria (available to add)
  const availablePlayers = allPlayers.filter(
    (p) => !currentPlayerIds.includes(p.id)
  );

  // Players IN the convocatoria (available to remove)
  const currentPlayers = convocatoria.jugadores;

  // Filter by search
  const filteredAvailable = availablePlayers.filter((p) => {
    const name = `${p.user.name ?? ""} ${p.user.surname ?? ""}`.toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  const filteredCurrent = currentPlayers.filter((j) => {
    const name = `${j.player.user.name ?? ""} ${j.player.user.surname ?? ""}`.toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  useEffect(() => {
    setLoadingPlayers(true);
    fetch(`/api/players?teamId=${convocatoria.teamId}`)
      .then((r) => r.json())
      .then((data) => {
        setAllPlayers(Array.isArray(data) ? data : []);
      })
      .catch(() => toast.error("Error al cargar jugadores"))
      .finally(() => setLoadingPlayers(false));
  }, [convocatoria.teamId]);

  const toggleToAdd = (playerId: string) => {
    setSelectedToAdd((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    );
  };

  const toggleToRemove = (playerId: string) => {
    setSelectedToRemove((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    );
  };

  const handleSave = async () => {
    if (selectedToAdd.length === 0 && selectedToRemove.length === 0) {
      toast.error("No hay cambios que guardar");
      return;
    }

    setSaving(true);
    try {
      const body: any = {};
      if (selectedToAdd.length > 0) body.addPlayerIds = selectedToAdd;
      if (selectedToRemove.length > 0) body.removePlayerIds = selectedToRemove;

      const res = await fetch(`/api/convocatorias/${convocatoria.id}/jugadores`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al guardar");
      }

      const result = await res.json();
      const messages: string[] = [];
      if (result.added > 0) messages.push(`${result.added} jugador(es) añadido(s)`);
      if (result.removed > 0) messages.push(`${result.removed} jugador(es) eliminado(s)`);
      toast.success(messages.join(". ") || "Jugadores actualizados");
      setOpen(false);
      onSave();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const getDisponibilidadIcon = (d: string) => {
    switch (d) {
      case "SI": return <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />;
      case "NO": return <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />;
      default: return <Clock className="h-3.5 w-3.5 text-yellow-500 shrink-0" />;
    }
  };

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Gestionar Jugadores</DialogTitle>
          <DialogDescription>
            Añade o elimina jugadores de la convocatoria {convocatoria.team.name}.
            Los jugadores añadidos recibirán una notificación.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar jugador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {loadingPlayers ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
            {/* Current players section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Jugadores actuales ({currentPlayers.length})
                </h3>
                {selectedToRemove.length > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {selectedToRemove.length} para eliminar
                  </Badge>
                )}
              </div>
              <div className="space-y-1">
                {filteredCurrent.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No hay jugadores</p>
                ) : (
                  filteredCurrent.map((j) => {
                    const playerName = `${j.player.user.name ?? ""} ${j.player.user.surname ?? ""}`.trim() || "Jugador";
                    const isSelected = selectedToRemove.includes(j.playerId);
                    return (
                      <div
                        key={j.playerId}
                        className={`flex items-center gap-2 rounded-lg border p-2 cursor-pointer transition-colors ${
                          isSelected
                            ? "border-red-300 bg-red-50"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => toggleToRemove(j.playerId)}
                      >
                        {getDisponibilidadIcon(j.disponibilidad)}
                        <span className="text-sm font-medium flex-1 truncate">{playerName}</span>
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {j.disponibilidad === "PENDIENTE" ? "Pendiente" : j.disponibilidad === "SI" ? "Sí" : "No"}
                        </Badge>
                        <Button
                          variant={isSelected ? "destructive" : "ghost"}
                          size="sm"
                          className="h-7 px-2 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleToRemove(j.playerId);
                          }}
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Available players section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Jugadores disponibles para añadir ({availablePlayers.length})
                </h3>
                {selectedToAdd.length > 0 && (
                  <Badge variant="success" className="text-xs">
                    {selectedToAdd.length} para añadir
                  </Badge>
                )}
              </div>
              <div className="space-y-1">
                {filteredAvailable.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    {searchTerm ? "No se encontraron jugadores" : "No hay más jugadores disponibles"}
                  </p>
                ) : (
                  filteredAvailable.map((p) => {
                    const playerName = `${p.user.name ?? ""} ${p.user.surname ?? ""}`.trim() || "Jugador";
                    const isSelected = selectedToAdd.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center gap-2 rounded-lg border p-2 cursor-pointer transition-colors ${
                          isSelected
                            ? "border-green-300 bg-green-50"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => toggleToAdd(p.id)}
                      >
                        <span className="text-sm font-medium flex-1 truncate">{playerName}</span>
                        <Button
                          variant={isSelected ? "default" : "ghost"}
                          size="sm"
                          className="h-7 px-2 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleToAdd(p.id);
                          }}
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || (selectedToAdd.length === 0 && selectedToRemove.length === 0)}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}