"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, Plus, CheckCircle, Clock, XCircle, Calendar as CalendarIcon, Pencil, Send, Trash2, Users, UserCheck, Loader2, UserPlus, Building2, AlertCircle, Lock, ShieldCheck, AlertTriangle, PenTool, CheckCircle2 } from "lucide-react";
import GestionarParejas from "@/components/convocatorias/gestionar-parejas";
import GestionarJugadores from "@/components/convocatorias/gestionar-jugadores";
import { toast } from "sonner";

interface Team {
  id: string;
  name: string;
  category: string;
}

interface Player {
  id: string;
  user: { name?: string; surname?: string };
}

interface Jugador {
  id: string;
  playerId: string;
  disponibilidad: "PENDIENTE" | "SI" | "NO";
  convocado: boolean;
  updatedBy?: string;
  updatedByName?: string;
  player: Player;
}

interface Pareja {
  id: string;
  numero: number;
  jugador1Id: string | null;
  jugador2Id: string | null;
  jugador1: { id: string; userId: string } | null;
  jugador2: { id: string; userId: string } | null;
}

  interface Convocatoria {
    id: string;
    teamId: string;
    rival: string;
    matchDate: string;
    deadline: string;
    status: "BORRADOR" | "ENVIADA" | "CERRADA";
    confirmados: number;
    totalJugadores: number;
    numParejas: number;
    team: Team;
    jugadores: Jugador[];
    parejas: Pareja[];
    lastModifiedBy?: string;
    lastModifiedByUserId?: string;
    updatedAt: string;
  }

export default function ConvocationsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const userRole = role;

  interface ClubData {
    id: string;
    name: string;
  }

  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [allClubs, setAllClubs] = useState<ClubData[]>([]);
  const [loading, setLoading] = useState(true);
  const [clubId, setClubId] = useState<string>("");
  const [selectedClubId, setSelectedClubId] = useState<string>("");

  const [showSheet, setShowSheet] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const [formClubId, setFormClubId] = useState("");
  const [formTeamId, setFormTeamId] = useState("");
  const [formRival, setFormRival] = useState("");
  const [formMatchDate, setFormMatchDate] = useState<Date | undefined>(undefined);
  const [formDeadline, setFormDeadline] = useState<Date | undefined>(undefined);
  const [formDateError, setFormDateError] = useState("");
  const [formTeams, setFormTeams] = useState<Team[]>([]);

  const [sendingId, setSendingId] = useState<string | null>(null);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [sending, setSending] = useState(false);

  const [closingId, setClosingId] = useState<string | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [closing, setClosing] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [managingId, setManagingId] = useState<string | null>(null);
  const [showParejas, setShowParejas] = useState<string | null>(null);
  const [showJugadores, setShowJugadores] = useState<string | null>(null);
  const [numParejas, setNumParejas] = useState(3);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  const isAdmin = role === "GLOBAL_ADMIN";
  const isStaff = role === "GLOBAL_ADMIN" || role === "CLUB_MANAGER";

  useEffect(() => {
    if (session?.user) {
      fetch("/api/clubs")
        .then((r) => r.json())
        .then((clubs) => {
          if (Array.isArray(clubs) && clubs.length > 0) {
            setAllClubs(clubs.map((c: any) => ({ id: c.id, name: c.name })));
            setClubId(clubs[0].id);
            // Para admin, también establecer el club seleccionado
            if (userRole === "GLOBAL_ADMIN") {
              setSelectedClubId(clubs[0].id);
            }
          }
        })
        .catch(() => {});
    }
  }, [session, userRole]);

  useEffect(() => {
    if (!clubId) return;
    fetch(`/api/teams?clubId=${clubId}`)
      .then((r) => r.json())
      .then((data) => {
        setTeams(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, [clubId]);

  // Fetch teams for the selected club in the form
  useEffect(() => {
    if (!formClubId) {
      setFormTeams([]);
      return;
    }
    fetch(`/api/teams?clubId=${formClubId}`)
      .then((r) => r.json())
      .then((data) => {
        setFormTeams(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, [formClubId]);

  const fetchConvocatorias = async () => {
    if (allClubs.length === 0) return;
    setLoading(true);
    try {
      // Si es admin y hay un club seleccionado, cargar solo ese club
      if (userRole === "GLOBAL_ADMIN" && selectedClubId) {
        const res = await fetch(`/api/convocatorias?clubId=${selectedClubId}`);
        const data = await res.json();
        setConvocatorias(Array.isArray(data) ? data : []);
      } else {
        // Para usuarios no admin, cargar todos los clubs a los que tienen acceso
        const results = await Promise.all(
          allClubs.map((c) =>
            fetch(`/api/convocatorias?clubId=${c.id}`)
              .then((r) => r.json())
              .then((data) => (Array.isArray(data) ? data : []))
              .catch(() => [])
          )
        );
        const all = results.flat();
        setConvocatorias(all);
      }
    } catch {
      toast.error("Error al cargar convocatorias");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConvocatorias();
  }, [allClubs, selectedClubId]);

  const formatDate = (d: string | Date) =>
    new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));

  const getConvocatoriaColor = (conv: Convocatoria) => {
    const now = new Date();
    const deadline = new Date(conv.deadline);
    const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // 1. ROJO - Plazo vencido o crítico (máxima prioridad)
    if (deadline < now || diffDays <= 2) {
      return {
        borderClass: "border-l-4 border-l-red-500",
        badgeClass: "bg-red-50 text-red-600 border border-red-200",
        iconName: "AlertTriangle",
        iconColorClass: "text-red-500",
        alertText: deadline < now ? "Plazo vencido" : `Vence en ${diffDays} días`,
      };
    }

    // 2. AZUL - Borrador (no enviada)
    if (conv.status === "BORRADOR") {
      return {
        borderClass: "border-l-4 border-l-blue-500",
        badgeClass: "bg-blue-100 text-blue-700",
        iconName: "PenTool",
        iconColorClass: "text-blue-500",
        alertText: null,
      };
    }

    // 3. AMARILLO - Enviada pero parejas incompletas
    if (conv.status === "ENVIADA") {
      const parejasIncompletas = conv.parejas.filter((p) => !p.jugador1Id || !p.jugador2Id);
      if (parejasIncompletas.length > 0) {
        return {
          borderClass: "border-l-4 border-l-amber-400",
          badgeClass: "bg-amber-100 text-amber-700",
          iconName: "Users",
          iconColorClass: "text-amber-500",
          alertText: "Parejas pendientes de asignar",
        };
      }

      // 4. VERDE - Enviada y todas las parejas completas
      return {
        borderClass: "border-l-4 border-l-green-500",
        badgeClass: "bg-green-100 text-green-700",
        iconName: "CheckCircle2",
        iconColorClass: "text-green-500",
        alertText: null,
      };
    }

    // CERRADA u otro estado - estilo neutral
    return {
      borderClass: "border-l-4 border-l-slate-300",
      badgeClass: "bg-slate-100 text-slate-500",
      iconName: "Lock",
      iconColorClass: "text-slate-400",
      alertText: null,
    };
  };

  const getStatusBadge = (status: string, badgeClass?: string) => {
    if (badgeClass) {
      return <Badge className={badgeClass}>{status === "BORRADOR" ? "Borrador" : status === "ENVIADA" ? "Enviada" : status === "CERRADA" ? "Cerrada" : status}</Badge>;
    }
    return <Badge>{status}</Badge>;
  };

  const getDisponibilidadBadge = (d: string) => {
    switch (d) {
      case "SI": return <Badge variant="success">Sí</Badge>;
      case "NO": return <Badge variant="destructive">No</Badge>;
      default: return <Badge variant="secondary">Pendiente</Badge>;
    }
  };

  const getDisponibilidadIcon = (d: string) => {
    switch (d) {
      case "SI": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "NO": return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const openCreateSheet = () => {
    setEditingId(null);
    setEditingStatus("");
    setFormClubId(clubId);
    setFormTeamId("");
    setFormRival("");
    setFormMatchDate(undefined);
    setFormDeadline(undefined);
    setFormDateError("");
    setShowSheet(true);
  };

  const openEditSheet = (conv: Convocatoria) => {
    setEditingId(conv.id);
    setEditingStatus(conv.status);
    setFormClubId(clubId);
    setFormTeamId(conv.teamId);
    setFormRival(conv.rival);
    setFormMatchDate(new Date(conv.matchDate));
    setFormDeadline(new Date(conv.deadline));
    setFormDateError("");
    setShowSheet(true);
  };

  const validateDates = (matchDate?: Date, deadline?: Date): boolean => {
    if (!matchDate || !deadline) return true;
    if (deadline >= matchDate) {
      setFormDateError("La fecha límite debe ser anterior a la fecha del partido");
      return false;
    }
    setFormDateError("");
    return true;
  };

  const handleSave = async () => {
    if (!formTeamId || !formRival || !formMatchDate || !formDeadline) {
      toast.error("Completa todos los campos");
      return;
    }
    if (!validateDates(formMatchDate, formDeadline)) return;

    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/convocatorias/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamId: formTeamId,
            rival: formRival,
            matchDate: formMatchDate.toISOString(),
            deadline: formDeadline.toISOString(),
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Error al actualizar");
        }
        toast.success("Convocatoria actualizada");
      } else {
        const res = await fetch("/api/convocatorias", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clubId: formClubId,
            teamId: formTeamId,
            rival: formRival,
            matchDate: formMatchDate.toISOString(),
            deadline: formDeadline.toISOString(),
            numParejas,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Error al crear");
        }
        toast.success("Convocatoria creada");
      }
      setShowSheet(false);
      fetchConvocatorias();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (!sendingId) return;
    setSending(true);
    try {
      const res = await fetch(`/api/convocatorias/${sendingId}/enviar`, { method: "PATCH" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al enviar");
      }
      toast.success("Convocatoria enviada a los jugadores");
      setShowSendConfirm(false);
      setSendingId(null);
      fetchConvocatorias();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/convocatorias/${deletingId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al eliminar");
      }
      toast.success("Convocatoria eliminada");
      setShowDeleteConfirm(false);
      setDeletingId(null);
      fetchConvocatorias();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleClose = async () => {
    if (!closingId) return;
    setClosing(true);
    try {
      const res = await fetch(`/api/convocatorias/${closingId}/cerrar`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al cerrar convocatoria");
      }
      toast.success("Convocatoria cerrada correctamente");
      setShowCloseConfirm(false);
      setClosingId(null);
      fetchConvocatorias();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setClosing(false);
    }
  };

  const handleDisponibilidad = async (convocatoriaId: string, playerId: string, value: "SI" | "NO") => {
    setConvocatorias((prev) =>
      prev.map((c) => {
        if (c.id !== convocatoriaId) return c;
        const newJugadores = c.jugadores.map((j) =>
          j.playerId === playerId ? { ...j, disponibilidad: value } : j
        );
        return {
          ...c,
          jugadores: newJugadores,
          confirmados: newJugadores.filter((j) => j.disponibilidad === "SI").length,
        };
      })
    );

    try {
      const res = await fetch(`/api/convocatorias/${convocatoriaId}/disponibilidad`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, disponibilidad: value }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al actualizar");
      }
      toast.success("Disponibilidad actualizada");
    } catch (e: any) {
      toast.error(e.message);
      fetchConvocatorias();
    }
  };

  const handleSaveConvocados = async (convocatoriaId: string) => {
    try {
      const res = await fetch(`/api/convocatorias/${convocatoriaId}/convocados`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerIds: selectedPlayers }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al guardar convocados");
      }
      toast.success("Convocados actualizados");
      setManagingId(null);
      fetchConvocatorias();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const DisponibilidadButtons = ({ convId, jugador }: { convId: string; jugador: Jugador }) => (
    <div className="flex gap-1">
      <Button
        variant={jugador.disponibilidad === "SI" ? "default" : "outline"}
        size="sm"
        className="h-7 text-xs px-2"
        onClick={() => handleDisponibilidad(convId, jugador.playerId, "SI")}
      >
        Sí
      </Button>
      <Button
        variant={jugador.disponibilidad === "NO" ? "destructive" : "outline"}
        size="sm"
        className="h-7 text-xs px-2"
        onClick={() => handleDisponibilidad(convId, jugador.playerId, "NO")}
      >
        No
      </Button>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Convocatorias</h1>
            <p className="text-muted-foreground">Gestión de convocatorias para partidos</p>
          </div>
          <div className="flex items-center gap-2">
            {isStaff && (
              <Button onClick={openCreateSheet}><Plus className="mr-2 h-4 w-4" />Nueva Convocatoria</Button>
            )}
            {userRole === "GLOBAL_ADMIN" && allClubs.length > 1 && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedClubId} onValueChange={setSelectedClubId}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Seleccionar club" />
                  </SelectTrigger>
                  <SelectContent>
                    {allClubs.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-1/3 mb-3" />
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((j) => (
                      <Skeleton key={j} className="h-10 w-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : convocatorias.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <ClipboardList className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>No hay convocatorias</p>
              {isStaff && (
                <Button variant="outline" className="mt-4" onClick={openCreateSheet}>
                  <Plus className="mr-2 h-4 w-4" />Crear primera convocatoria
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {convocatorias.map((conv) => {
              const passedDeadline = new Date(conv.deadline) < new Date();
              const colorStyles = getConvocatoriaColor(conv);
              const isCerrada = conv.status === "CERRADA";
              const IconComponent = colorStyles.iconName === "AlertTriangle" ? AlertTriangle :
                colorStyles.iconName === "PenTool" ? PenTool :
                colorStyles.iconName === "Users" ? Users :
                colorStyles.iconName === "CheckCircle2" ? CheckCircle2 :
                colorStyles.iconName === "Lock" ? Lock :
                colorStyles.iconName === "Send" ? Send :
                colorStyles.iconName === "AlertCircle" ? AlertCircle : AlertCircle;
              return (
                <Card
                  key={conv.id}
                  className={colorStyles.borderClass}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className={`flex items-center gap-2 ${isCerrada ? "opacity-60" : ""}`}>
                          <ClipboardList className="h-5 w-5 text-primary" />
                          {conv.team.name} vs {conv.rival}
                          {colorStyles.alertText ? (
                            <span title={colorStyles.alertText}>
                              <IconComponent className={`h-4 w-4 ${colorStyles.iconColorClass}`} />
                            </span>
                          ) : (
                            <IconComponent className={`h-4 w-4 ${colorStyles.iconColorClass}`} />
                          )}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <CalendarIcon className="h-3 w-3" />
                          {formatDate(conv.matchDate)} · {conv.team.name}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col items-end gap-1">
                          {getStatusBadge(conv.status, colorStyles.badgeClass)}
                          {conv.lastModifiedBy && (
                            <span className="text-[10px] text-muted-foreground italic whitespace-nowrap">
                              Modif: {conv.lastModifiedBy} · {new Date(conv.updatedAt).toLocaleString("es-ES", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                        {isStaff && !isCerrada && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditSheet(conv)} title="Editar">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            {conv.status === "BORRADOR" && (
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={() => { setSendingId(conv.id); setShowSendConfirm(true); }} title="Enviar">
                                <Send className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {conv.status === "ENVIADA" && (
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600" onClick={() => { setClosingId(conv.id); setShowCloseConfirm(true); }} title="Cerrar convocatoria">
                                <ShieldCheck className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {conv.status === "BORRADOR" && (
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setDeletingId(conv.id); setShowDeleteConfirm(true); }} title="Eliminar">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </>
                        )}
                        {isStaff && isCerrada && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-50 cursor-not-allowed" disabled title="Editar (cerrada)">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-50 cursor-not-allowed" disabled title="Enviar (cerrada)">
                              <Send className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <span>Confirmados: <strong className="text-foreground">{conv.confirmados}/{conv.totalJugadores}</strong></span>
                      <span>· Límite: {formatDate(conv.deadline)}</span>
                      {colorStyles.alertText && (
                        <span className={`font-medium flex items-center gap-1 ${colorStyles.borderClass.includes("red") ? "text-red-600" : "text-amber-600"}`}>
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {colorStyles.alertText}
                        </span>
                      )}
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {conv.jugadores.map((j) => {
                        const playerName = `${j.player.user.name ?? ""} ${j.player.user.surname ?? ""}`.trim() || "Jugador";
                        const canEdit = conv.status === "ENVIADA" && (isStaff || !passedDeadline);

                        return (
                          <div
                            key={j.id}
                            className={`flex items-center gap-2 rounded-lg border p-2 ${
                              j.convocado ? "border-green-300 bg-green-50" : ""
                            }`}
                          >
                            {getDisponibilidadIcon(j.disponibilidad)}
                            <span className="text-sm font-medium flex-1 truncate">{playerName}</span>

                            {canEdit ? (
                              <DisponibilidadButtons convId={conv.id} jugador={j} />
                            ) : conv.status === "ENVIADA" ? (
                              getDisponibilidadBadge(j.disponibilidad)
                            ) : (
                              getDisponibilidadBadge(j.disponibilidad)
                            )}

                            {j.convocado && <UserCheck className="h-4 w-4 text-green-600 shrink-0" />}
                            {j.updatedByName && (
                              <span className="text-[10px] text-muted-foreground hidden sm:inline" title={`Modificado por ${j.updatedByName}`}>
                                · {j.updatedByName}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {isStaff && conv.status === "ENVIADA" && (
                      <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowParejas((prev) => prev === conv.id ? null : conv.id);
                          }}
                        >
                          <Users className="mr-2 h-4 w-4" />Gestionar parejas
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowJugadores((prev) => prev === conv.id ? null : conv.id);
                          }}
                        >
                          <UserPlus className="mr-2 h-4 w-4" />Gestionar jugadores
                        </Button>
                      </div>
                    )}

                    {showParejas === conv.id && (
                      <GestionarParejas
                        convocatoria={conv as any}
                        onClose={() => setShowParejas(null)}
                        onSave={() => {
                          setShowParejas(null);
                          fetchConvocatorias();
                        }}
                      />
                    )}

                    {showJugadores === conv.id && (
                      <GestionarJugadores
                        convocatoria={conv as any}
                        onClose={() => setShowJugadores(null)}
                        onSave={() => {
                          setShowJugadores(null);
                          fetchConvocatorias();
                        }}
                      />
                    )}

                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Sheet open={showSheet} onOpenChange={setShowSheet}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editingId ? "Editar Convocatoria" : "Nueva Convocatoria"}</SheetTitle>
            <SheetDescription>
              {editingId ? "Modifica los datos de la convocatoria" : "Crea una nueva convocatoria para un partido"}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Club</label>
              <Select value={formClubId} onValueChange={(v) => { setFormClubId(v); setFormTeamId(""); }} disabled={editingStatus === "ENVIADA"}>
                <SelectTrigger><SelectValue placeholder="Seleccionar club" /></SelectTrigger>
                <SelectContent>
                  {allClubs.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Equipo</label>
              <Select value={formTeamId} onValueChange={setFormTeamId} disabled={editingStatus === "ENVIADA"}>
                <SelectTrigger><SelectValue placeholder={formClubId ? "Seleccionar equipo" : "Primero selecciona un club"} /></SelectTrigger>
                <SelectContent>
                  {formTeams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.category === "MALE" ? "Masculino" : t.category === "FEMALE" ? "Femenino" : "Mixto"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Rival</label>
              <Input placeholder="Nombre del equipo rival" value={formRival} onChange={(e) => setFormRival(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Fecha del partido</label>
              <Input type="date" value={formMatchDate ? formMatchDate.toISOString().split("T")[0] : ""} onChange={(e) => {
                const d = e.target.value ? new Date(e.target.value + "T12:00:00") : undefined;
                setFormMatchDate(d);
                validateDates(d, formDeadline);
              }} />
            </div>
            <div>
              <label className="text-sm font-medium">Fecha límite de respuesta</label>
              <Input type="date" value={formDeadline ? formDeadline.toISOString().split("T")[0] : ""} onChange={(e) => {
                const d = e.target.value ? new Date(e.target.value + "T12:00:00") : undefined;
                setFormDeadline(d);
                validateDates(formMatchDate, d);
              }} />
              {formDateError && <p className="text-sm text-red-500 mt-1">{formDateError}</p>}
            </div>
            {!editingId && (
              <div>
                <label className="text-sm font-medium">Número de parejas</label>
                <div className="flex gap-2 mt-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNumParejas(n)}
                      className={`w-10 h-10 rounded-full text-sm font-semibold transition-colors ${
                        numParejas === n
                          ? "bg-green-600 text-white"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <SheetFooter>
            <Button variant="ghost" onClick={() => setShowSheet(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Guardar cambios" : "Crear convocatoria"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showSendConfirm} onOpenChange={setShowSendConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar Convocatoria</AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const conv = convocatorias.find((c) => c.id === sendingId);
                return conv
                  ? `¿Enviar la convocatoria a los ${conv.totalJugadores} jugadores del equipo ${conv.team.name}? Se les notificará para que confirmen su disponibilidad.`
                  : "";
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => { setShowSendConfirm(false); setSendingId(null); }} disabled={sending}>Cancelar</Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enviar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cerrar Convocatoria</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas cerrar esta convocatoria? Esta acción marcará la convocatoria como finalizada y no se podrá modificar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => { setShowCloseConfirm(false); setClosingId(null); }} disabled={closing}>Cancelar</Button>
            <Button onClick={handleClose} disabled={closing}>
              {closing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cerrar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Convocatoria</AlertDialogTitle>
            <AlertDialogDescription>¿Estás seguro de que deseas eliminar esta convocatoria? Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => { setShowDeleteConfirm(false); setDeletingId(null); }}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}