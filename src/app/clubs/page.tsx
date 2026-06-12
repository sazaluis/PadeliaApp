"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Plus, MapPin, Phone, Mail, Users, Search, Trash2, RotateCcw, UserCheck, AlertTriangle, Pencil, Globe } from "lucide-react";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_LABELS: Record<string, string> = {
  monday: "Lunes", tuesday: "Martes", wednesday: "Miércoles",
  thursday: "Jueves", friday: "Viernes", saturday: "Sábado", sunday: "Domingo"
};
const HOURS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${h.toString().padStart(2, "0")}:${m}`;
});

interface DaySchedule {
  open: string | null;
  close: string | null;
}

type WeekSchedule = Record<string, DaySchedule>;

interface Club {
  id: string;
  name: string;
  city: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  courts: number;
  schedule?: string;
  _count: { teams: number; players: number; coaches: number };
  manager?: { id: string; name?: string; surname?: string };
  website?: string;
  description?: string;
}

interface OrphanedPlayer {
  id: string;
  userId: string;
  name?: string;
  surname?: string;
}

interface TeamSnapshot {
  id: string;
  name: string;
  category: string;
  playerIds: string[];
}

interface SnapshotData {
  snapshot: {
    id: string;
    clubName: string;
    teamsSnapshot: string;
  };
  teamsSnapshot: TeamSnapshot[];
  orphanedPlayers: OrphanedPlayer[];
  activeTeams?: Array<{ id: string; name: string; category: string }>;
}

function emptySchedule(): WeekSchedule {
  const s: WeekSchedule = {};
  DAYS.forEach(d => { s[d] = { open: "09:00", close: "21:00" }; });
  return s;
}

function parseSchedule(scheduleStr: string | undefined | null): WeekSchedule {
  if (!scheduleStr) return emptySchedule();
  try {
    const parsed = JSON.parse(scheduleStr);
    const result: WeekSchedule = {};
    for (const day of DAYS) {
      const d = parsed[day];
      if (d && d.open && d.close) {
        result[day] = { open: d.open, close: d.close };
      } else {
        result[day] = { open: null, close: null };
      }
    }
    return result;
  }
  catch { return emptySchedule(); }
}

export default function ClubsPage() {
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [deletedClubs, setDeletedClubs] = useState<Club[]>([]);
  const [orphanedPlayersCount, setOrphanedPlayersCount] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", city: "", address: "", phone: "", email: "", description: "", manager: "", website: "" });
  const [formCourts, setFormCourts] = useState(0);
  const [formSchedule, setFormSchedule] = useState(emptySchedule());

  const [deletingClub, setDeletingClub] = useState<Club | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showHardDeleteConfirm, setShowHardDeleteConfirm] = useState(false);
  const [hardDeleting, setHardDeleting] = useState<string | null>(null);

  const [restoring, setRestoring] = useState<string | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restoreStep, setRestoreStep] = useState(1);
  const [restoreClub, setRestoreClub] = useState<Club | null>(null);
  const [snapshotData, setSnapshotData] = useState<SnapshotData | null>(null);
  const [playerAssignments, setPlayerAssignments] = useState<Record<string, string>>({});

  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "", city: "", address: "", phone: "", email: "", website: "", description: "", managerId: ""
  });
  const [editCourts, setEditCourts] = useState(0);
  const [editSchedule, setEditSchedule] = useState(emptySchedule());

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/clubs").then((r) => r.json()),
      fetch("/api/clubs?deleted=true").then((r) => r.json()),
    ]).then(([active, deleted]) => {
      setClubs(Array.isArray(active) ? active : []);
      setDeletedClubs(Array.isArray(deleted) ? deleted : []);
      setLoading(false);
      deleted.forEach(async (club: Club) => {
        const res = await fetch(`/api/players?originalClubId=${club.id}`);
        if (res.ok) {
          const players = await res.json();
          setOrphanedPlayersCount(prev => ({ ...prev, [club.id]: Array.isArray(players) ? players.length : 0 }));
        }
      });
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = clubs.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.city.toLowerCase().includes(search.toLowerCase())
  );
  const filteredDeleted = deletedClubs.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.city.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const scheduleStr = JSON.stringify(formSchedule);
    const res = await fetch("/api/clubs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, courts: formCourts, schedule: scheduleStr })
    });
    if (res.ok) {
      const club = await res.json();
      setClubs([...clubs, { ...club, _count: { teams: 0, players: 0, coaches: 0 } }]);
      setShowForm(false);
      setForm({ name: "", city: "", address: "", phone: "", email: "", description: "", manager: "", website: "" });
      setFormCourts(0);
      setFormSchedule(emptySchedule());
    }
  };

  const handleDeleteClub = async () => {
    if (!deletingClub) return;
    setDeleting(true);
    const res = await fetch(`/api/clubs/${deletingClub.id}`, { method: "DELETE" });
    if (res.ok) {
      setClubs(clubs.filter(c => c.id !== deletingClub.id));
      setDeletedClubs([...deletedClubs, deletingClub]);
      setShowDeleteConfirm(false);
      setDeletingClub(null);
    } else {
      const err = await res.json();
      alert(err.error || "Error al eliminar el club");
    }
    setDeleting(false);
  };

  const handleRestoreClub = async (clubId: string, reassign = false, assignments?: Record<string, string>) => {
    setRestoring(clubId);
    const res = await fetch(`/api/clubs/${clubId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ restore: true, reassignPlayers: reassign, playerAssignments: assignments }) });
    if (res.ok) {
      const restored = deletedClubs.find(c => c.id === clubId);
      if (restored) {
        setDeletedClubs(deletedClubs.filter(c => c.id !== clubId));
        setClubs([...clubs, restored]);
        setOrphanedPlayersCount(prev => {
          const next = { ...prev };
          delete next[clubId];
          return next;
        });
      }
    } else {
      const err = await res.json();
      alert(err.error || "Error al restaurar el club");
    }
    setRestoring(null);
    setShowRestoreConfirm(false);
    setRestoreClub(null);
    setRestoreStep(1);
    setSnapshotData(null);
  };

const openEditClub = async (club: Club) => {
    setEditingClub(club);
    setEditForm({
      name: club.name,
      city: club.city,
      address: club.address || "",
      phone: club.phone || "",
      email: club.email || "",
      website: club.website || "",
      description: club.description || "",
      managerId: club.manager ? `${club.manager.name || ""} ${club.manager.surname || ""}`.trim() : ""
    });
    setEditCourts(club.courts);
    setEditSchedule(parseSchedule(club.schedule));
    setShowEditDialog(true);
  };

  const handleUpdateClub = async () => {
    if (!editingClub) return;
    const managerId = editForm.managerId === "-" ? null : editForm.managerId || null;
    const scheduleStr = JSON.stringify(editSchedule);
    const res = await fetch(`/api/clubs/${editingClub.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...editForm,
        managerId,
        courts: editCourts,
        schedule: scheduleStr,
        phone: editForm.phone || null,
        email: editForm.email || null,
        website: editForm.website || null,
        description: editForm.description || null
      })
    });
    if (res.ok) {
      const updated = await res.json();
      setClubs(clubs.map(c => c.id === editingClub.id ? updated : c));
      setShowEditDialog(false);
      setEditingClub(null);
    } else {
      const err = await res.json();
      alert(err.error || "Error al actualizar el club");
    }
  };

  const handleHardDeleteClub = async () => {
    if (!hardDeleting) return;
    const res = await fetch(`/api/clubs/${hardDeleting}/delete?permanent=true`, { method: "DELETE" });
    if (res.ok) {
      setDeletedClubs(deletedClubs.filter(c => c.id !== hardDeleting));
      setShowHardDeleteConfirm(false);
      setHardDeleting(null);
    } else {
      const err = await res.json();
      alert(err.error || "Error al eliminar permanentemente el club");
    }
  };

  const startRestoreFlow = async (club: Club) => {
    setRestoreClub(club);
    setRestoreStep(1);
    const res = await fetch(`/api/clubs/${club.id}/snapshot`);
    if (res.ok) {
      const data = await res.json();
      setSnapshotData(data);
      const assignments: Record<string, string> = {};
      data.teamsSnapshot.forEach((team: TeamSnapshot) => {
        team.playerIds.forEach((playerId) => {
          assignments[playerId] = team.id;
        });
      });
      setPlayerAssignments(assignments);
    }
    setShowRestoreConfirm(true);
  };

  const toggleDayClosed = (day: string, schedule: WeekSchedule, onChange: (s: WeekSchedule) => void) => {
    const current = schedule[day];
    if (current?.open === null) {
      onChange({ ...schedule, [day]: { open: "09:00", close: "21:00" } });
    } else {
      onChange({ ...schedule, [day]: { open: null, close: null } });
    }
  };

  const ScheduleInputs = ({ schedule, onChange }: { schedule: WeekSchedule, onChange: (s: WeekSchedule) => void }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium">Horario</label>
      {DAYS.map(day => {
        const isClosed = schedule[day]?.open === null;
        return (
          <div key={day} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2">
            <span className="text-sm text-muted-foreground">{DAY_LABELS[day]}</span>
            {isClosed ? (
              <>
                <span className="text-xs text-muted-foreground col-span-2 text-center">Cerrado</span>
                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toggleDayClosed(day, schedule, onChange)}>Abrir</Button>
              </>
            ) : (
              <>
                <Select value={schedule[day]?.open || "09:00"} onValueChange={(v) => onChange({ ...schedule, [day]: { ...schedule[day], open: v } })}>
                  <SelectTrigger className="h-8 text-xs w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>{HOURS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">-</span>
                <Select value={schedule[day]?.close || "21:00"} onValueChange={(v) => onChange({ ...schedule, [day]: { ...schedule[day], close: v } })}>
                  <SelectTrigger className="h-8 text-xs w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>{HOURS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => toggleDayClosed(day, schedule, onChange)}>Cerrar</Button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clubes</h1>
            <p className="text-muted-foreground">Gestión de clubes de pádel</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}><Plus className="mr-2 h-4 w-4" />Nuevo Club</Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar club por nombre o ciudad..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>

        {showForm && (
          <Card>
            <CardHeader><CardTitle>Crear Nuevo Club</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
                <Input placeholder="Nombre del club" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                <Input placeholder="Ciudad" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
                <Input placeholder="Responsable" value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })} />
                <Input placeholder="Dirección" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                <Input placeholder="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <Input placeholder="Web" value={form.website || ""} onChange={(e) => setForm({ ...form, website: e.target.value })} onFocus={(e) => { if (!form.website) setForm({ ...form, website: "https://" }); }} />
                <Input placeholder="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <div>
                  <label className="text-sm font-medium">Nº de pistas</label>
                  <Input type="number" min={0} value={formCourts} onChange={(e) => setFormCourts(parseInt(e.target.value) || 0)} required />
                </div>
                <div />
                <div className="md:col-span-2">
                  <ScheduleInputs schedule={formSchedule} onChange={setFormSchedule} />
                </div>
                <div className="md:col-span-2 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                  <Button type="submit">Crear Club</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        ) : filtered.length === 0 && filteredDeleted.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground"><Building2 className="mx-auto mb-4 h-12 w-12 opacity-50" /><p>No se encontraron clubes</p></CardContent></Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((club) => (
                <Card key={club.id} className="transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{club.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{club.city}</Badge>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditClub(club)} title="Editar club"><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => { setDeletingClub(club); setShowDeleteConfirm(true); }} title="Eliminar club">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {club.address && <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{club.address}</div>}
                    {club.phone && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="h-4 w-4" />{club.phone}</div>}
                    {club.email && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="h-4 w-4" />{club.email}</div>}
                    {club.website && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Globe className="h-4 w-4" /><a href={club.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{club.website}</a></div>}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-medium">{club.courts}</span> pista{club.courts !== 1 ? "s" : ""}
                    </div>
                    {club.schedule && (() => {
                      try {
                        const s: WeekSchedule = JSON.parse(club.schedule);
                        return DAYS.map(day => {
                          const d = s[day];
                          return (
                            <div key={day} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="font-medium w-12">{DAY_LABELS[day]?.slice(0, 3)}</span>
                              {d?.open && d?.close ? (
                                <span>{d.open} - {d.close}</span>
                              ) : (
                                <span className="text-red-400">Cerrado</span>
                              )}
                            </div>
                          );
                        });
                      } catch { return null; }
                    })()}
                    <div className="flex items-center gap-4 pt-2 border-t">
                      <button onClick={() => router.push(`/teams?clubId=${club.id}`)} className="flex items-center gap-1 text-sm hover:text-primary transition-colors cursor-pointer">
                        <Users className="h-4 w-4 text-primary" /><span><strong>{club._count?.teams ?? 0}</strong> equipos</span>
                      </button>
                      <button onClick={() => router.push(`/players?clubId=${club.id}`)} className="flex items-center gap-1 text-sm hover:text-primary transition-colors cursor-pointer">
                        <Users className="h-4 w-4 text-primary" /><span><strong>{club._count?.players ?? 0}</strong> jugadores</span>
                      </button>
                    </div>
                    {club.manager && <div className="pt-2 border-t mt-2"><span className="text-xs text-muted-foreground">Responsable: {club.manager.name} {club.manager.surname}</span></div>}
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredDeleted.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-muted-foreground border-b pb-2">Clubes Borrados ({filteredDeleted.length})</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-50">
                  {filteredDeleted.map((club) => (
                    <Card key={club.id} className="border-dashed">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{club.name}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{club.city}</Badge>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:text-green-700" onClick={() => startRestoreFlow(club)} disabled={restoring === club.id} title="Restaurar club">
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:text-red-700" onClick={() => { setHardDeleting(club.id); setShowHardDeleteConfirm(true); }} disabled={hardDeleting === club.id} title="Eliminar permanentemente">
                              <AlertTriangle className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {club.address && <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{club.address}</div>}
                        <div className="flex items-center gap-4 pt-2 border-t">
                          <span className="flex items-center gap-1 text-sm text-muted-foreground"><Users className="h-4 w-4" /><span>{club._count.teams} equipos</span></span>
                          <span className="flex items-center gap-1 text-sm text-muted-foreground"><Users className="h-4 w-4" /><span>{club._count.players} jugadores</span></span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Eliminar Club</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">¿Estás seguro de que deseas eliminar el club <strong>{deletingClub?.name}</strong>?</p>
            {deletingClub && deletingClub._count.teams > 0 && (
              <div className="text-sm bg-amber-50 border border-amber-200 rounded-md p-3">
                <p className="font-medium text-amber-800">⚠️ Este club tiene {deletingClub._count.teams} equipo(s) que serán desactivados.</p>
                {deletingClub._count.players > 0 && <p className="text-amber-700 mt-1">Los {deletingClub._count.players} jugador(es) no se borrarán, pero quedarán desvinculados.</p>}
              </div>
            )}
            {deletingClub && deletingClub._count.teams === 0 && deletingClub._count.players > 0 && (
              <p className="text-xs text-muted-foreground bg-muted p-3 rounded-md">⚠️ Los {deletingClub._count.players} jugador(es) no se borrarán, pero quedarán desvinculados del club.</p>
            )}
            <p className="text-xs text-muted-foreground">El club se moverá a la sección "Clubes Borrados" y podrá ser restaurado.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowDeleteConfirm(false); setDeletingClub(null); }} disabled={deleting}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDeleteClub} disabled={deleting}>{deleting ? "Eliminando..." : "Confirmar borrado"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRestoreConfirm} onOpenChange={setShowRestoreConfirm}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {restoreStep === 1 ? "Restaurar Club" : "Reasignar Jugadores"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {restoreStep === 1 ? (
              <>
                <p className="text-sm text-muted-foreground">¿Restaurar el club <strong>{restoreClub?.name}</strong>? Sus equipos también se reactivarán.</p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { setShowRestoreConfirm(false); setRestoreClub(null); setRestoreStep(1); setSnapshotData(null); }} disabled={!!restoring}>Cancelar</Button>
                  <Button onClick={() => {
                    const orphanCount = snapshotData?.orphanedPlayers.length ?? 0;
                    if (orphanCount > 0) {
                      setRestoreStep(2);
                    } else {
                      handleRestoreClub(restoreClub!.id, false);
                    }
                  }} disabled={!!restoring}>Restaurar</Button>
                </div>
              </>
            ) : (
              <>
                <div className="text-sm bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <UserCheck className="h-5 w-5 text-blue-600" />
                    <p className="font-medium text-blue-800">{snapshotData?.orphanedPlayers.length ?? 0} jugador(es) quedaron desvinculados cuando se eliminó el club.</p>
                  </div>
                  <p className="text-blue-700">Selecciona el equipo para cada jugador (se muestra el equipo original como sugerencia):</p>
                </div>
                {snapshotData && snapshotData.orphanedPlayers.length > 0 && (
                  <div className="max-h-60 overflow-y-auto space-y-3">
                    {snapshotData.orphanedPlayers.map((player) => {
                      const suggestedTeam = snapshotData.teamsSnapshot.find(t => t.playerIds.includes(player.id));
                      const availableTeams = (snapshotData.activeTeams && snapshotData.activeTeams.length > 0) ? snapshotData.activeTeams : snapshotData.teamsSnapshot;
                      return (
                        <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <span className="text-sm font-medium">{player.name} {player.surname}</span>
                          <Select value={playerAssignments[player.id] || ""} onValueChange={(value) => setPlayerAssignments({ ...playerAssignments, [player.id]: value })}>
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Seleccionar equipo">
                                {availableTeams.find((t: any) => t.id === playerAssignments[player.id])?.name || suggestedTeam?.name || "Sin equipo"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {availableTeams.map((team: any) => (
                                <SelectItem key={team.id} value={team.id}>
                                  {team.name} ({team.category})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { setShowRestoreConfirm(false); setRestoreClub(null); setRestoreStep(1); setSnapshotData(null); }} disabled={!!restoring}>Cancelar</Button>
                  <Button variant="outline" onClick={() => handleRestoreClub(restoreClub!.id, false)} disabled={!!restoring}>No reasignar</Button>
                  <Button onClick={() => handleRestoreClub(restoreClub!.id, true, playerAssignments)} disabled={!!restoring}>{restoring ? "Restaurando..." : "Reasignar y Restaurar"}</Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Club</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Nombre</label><Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Ciudad</label><Input value={editForm.city} onChange={e => setEditForm({ ...editForm, city: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Responsable</label><Input value={editForm.managerId} onChange={e => setEditForm({ ...editForm, managerId: e.target.value })} placeholder="Nombre del responsable" /></div>
            <div><label className="text-sm font-medium">Dirección</label><Input value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Teléfono</label><Input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Email</label><Input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Web</label><Input value={editForm.website ?? ""} onChange={e => setEditForm({ ...editForm, website: e.target.value })} onFocus={e => { if (!editForm.website) setEditForm({ ...editForm, website: "https://" }); }} /></div>
            <div><label className="text-sm font-medium">Descripción</label><Input value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} /></div>
            <div>
              <label className="text-sm font-medium">Nº de pistas</label>
              <Input type="number" min={0} value={editCourts} onChange={(e) => setEditCourts(parseInt(e.target.value) || 0)} />
            </div>
            <ScheduleInputs schedule={editSchedule} onChange={setEditSchedule} />
            <div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancelar</Button><Button onClick={handleUpdateClub}>Guardar</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showHardDeleteConfirm} onOpenChange={setShowHardDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-red-600">Eliminar Permanentemente</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-10 w-10 text-red-600" />
              <p className="text-sm text-muted-foreground">¿Estás seguro de que deseas eliminar PERMANENTEMENTE el club <strong>{deletedClubs.find(c => c.id === hardDeleting)?.name}</strong>?</p>
            </div>
            <div className="text-xs bg-red-50 border border-red-200 rounded-md p-3">
              <p className="font-medium text-red-800">⚠️ ACCIÓN IRREVERSIBLE</p>
              <p className="text-red-700 mt-1">Se borrarán todos los equipos, jugadores, entrenadores y temporadas de este club. Esta acción no se puede deshacer.</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowHardDeleteConfirm(false); setHardDeleting(null); }}>Cancelar</Button>
              <Button variant="destructive" onClick={handleHardDeleteClub}>Eliminar Permanentemente</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}