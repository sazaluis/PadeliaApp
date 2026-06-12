"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Crown, GraduationCap, Search, ArrowLeft, X, UserPlus, Star, Pencil, Trash2, RotateCcw, Building2 } from "lucide-react";
import { PADEL_LEVELS, getLevelLabel } from "@/lib/padel-levels";

interface Player {
  id: string; ranking?: number; level?: string; gender?: string; dominantHand: string; preferredPosition?: string;
  user: { id: string; name: string; surname: string; email: string; phone?: string; image?: string };
  team?: { id: string; name: string; category: string }; club: { id: string; name: string };
}
interface Team {
  id: string; name: string; category: string; level?: string; entrenador?: string;
  club: { id: string; name: string; city: string };
  captain?: { id: string; name: string; surname: string };
  coach?: { id: string; user: { name: string; surname: string } };
  _count: { players: number };
}
interface Club { id: string; name: string; }

export default function TeamsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clubIdFilter = searchParams.get("clubId");

  const [teams, setTeams] = useState<Team[]>([]);
  const [deletedTeams, setDeletedTeams] = useState<Team[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterClub, setFilterClub] = useState("ALL");
  const [filterLevel, setFilterLevel] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", category: "MALE", level: "NONE", clubId: clubIdFilter || "NONE", entrenador: "" });

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [selectedPlayerToAdd, setSelectedPlayerToAdd] = useState("");
  const [showCreatePlayer, setShowCreatePlayer] = useState(false);
  const [createPlayerForm, setCreatePlayerForm] = useState({ name: "", surname: "", email: "", password: "", phone: "", gender: "MALE", dominantHand: "RIGHT" });

  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", category: "MALE", level: "NONE", coachId: "", entrenador: "" });
  const [saving, setSaving] = useState(false);
  const [coaches, setCoaches] = useState<Array<{id:string, user:{name:string, surname:string}}>>([]);

  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"all" | "byClub">("all");

  const fetchData = () => {
    setLoading(true);
    const base = clubIdFilter ? `?clubId=${clubIdFilter}` : "";
    Promise.all([
      fetch(`/api/teams${base}`).then(r => r.json()),
      fetch(`/api/teams${base}${base ? "&" : "?"}deleted=true`).then(r => r.json()),
    ]).then(([active, deleted]) => {
      setTeams(Array.isArray(active) ? active : []);
      setDeletedTeams(Array.isArray(deleted) ? deleted : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [clubIdFilter]);
  useEffect(() => { fetch("/api/clubs").then(r => r.json()).then(d => setClubs(Array.isArray(d) ? d : [])).catch(() => {}); }, []);
  useEffect(() => {
    if (selectedTeam?.club?.id) {
      fetch(`/api/coaches?clubId=${selectedTeam.club.id}`).then(r => r.json()).then(d => {
        setCoaches(Array.isArray(d) ? d : []);
      }).catch(() => {});
    }
  }, [selectedTeam?.club?.id]);

  const filteredClub = clubIdFilter ? clubs.find(c => c.id === clubIdFilter) : null;

  const applyFilters = (list: Team[]) => {
    return list.filter(t => {
      const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.club.name.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;
      if (filterCategory !== "ALL" && t.category !== filterCategory) return false;
      if (filterClub !== "ALL" && t.club.id !== filterClub) return false;
      if (filterLevel !== "ALL") {
        if (filterLevel === "NONE" && t.level) return false;
        if (filterLevel !== "NONE" && t.level !== filterLevel) return false;
      }
      return true;
    });
  };

  const filtered = applyFilters(teams);
  const filteredDeleted = applyFilters(deletedTeams);

  const hasActiveFilters = filterCategory !== "ALL" || filterClub !== "ALL" || filterLevel !== "ALL";
  const clearFilters = () => { setFilterCategory("ALL"); setFilterClub("ALL"); setFilterLevel("ALL"); };

  const getCategoryLabel = (cat: string) => ({ MALE: "Masculino", FEMALE: "Femenino", MIXED: "Mixto" }[cat] || cat);
  const getCategoryColor = (cat: string) => ({ MALE: "bg-blue-100 text-blue-800", FEMALE: "bg-pink-100 text-pink-800", MIXED: "bg-purple-100 text-purple-800" }[cat] || "");
  const getHandLabel = (h: string) => (h === "LEFT" ? "Izquierdo" : "Derecho");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/teams", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, category: form.category, level: form.level === "NONE" ? null : form.level, clubId: form.clubId, entrenador: form.entrenador || null }) });
    if (res.ok) { const t = await res.json(); setTeams([...teams, t]); setShowForm(false); setForm({ name: "", category: "MALE", level: "NONE", clubId: clubIdFilter || "NONE", entrenador: "" }); }
    else { const err = await res.json(); alert(err.error || "Error al crear equipo"); }
  };

  const openTeamDetail = async (team: Team) => {
    setSelectedTeam(team); setLoadingPlayers(true);
    try {
      const pr = await fetch(`/api/players?teamId=${team.id}`); const pd = await pr.json();
      setTeamPlayers(Array.isArray(pd) ? pd : []);
      const ar = await fetch(`/api/players?clubId=${team.club.id}`); const ad = await ar.json();
      const freePlayers = (Array.isArray(ad) ? ad : []).filter((p: Player) => {
        if (p.team) return false;
        if (team.category === "MIXED") return true;
        if (!p.gender) return true;
        if (p.gender === "MIXED") return true;
        return p.gender === team.category;
      });
      setAvailablePlayers(freePlayers);
    } catch { setTeamPlayers([]); setAvailablePlayers([]); }
    setLoadingPlayers(false); setShowAddPlayer(false); setSelectedPlayerToAdd("");
  };

  const closeTeamDetail = () => { setSelectedTeam(null); setTeamPlayers([]); setAvailablePlayers([]); };
  const removePlayerFromTeam = async (playerId: string) => {
    const res = await fetch(`/api/players/${playerId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teamId: null }) });
    if (res.ok) { const up = await res.json(); setTeamPlayers(teamPlayers.filter(p => p.id !== playerId)); setAvailablePlayers([...availablePlayers, up]);
      setTeams(teams.map(t => t.id === selectedTeam?.id ? { ...t, _count: { players: t._count.players - 1 } } : t));
    } else { const err = await res.json(); alert(err.error || "Error al quitar jugador"); }
  };

  const addPlayerToTeam = async () => {
    if (!selectedPlayerToAdd || !selectedTeam) return;
    const res = await fetch(`/api/players/${selectedPlayerToAdd}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teamId: selectedTeam.id }) });
    if (res.ok) { const up = await res.json(); setTeamPlayers([...teamPlayers, up]); setAvailablePlayers(availablePlayers.filter(p => p.id !== selectedPlayerToAdd));
      setSelectedPlayerToAdd(""); setShowAddPlayer(false);
      setTeams(teams.map(t => t.id === selectedTeam?.id ? { ...t, _count: { players: t._count.players + 1 } } : t));
    } else { const err = await res.json(); alert(err.error || "Error al añadir jugador"); }
  };

  const openEditTeam = (team: Team, e: React.MouseEvent) => { e.stopPropagation(); setEditingTeam(team); setEditForm({ name: team.name, category: team.category, level: team.level || "NONE", coachId: team.coach?.id || "", entrenador: team.entrenador || "" }); setShowEditForm(true); };
  const handleSaveTeam = async () => {
    if (!editingTeam) return; setSaving(true);
    const coachId = editForm.coachId === "-" ? null : editForm.coachId || null;
    const res = await fetch(`/api/teams/${editingTeam.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editForm.name, category: editForm.category, level: editForm.level === "NONE" ? null : editForm.level, coachId, entrenador: editForm.entrenador || null }) });
    if (res.ok) { const ut = await res.json(); setTeams(teams.map(t => t.id === editingTeam.id ? ut : t));
      if (selectedTeam?.id === editingTeam.id) setSelectedTeam(ut); setShowEditForm(false); setEditingTeam(null);
    } else { const err = await res.json(); alert(err.error || "Error al guardar los cambios"); }
    setSaving(false);
  };

  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;
    const res = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...createPlayerForm, teamId: selectedTeam.id, clubId: selectedTeam.club.id })
    });
    if (res.ok) {
      const newPlayer = await res.json();
      setTeamPlayers([...teamPlayers, newPlayer]);
      setTeams(teams.map(t => t.id === selectedTeam.id ? { ...t, _count: { players: t._count.players + 1 } } : t));
      setShowCreatePlayer(false);
      setCreatePlayerForm({ name: "", surname: "", email: "", password: "", phone: "", gender: "MALE", dominantHand: "RIGHT" });
    } else { const err = await res.json(); alert(err.error || "Error al crear jugador"); }
  };

  const openDeleteTeam = (team: Team, e: React.MouseEvent) => { e.stopPropagation(); setDeletingTeam(team); setShowDeleteConfirm(true); };
  const handleDeleteTeam = async () => {
    if (!deletingTeam) return; setDeleting(true);
    const res = await fetch(`/api/teams/${deletingTeam.id}`, { method: "DELETE" });
    if (res.ok) { setTeams(teams.filter(t => t.id !== deletingTeam.id)); setDeletedTeams([...deletedTeams, deletingTeam]); setShowDeleteConfirm(false); setDeletingTeam(null); }
    else { const err = await res.json(); alert(err.error || "Error al eliminar el equipo"); }
    setDeleting(false);
  };

  const handleRestoreTeam = async (teamId: string) => {
    setRestoring(teamId);
    const res = await fetch(`/api/teams/${teamId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ restore: true }) });
    if (res.ok) { const restored = deletedTeams.find(t => t.id === teamId); if (restored) { setDeletedTeams(deletedTeams.filter(t => t.id !== teamId)); setTeams([...teams, restored]); } }
    else { const err = await res.json(); alert(err.error || "Error al restaurar el equipo"); }
    setRestoring(null);
  };

  if (selectedTeam) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={closeTeamDetail}><ArrowLeft className="h-5 w-5" /></Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{selectedTeam.name}</h1>
                <p className="text-muted-foreground">{selectedTeam.club.name} · {getCategoryLabel(selectedTeam.category)}{selectedTeam.level && ` · ${getLevelLabel(selectedTeam.level)}`}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={(e) => openEditTeam(selectedTeam, e)}><Pencil className="mr-2 h-4 w-4" />Modificar</Button>
              <Button variant="destructive" size="sm" onClick={(e) => openDeleteTeam(selectedTeam, e)}><Trash2 className="mr-2 h-4 w-4" />Eliminar</Button>
              <Dialog open={showAddPlayer} onOpenChange={setShowAddPlayer}>
                <DialogTrigger asChild><Button><UserPlus className="mr-2 h-4 w-4" />Añadir Jugador</Button></DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>Añadir Jugador a {selectedTeam.name}</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Selecciona un jugador existente o crea uno nuevo</p>
                      <Button variant="outline" size="sm" onClick={() => { setShowAddPlayer(false); setShowCreatePlayer(true); }}>Crear nuevo</Button>
                    </div>
                    {availablePlayers.length === 0 ? <p className="text-sm text-muted-foreground">No hay jugadores disponibles. Crea uno nuevo.</p> : (
                      <>
                        <Select value={selectedPlayerToAdd} onValueChange={setSelectedPlayerToAdd}>
                          <SelectTrigger><SelectValue placeholder="Selecciona un jugador" /></SelectTrigger>
                          <SelectContent>{availablePlayers.map(p => <SelectItem key={p.id} value={p.id}>{p.user.name} {p.user.surname}</SelectItem>)}</SelectContent>
                        </Select>
                        <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowAddPlayer(false)}>Cancelar</Button><Button onClick={addPlayerToTeam} disabled={!selectedPlayerToAdd}>Añadir</Button></div>
                      </>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={showCreatePlayer} onOpenChange={setShowCreatePlayer}>
                <DialogContent>
                  <DialogHeader><DialogTitle>Crear Jugador</DialogTitle></DialogHeader>
                  <form onSubmit={handleCreatePlayer} className="space-y-4">
                    <div><label className="text-sm font-medium">Nombre</label><Input value={createPlayerForm.name} onChange={e => setCreatePlayerForm({ ...createPlayerForm, name: e.target.value })} required /></div>
                    <div><label className="text-sm font-medium">Apellidos</label><Input value={createPlayerForm.surname} onChange={e => setCreatePlayerForm({ ...createPlayerForm, surname: e.target.value })} required /></div>
                    <div><label className="text-sm font-medium">Email</label><Input type="email" value={createPlayerForm.email} onChange={e => setCreatePlayerForm({ ...createPlayerForm, email: e.target.value })} required /></div>
                    <div><label className="text-sm font-medium">Contraseña</label><Input type="password" value={createPlayerForm.password} onChange={e => setCreatePlayerForm({ ...createPlayerForm, password: e.target.value })} required /></div>
                    <div><label className="text-sm font-medium">Teléfono</label><Input value={createPlayerForm.phone} onChange={e => setCreatePlayerForm({ ...createPlayerForm, phone: e.target.value })} /></div>
                    <div><label className="text-sm font-medium">Género</label><Select value={createPlayerForm.gender} onValueChange={(v: string) => setCreatePlayerForm({ ...createPlayerForm, gender: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MALE">Masculino</SelectItem><SelectItem value="FEMALE">Femenino</SelectItem></SelectContent></Select></div>
                    <div><label className="text-sm font-medium">Mano hábil</label><Select value={createPlayerForm.dominantHand} onValueChange={(v: string) => setCreatePlayerForm({ ...createPlayerForm, dominantHand: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="RIGHT">Derecha</SelectItem><SelectItem value="LEFT">Izquierda</SelectItem></SelectContent></Select></div>
                    <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={() => setShowCreatePlayer(false)}>Cancelar</Button><Button type="submit">Crear</Button></div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          {selectedTeam.captain && <div className="flex items-center gap-2 text-sm"><Crown className="h-4 w-4 text-yellow-500" /><span className="font-medium">Capitán:</span><span>{selectedTeam.captain.name} {selectedTeam.captain.surname}</span></div>}
          {selectedTeam.coach && <div className="flex items-center gap-2 text-sm"><GraduationCap className="h-4 w-4 text-primary" /><span className="font-medium">Entrenador:</span><span>{selectedTeam.coach.user.name} {selectedTeam.coach.user.surname}</span></div>}
          <div>
            <h2 className="text-xl font-semibold mb-4">Jugadores ({teamPlayers.length})</h2>
            {loadingPlayers ? <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
            : teamPlayers.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground"><Users className="mx-auto mb-4 h-12 w-12 opacity-50" /><p>Sin jugadores</p>{availablePlayers.length > 0 && <Button variant="outline" className="mt-4" onClick={() => setShowAddPlayer(true)}><UserPlus className="mr-2 h-4 w-4" />Añadir</Button>}</CardContent></Card>
            : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{teamPlayers.map(p => (
              <Card key={p.id} className="transition-shadow hover:shadow-md"><CardHeader className="pb-3"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">{p.user.name.charAt(0)}{p.user.surname.charAt(0)}</div><CardTitle className="text-base">{p.user.name} {p.user.surname}</CardTitle></div><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => removePlayerFromTeam(p.id)}><X className="h-4 w-4" /></Button></div></CardHeader><CardContent><div className="flex flex-wrap gap-2">{p.level && <Badge variant="outline"><Star className="mr-1 h-3 w-3" />{getLevelLabel(p.level)}</Badge>}<Badge variant="outline">{getHandLabel(p.dominantHand)}</Badge>{p.preferredPosition && <Badge variant="secondary">{p.preferredPosition}</Badge>}</div><p className="text-sm text-muted-foreground mt-2">{p.user.email}</p></CardContent></Card>
            ))}</div>}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {clubIdFilter && <Button variant="ghost" size="icon" onClick={() => router.push("/clubs")}><ArrowLeft className="h-5 w-5" /></Button>}
            <div><h1 className="text-3xl font-bold tracking-tight">Equipos</h1><p className="text-muted-foreground">{filteredClub ? `Equipos de ${filteredClub.name}` : "Gestión de equipos"}</p></div>
          </div>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Nuevo Equipo</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Crear Nuevo Equipo</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <Input placeholder="Nombre" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                <Select value={form.category} onValueChange={(v: string) => setForm({ ...form, category: v })}><SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger><SelectContent><SelectItem value="MALE">Masculino</SelectItem><SelectItem value="FEMALE">Femenino</SelectItem><SelectItem value="MIXED">Mixto</SelectItem></SelectContent></Select>
                <Select value={form.level} onValueChange={(v: string) => setForm({ ...form, level: v })}><SelectTrigger><SelectValue placeholder="Nivel" /></SelectTrigger><SelectContent><SelectItem value="NONE">Sin nivel</SelectItem>{PADEL_LEVELS.map(l => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}</SelectContent></Select>
                {!clubIdFilter && <Select value={form.clubId} onValueChange={(v: string) => setForm({ ...form, clubId: v })}><SelectTrigger><SelectValue placeholder="Club" /></SelectTrigger><SelectContent>{clubs.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}<SelectItem value="NONE">Seleccionar</SelectItem></SelectContent></Select>}
                <div><label className="text-sm font-medium">Entrenador</label><Input placeholder="Nombre del entrenador" value={form.entrenador} onChange={e => setForm({ ...form, entrenador: e.target.value })} /></div>
                <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button><Button type="submit">Crear</Button></div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar equipo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Filtros:</span>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Categoría" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas las categorías</SelectItem>
              <SelectItem value="MALE">Masculino</SelectItem>
              <SelectItem value="FEMALE">Femenino</SelectItem>
              <SelectItem value="MIXED">Mixto</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterClub} onValueChange={setFilterClub}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Club" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los clubes</SelectItem>
              {clubs.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Nivel" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los niveles</SelectItem>
              <SelectItem value="NONE">Sin nivel</SelectItem>
              {PADEL_LEVELS.map(l => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant={viewMode === "byClub" ? "default" : "outline"} size="sm" onClick={() => { const next = viewMode === "all" ? "byClub" : "all"; setViewMode(next); }}><Building2 className="mr-1 h-3 w-3" />Por Club</Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <RotateCcw className="mr-1 h-3 w-3" /> Limpiar filtros
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            {filtered.length} equipo{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
        {loading ? <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        : filtered.length === 0 && filteredDeleted.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground"><Users className="mx-auto mb-4 h-12 w-12 opacity-50" /><p>No se encontraron equipos</p></CardContent></Card>
        : (<>
          {viewMode === "byClub" ? (
            (() => {
              const grouped: Record<string, Team[]> = {};
              filtered.forEach(t => { const key = t.club?.id || "__no_club__"; if (!grouped[key]) grouped[key] = []; grouped[key].push(t); });
              const sortedKeys = Object.keys(grouped).sort((a, b) => { if (a === "__no_club__") return 1; if (b === "__no_club__") return -1; return (grouped[a][0].club.name || "").localeCompare(grouped[b][0].club.name || ""); });
              return sortedKeys.map(key => {
                const clubTeams = grouped[key];
                const club = key === "__no_club__" ? null : clubTeams[0].club;
                return (
                  <div key={key} className="space-y-3">
                    <div className="flex items-center gap-2 border-b pb-2">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div><h3 className="font-semibold text-lg">{club ? club.name : "Sin club"}</h3>{club && <p className="text-sm text-muted-foreground">{club.city} · {clubTeams.length} equipo{clubTeams.length > 1 ? "s" : ""}</p>}{!club && <p className="text-sm text-muted-foreground">{clubTeams.length} equipo{clubTeams.length > 1 ? "s" : ""}</p>}</div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{clubTeams.map(team => (
                      <Card key={team.id} className="transition-shadow hover:shadow-md cursor-pointer" onClick={() => openTeamDetail(team)}>
                        <CardHeader className="pb-3"><div className="flex items-start justify-between"><div className="flex items-center gap-2"><CardTitle className="text-lg">{team.name}</CardTitle>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => openEditTeam(team, e)} title="Modificar"><Pencil className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={e => openDeleteTeam(team, e)} title="Eliminar"><Trash2 className="h-3 w-3" /></Button>
                        </div><span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getCategoryColor(team.category)}`}>{getCategoryLabel(team.category)}</span></div>
                        <p className="text-sm text-muted-foreground">{team.club.name} · {team.club.city}</p></CardHeader>
                        <CardContent className="space-y-3">{team.level && <Badge variant="outline"><Star className="mr-1 h-3 w-3" />{getLevelLabel(team.level)}</Badge>}{team.captain && <div className="flex items-center gap-2 text-sm"><Crown className="h-4 w-4 text-yellow-500" /><span>{team.captain.name} {team.captain.surname}</span></div>}<div className="flex items-center gap-2 pt-2 border-t text-sm text-muted-foreground"><Users className="h-4 w-4" /><span>{team._count.players} jugadores</span></div></CardContent>
                      </Card>
                    ))}</div>
                  </div>
                );
              });
            })()
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{filtered.map(team => (
              <Card key={team.id} className="transition-shadow hover:shadow-md cursor-pointer" onClick={() => openTeamDetail(team)}>
                <CardHeader className="pb-3"><div className="flex items-start justify-between"><div className="flex items-center gap-2"><CardTitle className="text-lg">{team.name}</CardTitle>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => openEditTeam(team, e)} title="Modificar"><Pencil className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={e => openDeleteTeam(team, e)} title="Eliminar"><Trash2 className="h-3 w-3" /></Button>
                </div><span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getCategoryColor(team.category)}`}>{getCategoryLabel(team.category)}</span></div>
                <p className="text-sm text-muted-foreground">{team.club.name} · {team.club.city}</p></CardHeader>
                <CardContent className="space-y-3">{team.level && <Badge variant="outline"><Star className="mr-1 h-3 w-3" />{getLevelLabel(team.level)}</Badge>}{team.captain && <div className="flex items-center gap-2 text-sm"><Crown className="h-4 w-4 text-yellow-500" /><span>{team.captain.name} {team.captain.surname}</span></div>}<div className="flex items-center gap-2 pt-2 border-t text-sm text-muted-foreground"><Users className="h-4 w-4" /><span>{team._count.players} jugadores</span></div></CardContent>
              </Card>
            ))}</div>
          )}
          {filteredDeleted.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-muted-foreground border-b pb-2">Equipos Borrados ({filteredDeleted.length})</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-50">{filteredDeleted.map(team => (
                <Card key={team.id} className="border-dashed"><CardHeader className="pb-3"><div className="flex items-start justify-between"><div className="flex items-center gap-2"><CardTitle className="text-lg">{team.name}</CardTitle>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-green-600 hover:text-green-700" onClick={() => handleRestoreTeam(team.id)} disabled={restoring === team.id} title="Restaurar"><RotateCcw className="h-3 w-3" /></Button>
                </div><span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getCategoryColor(team.category)}`}>{getCategoryLabel(team.category)}</span></div>
                <p className="text-sm text-muted-foreground">{team.club.name}</p></CardHeader>
                <CardContent><div className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="h-4 w-4" /><span>{team._count.players} jugadores</span></div></CardContent>
              </Card>
              ))}</div>
            </div>
          )}
        </>)}
        <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
          <DialogContent><DialogHeader><DialogTitle>Modificar Equipo</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><label className="text-sm font-medium">Nombre</label><Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Categoría</label><Select value={editForm.category} onValueChange={(v: string) => setEditForm({ ...editForm, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MALE">Masculino</SelectItem><SelectItem value="FEMALE">Femenino</SelectItem><SelectItem value="MIXED">Mixto</SelectItem></SelectContent></Select></div>
              <div><label className="text-sm font-medium">Nivel</label><Select value={editForm.level} onValueChange={(v: string) => setEditForm({ ...editForm, level: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="NONE">Sin nivel</SelectItem>{PADEL_LEVELS.map(l => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}</SelectContent></Select></div>
              <div><label className="text-sm font-medium">Entrenador</label><Input placeholder="Nombre del entrenador" value={editForm.entrenador} onChange={e => setEditForm({ ...editForm, entrenador: e.target.value })} /></div>
              <div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={() => setShowEditForm(false)} disabled={saving}>Cancelar</Button><Button onClick={handleSaveTeam} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button></div>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Eliminar Equipo</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">¿Eliminar el equipo <strong>{deletingTeam?.name}</strong>?</p>
              {deletingTeam && deletingTeam._count.players > 0 && <div className="text-sm bg-amber-50 border border-amber-200 rounded-md p-3"><p className="font-medium text-amber-800">⚠️ {deletingTeam._count.players} jugador(es) serán desvinculados.</p></div>}
              <p className="text-xs text-muted-foreground">Se moverá a "Equipos Borrados" y podrá ser restaurado.</p>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => { setShowDeleteConfirm(false); setDeletingTeam(null); }} disabled={deleting}>Cancelar</Button><Button variant="destructive" onClick={handleDeleteTeam} disabled={deleting}>{deleting ? "Eliminando..." : "Confirmar"}</Button></div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}