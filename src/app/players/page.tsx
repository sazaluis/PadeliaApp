"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCheck, Plus, Mail, Phone, Star, Search, ArrowLeft, Pencil, Trash2, RotateCcw, Building2, Users } from "lucide-react";
import { PADEL_LEVELS, getLevelByCode, levelToNumber } from "@/lib/padel-levels";

interface Player {
  id: string; ranking?: number; level?: string; gender?: string; dominantHand: string; preferredPosition?: string;
  user: { id: string; name: string; surname: string; email: string; phone?: string; image?: string };
  team?: { id: string; name: string; category: string }; club: { id: string; name: string };
}
interface Club { id: string; name: string; }
interface Team { id: string; name: string; category: string; level?: string; }

function filterTeamsForPlayer(teams: Team[], gender: string, playerLevel: string | undefined | null): Team[] {
  return teams.filter((team) => {
    if (gender && gender !== "NONE" && gender !== "MIXED" && team.category !== gender) return false;
    const playerNum = levelToNumber(playerLevel); const teamNum = levelToNumber(team.level);
    if (!playerLevel || playerNum === 0) return true;
    if (!team.level || teamNum === 0) return true;
    return teamNum >= playerNum;
  });
}

export default function PlayersPage() {
  const searchParams = useSearchParams(); const router = useRouter();
  const clubIdFilter = searchParams.get("clubId");

  const [players, setPlayers] = useState<Player[]>([]);
  const [deletedPlayers, setDeletedPlayers] = useState<Player[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterClub, setFilterClub] = useState("ALL");
  const [filterGender, setFilterGender] = useState("ALL");
  const [filterTeam, setFilterTeam] = useState("ALL");
  const [filterLevel, setFilterLevel] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", surname: "", email: "", password: "", phone: "", level: "NONE", gender: "NONE", dominantHand: "RIGHT", preferredPosition: "", clubId: clubIdFilter || "", teamId: "NONE" });

  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", surname: "", email: "", phone: "", level: "NONE", gender: "NONE", dominantHand: "RIGHT", preferredPosition: "", clubId: "", teamId: "NONE" });
  const [editTeams, setEditTeams] = useState<Team[]>([]);
  const [saving, setSaving] = useState(false);

  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [groupByClub, setGroupByClub] = useState(false);
  const [groupByTeam, setGroupByTeam] = useState(false);

  useEffect(() => {
    const base = clubIdFilter ? `/api/players?clubId=${clubIdFilter}` : "/api/players";
    const deletedBase = clubIdFilter ? `/api/players?clubId=${clubIdFilter}&deleted=true` : "/api/players?deleted=true";
    Promise.all([fetch(base).then(r => r.json()), fetch(deletedBase).then(r => r.json())])
      .then(([active, deleted]) => { setPlayers(Array.isArray(active) ? active : []); setDeletedPlayers(Array.isArray(deleted) ? deleted : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [clubIdFilter]);

  useEffect(() => { fetch("/api/clubs").then(r => r.json()).then(d => setClubs(Array.isArray(d) ? d : [])).catch(() => {}); }, []);

  const filteredClub = clubIdFilter ? clubs.find(c => c.id === clubIdFilter) : null;

  const applyFilters = (list: Player[]) => {
    return list.filter(p => {
      // Search filter
      const matchesSearch = !search || `${p.user.name} ${p.user.surname}`.toLowerCase().includes(search.toLowerCase()) || p.user.email.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;
      // Club filter
      if (filterClub !== "ALL" && p.club.id !== filterClub) return false;
      // Gender filter
      if (filterGender !== "ALL" && p.gender !== filterGender) return false;
      // Team filter
      if (filterTeam === "NONE" && p.team) return false;
      if (filterTeam !== "ALL" && filterTeam !== "NONE" && p.team?.id !== filterTeam) return false;
      // Level filter
      if (filterLevel !== "ALL") {
        if (filterLevel === "NONE" && p.level && p.level !== "NONE") return false;
        if (filterLevel !== "NONE" && p.level !== filterLevel) return false;
      }
      return true;
    });
  };

  const filtered = applyFilters(players);
  const filteredDeleted = applyFilters(deletedPlayers);

  // Collect unique team IDs from all players for the team filter
  const allTeamsForFilter = useMemo(() => {
    const teamMap = new Map<string, Team>();
    [...players, ...deletedPlayers].forEach(p => { if (p.team) teamMap.set(p.team.id, p.team as Team); });
    return Array.from(teamMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [players, deletedPlayers]);

  const hasActiveFilters = filterClub !== "ALL" || filterGender !== "ALL" || filterTeam !== "ALL" || filterLevel !== "ALL";
  const clearFilters = () => { setFilterClub("ALL"); setFilterGender("ALL"); setFilterTeam("ALL"); setFilterLevel("ALL"); };

  const getHandLabel = (hand: string) => (hand === "LEFT" ? "Izquierdo" : "Derecho");
  const getLevelBadge = (levelCode: string | undefined | null) => { if (!levelCode || levelCode === "NONE") return null; const level = getLevelByCode(levelCode); return level ? level.label : levelCode; };
  const getGenderLabel = (g: string | undefined | null) => { if (!g) return null; return ({ MALE: "Masculino", FEMALE: "Femenino", MIXED: "Mixto" } as Record<string, string>)[g] || g; };
  const getPositionLabel = (pos: string | undefined | null) => { if (!pos) return null; return ({ DRIVE: "Derecha", REVES: "Revés", AMBAS: "Ambas" } as Record<string, string>)[pos] || pos; };

  const filteredTeamsForCreate = useMemo(() => filterTeamsForPlayer(teams, form.gender, form.level === "NONE" ? null : form.level), [teams, form.gender, form.level]);
  const filteredTeamsForEdit = useMemo(() => filterTeamsForPlayer(editTeams, editForm.gender, editForm.level === "NONE" ? null : editForm.level), [editTeams, editForm.gender, editForm.level]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/players", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, surname: form.surname, email: form.email, password: form.password, phone: form.phone, level: form.level === "NONE" ? null : form.level, gender: form.gender === "NONE" ? null : form.gender, dominantHand: form.dominantHand, preferredPosition: form.preferredPosition, teamId: form.teamId === "NONE" ? null : form.teamId, clubId: form.clubId || null }) });
    if (res.ok) { const p = await res.json(); setPlayers([...players, p]); setShowForm(false); setForm({ name: "", surname: "", email: "", password: "", phone: "", level: "NONE", gender: "NONE", dominantHand: "RIGHT", preferredPosition: "", clubId: clubIdFilter || "", teamId: "NONE" }); }
    else { const err = await res.json(); alert(err.error || "Error al crear jugador"); }
  };

  useEffect(() => { if (form.clubId) { fetch(`/api/teams?clubId=${form.clubId}`).then(r => r.json()).then(d => setTeams(Array.isArray(d) ? d : [])).catch(() => {}); } else { setTeams([]); } }, [form.clubId]);
  useEffect(() => { if (form.teamId && form.teamId !== "NONE") { const t = teams.find(t => t.id === form.teamId); if (t && filterTeamsForPlayer([t], form.gender, form.level === "NONE" ? null : form.level).length === 0) setForm(prev => ({ ...prev, teamId: "NONE" })); } }, [form.gender, form.level, teams]);
  useEffect(() => { if (editForm.clubId) { fetch(`/api/teams?clubId=${editForm.clubId}`).then(r => r.json()).then(d => setEditTeams(Array.isArray(d) ? d : [])).catch(() => {}); } else { setEditTeams([]); } }, [editForm.clubId]);
  useEffect(() => { if (editForm.teamId && editForm.teamId !== "NONE") { const t = editTeams.find(t => t.id === editForm.teamId); if (t && filterTeamsForPlayer([t], editForm.gender, editForm.level === "NONE" ? null : editForm.level).length === 0) setEditForm(prev => ({ ...prev, teamId: "NONE" })); } }, [editForm.gender, editForm.level, editTeams]);

  const openEditPlayer = async (player: Player) => {
    setEditingPlayer(player);
    setEditForm({ name: player.user.name, surname: player.user.surname, email: player.user.email, phone: player.user.phone || "", level: player.level || "NONE", gender: player.gender || "NONE", dominantHand: player.dominantHand, preferredPosition: player.preferredPosition || "", clubId: player.club.id, teamId: player.team?.id || "NONE" });
    setShowEditForm(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPlayer) return; setSaving(true);
    const res = await fetch(`/api/players/${editingPlayer.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editForm.name, surname: editForm.surname, email: editForm.email, phone: editForm.phone, level: editForm.level === "NONE" ? null : editForm.level, gender: editForm.gender === "NONE" ? null : editForm.gender, dominantHand: editForm.dominantHand, preferredPosition: editForm.preferredPosition || null, teamId: editForm.teamId === "NONE" ? null : editForm.teamId, clubId: editForm.clubId }) });
    if (res.ok) { const up = await res.json(); setPlayers(players.map(p => p.id === editingPlayer.id ? up : p)); setShowEditForm(false); setEditingPlayer(null); }
    else { const err = await res.json(); alert(err.error || "Error al guardar"); }
    setSaving(false);
  };

  const handleDeletePlayer = async () => {
    if (!deletingPlayer) return; setDeleting(true);
    const res = await fetch(`/api/players/${deletingPlayer.id}`, { method: "DELETE" });
    if (res.ok) { setPlayers(players.filter(p => p.id !== deletingPlayer.id)); setDeletedPlayers([...deletedPlayers, deletingPlayer]); setShowDeleteConfirm(false); setDeletingPlayer(null); }
    else { const err = await res.json(); alert(err.error || "Error al eliminar"); }
    setDeleting(false);
  };

  const handleRestorePlayer = async (playerId: string) => {
    setRestoring(playerId);
    const res = await fetch(`/api/players/${playerId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ restore: true }) });
    if (res.ok) { const restored = deletedPlayers.find(p => p.id === playerId); if (restored) { setDeletedPlayers(deletedPlayers.filter(p => p.id !== playerId)); setPlayers([...players, restored]); } }
    else { const err = await res.json(); alert(err.error || "Error al restaurar"); }
    setRestoring(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div><div className="flex items-center gap-3">
            {clubIdFilter && <Button variant="ghost" size="icon" onClick={() => router.push("/clubs")}><ArrowLeft className="h-5 w-5" /></Button>}
            <div><h1 className="text-3xl font-bold tracking-tight">Jugadores</h1><p className="text-muted-foreground">{filteredClub ? `Jugadores de ${filteredClub.name}` : "Gestión de jugadores"}</p></div>
          </div></div>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Nuevo Jugador</Button></DialogTrigger>
            <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Crear Nuevo Jugador</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4"><Input placeholder="Nombre" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /><Input placeholder="Apellidos" value={form.surname} onChange={e => setForm({ ...form, surname: e.target.value })} required /></div>
                <Input placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                <Input placeholder="Contraseña" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                <Input placeholder="Teléfono" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                <div className="grid grid-cols-2 gap-4">
                  <Select value={form.gender} onValueChange={(v: string) => setForm({ ...form, gender: v, teamId: "NONE" })}><SelectTrigger><SelectValue placeholder="Género" /></SelectTrigger><SelectContent><SelectItem value="NONE">Sin especificar</SelectItem><SelectItem value="MALE">Masculino</SelectItem><SelectItem value="FEMALE">Femenino</SelectItem><SelectItem value="MIXED">Mixto</SelectItem></SelectContent></Select>
                  <Select value={form.dominantHand} onValueChange={(v: string) => setForm({ ...form, dominantHand: v })}><SelectTrigger><SelectValue placeholder="Mano" /></SelectTrigger><SelectContent><SelectItem value="RIGHT">Derecho</SelectItem><SelectItem value="LEFT">Izquierdo</SelectItem></SelectContent></Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Select value={form.level} onValueChange={(v: string) => setForm({ ...form, level: v, teamId: "NONE" })}><SelectTrigger><SelectValue placeholder="Nivel" /></SelectTrigger><SelectContent><SelectItem value="NONE">Sin nivel</SelectItem>{PADEL_LEVELS.map(l => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}</SelectContent></Select>
                  <Select value={form.preferredPosition || "NONE"} onValueChange={(v: string) => setForm({ ...form, preferredPosition: v === "NONE" ? "" : v })}><SelectTrigger><SelectValue placeholder="Posición" /></SelectTrigger><SelectContent><SelectItem value="NONE">Sin preferencia</SelectItem><SelectItem value="DRIVE">Derecha</SelectItem><SelectItem value="REVES">Revés</SelectItem><SelectItem value="AMBAS">Ambas</SelectItem></SelectContent></Select>
                </div>
                {!clubIdFilter && <Select value={form.clubId} onValueChange={(v: string) => setForm({ ...form, clubId: v, teamId: "NONE" })}><SelectTrigger><SelectValue placeholder="Club (obligatorio)" /></SelectTrigger><SelectContent>{clubs.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>}
                {clubIdFilter && <p className="text-sm text-muted-foreground">Club: {filteredClub?.name}</p>}
                {form.gender !== "NONE" && form.clubId && filteredTeamsForCreate.length > 0 && <Select value={form.teamId} onValueChange={(v: string) => setForm({ ...form, teamId: v })}><SelectTrigger><SelectValue placeholder="Equipo (opcional)" /></SelectTrigger><SelectContent><SelectItem value="NONE">Sin equipo</SelectItem>{filteredTeamsForCreate.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select>}
                <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button><Button type="submit">Crear</Button></div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Dialog */}
        <Dialog open={showEditForm} onOpenChange={setShowEditForm}><DialogContent className="max-w-md max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Editar Jugador</DialogTitle></DialogHeader><div className="space-y-4">
          <div className="grid grid-cols-2 gap-4"><div><label className="text-sm font-medium">Nombre</label><Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div><div><label className="text-sm font-medium">Apellidos</label><Input value={editForm.surname} onChange={e => setEditForm({ ...editForm, surname: e.target.value })} /></div></div>
          <div><label className="text-sm font-medium">Email</label><Input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} /></div>
          <div><label className="text-sm font-medium">Teléfono</label><Input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} /></div>
          <div><label className="text-sm font-medium">Club</label><Select value={editForm.clubId} onValueChange={(v: string) => setEditForm({ ...editForm, clubId: v, teamId: "NONE" })}><SelectTrigger><SelectValue placeholder="Club (obligatorio)" /></SelectTrigger><SelectContent>{clubs.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium">Género</label><Select value={editForm.gender} onValueChange={(v: string) => setEditForm({ ...editForm, gender: v, teamId: "NONE" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="NONE">Sin especificar</SelectItem><SelectItem value="MALE">Masculino</SelectItem><SelectItem value="FEMALE">Femenino</SelectItem><SelectItem value="MIXED">Mixto</SelectItem></SelectContent></Select></div>
            <div><label className="text-sm font-medium">Mano</label><Select value={editForm.dominantHand} onValueChange={(v: string) => setEditForm({ ...editForm, dominantHand: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="RIGHT">Derecho</SelectItem><SelectItem value="LEFT">Izquierdo</SelectItem></SelectContent></Select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium">Nivel</label><Select value={editForm.level} onValueChange={(v: string) => setEditForm({ ...editForm, level: v, teamId: "NONE" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="NONE">Sin nivel</SelectItem>{PADEL_LEVELS.map(l => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}</SelectContent></Select></div>
            <div><label className="text-sm font-medium">Posición</label><Select value={editForm.preferredPosition || "NONE"} onValueChange={(v: string) => setEditForm({ ...editForm, preferredPosition: v === "NONE" ? "" : v })}><SelectTrigger><SelectValue placeholder="Sin preferencia" /></SelectTrigger><SelectContent><SelectItem value="NONE">Sin preferencia</SelectItem><SelectItem value="DRIVE">Derecha</SelectItem><SelectItem value="REVES">Revés</SelectItem><SelectItem value="AMBAS">Ambas</SelectItem></SelectContent></Select></div>
          </div>
          <div><label className="text-sm font-medium">Equipo</label><Select value={editForm.teamId} onValueChange={(v: string) => setEditForm({ ...editForm, teamId: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="NONE">Sin equipo</SelectItem>{filteredTeamsForEdit.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={() => setShowEditForm(false)} disabled={saving}>Cancelar</Button><Button onClick={handleSaveEdit} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button></div>
        </div></DialogContent></Dialog>

        {/* Delete Dialog */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}><DialogContent className="max-w-sm"><DialogHeader><DialogTitle>Eliminar Jugador</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">¿Eliminar a <strong>{deletingPlayer?.user.name} {deletingPlayer?.user.surname}</strong>?</p>
            <p className="text-xs text-muted-foreground bg-muted p-3 rounded-md">⚠️ Se desactivará y perderá su asignación a equipos. Los registros de pagos se conservarán.</p>
            <p className="text-xs text-muted-foreground">Se moverá a "Jugadores Borrados" y podrá ser restaurado.</p>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => { setShowDeleteConfirm(false); setDeletingPlayer(null); }} disabled={deleting}>Cancelar</Button><Button variant="destructive" onClick={handleDeletePlayer} disabled={deleting}>{deleting ? "Eliminando..." : "Confirmar borrado"}</Button></div>
          </div></DialogContent></Dialog>

        <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar por nombre o email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Filtros:</span>
          <Select value={filterClub} onValueChange={setFilterClub}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Club" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los clubes</SelectItem>
              {clubs.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterGender} onValueChange={setFilterGender}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Género" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los géneros</SelectItem>
              <SelectItem value="MALE">Masculino</SelectItem>
              <SelectItem value="FEMALE">Femenino</SelectItem>
              <SelectItem value="MIXED">Mixto</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterTeam} onValueChange={setFilterTeam}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Equipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los equipos</SelectItem>
              <SelectItem value="NONE">Sin equipo</SelectItem>
              {allTeamsForFilter.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
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
          <Button variant={groupByClub ? "default" : "outline"} size="sm" onClick={() => setGroupByClub(!groupByClub)}><Building2 className="mr-1 h-3 w-3" />Por Club</Button>
          <Button variant={groupByTeam ? "default" : "outline"} size="sm" onClick={() => setGroupByTeam(!groupByTeam)}><Users className="mr-1 h-3 w-3" />Por Equipo</Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <RotateCcw className="mr-1 h-3 w-3" /> Limpiar filtros
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            {filtered.length} jugador{filtered.length !== 1 ? "es" : ""}
          </span>
        </div>

        {loading ? <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        : filtered.length === 0 && filteredDeleted.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground"><UserCheck className="mx-auto mb-4 h-12 w-12 opacity-50" /><p>No se encontraron jugadores</p></CardContent></Card>
        : (<>
          {/* Active players */}
          {groupByClub && groupByTeam ? (
            (() => {
              const clubGroups: Record<string, Player[]> = {};
              filtered.forEach(p => { const key = p.club?.id || "__no_club__"; if (!clubGroups[key]) clubGroups[key] = []; clubGroups[key].push(p); });
              const sortedClubKeys = Object.keys(clubGroups).sort((a, b) => { if (a === "__no_club__") return 1; if (b === "__no_club__") return -1; return (clubGroups[a][0].club.name || "").localeCompare(clubGroups[b][0].club.name || ""); });
              return sortedClubKeys.map(clubKey => {
                const clubPlayers = clubGroups[clubKey];
                const club = clubKey === "__no_club__" ? null : clubPlayers[0].club;
                const teamGroups: Record<string, Player[]> = {};
                clubPlayers.forEach(p => { const k = p.team?.id || "__no_team__"; if (!teamGroups[k]) teamGroups[k] = []; teamGroups[k].push(p); });
                const sortedTeamKeys = Object.keys(teamGroups).sort((a, b) => { if (a === "__no_team__") return 1; if (b === "__no_team__") return -1; return (teamGroups[a][0].team?.name || "").localeCompare(teamGroups[b][0].team?.name || ""); });
                return (
                  <div key={clubKey} className="space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div><h3 className="font-semibold text-lg">{club ? club.name : "Sin club"}</h3><p className="text-sm text-muted-foreground">{clubPlayers.length} jugador{clubPlayers.length > 1 ? "es" : ""}</p></div>
                    </div>
                    <div className="space-y-4 pl-4">{sortedTeamKeys.map(teamKey => {
                      const teamPlayers = teamGroups[teamKey];
                      const team = teamKey === "__no_team__" ? null : teamPlayers[0].team;
                      return (
                        <div key={teamKey} className="space-y-2">
                          <div className="flex items-center gap-2 border-b border-dashed pb-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <h4 className="font-medium text-sm">{team ? team.name : "Sin equipo"}</h4>
                            <span className="text-xs text-muted-foreground">({teamPlayers.length})</span>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{teamPlayers.map(player => (
                            <Card key={player.id} className="transition-shadow hover:shadow-md"><CardHeader className="pb-3"><div className="flex items-center gap-3">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">{player.user.name.charAt(0)}{player.user.surname.charAt(0)}</div>
                              <div className="flex-1"><CardTitle className="text-base">{player.user.name} {player.user.surname}</CardTitle><p className="text-sm text-muted-foreground">{player.club.name}</p></div>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive shrink-0" onClick={() => { setDeletingPlayer(player); setShowDeleteConfirm(true); }}><Trash2 className="h-4 w-4" /></Button>
                            </div></CardHeader><CardContent className="space-y-2"><div className="flex flex-wrap gap-2">
                              {player.ranking && <Badge variant="secondary">#{player.ranking}</Badge>}
                              {getGenderLabel(player.gender) && <Badge variant="outline">{getGenderLabel(player.gender)}</Badge>}
                              {player.level && <Badge variant="outline"><Star className="mr-1 h-3 w-3" />{getLevelBadge(player.level)}</Badge>}
                              <Badge variant="outline">{getHandLabel(player.dominantHand)}</Badge>
                              {player.preferredPosition && <Badge variant="secondary">{getPositionLabel(player.preferredPosition)}</Badge>}
                            </div></CardContent></Card>
                          ))}</div>
                        </div>
                      );
                    })}</div>
                  </div>
                );
              });
            })()
          ) : groupByClub ? (
            (() => {
              const grouped: Record<string, Player[]> = {};
              filtered.forEach(p => { const key = p.club?.id || "__no_club__"; if (!grouped[key]) grouped[key] = []; grouped[key].push(p); });
              const sortedKeys = Object.keys(grouped).sort((a, b) => { if (a === "__no_club__") return 1; if (b === "__no_club__") return -1; return (grouped[a][0].club.name || "").localeCompare(grouped[b][0].club.name || ""); });
              return sortedKeys.map(key => {
                const clubPlayers = grouped[key];
                const club = key === "__no_club__" ? null : clubPlayers[0].club;
                return (
                  <div key={key} className="space-y-3">
                    <div className="flex items-center gap-2 border-b pb-2">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div><h3 className="font-semibold text-lg">{club ? club.name : "Sin club"}</h3><p className="text-sm text-muted-foreground">{clubPlayers.length} jugador{clubPlayers.length > 1 ? "es" : ""}</p></div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{clubPlayers.map(player => (
                      <Card key={player.id} className="transition-shadow hover:shadow-md"><CardHeader className="pb-3"><div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">{player.user.name.charAt(0)}{player.user.surname.charAt(0)}</div>
                        <div className="flex-1"><CardTitle className="text-base">{player.user.name} {player.user.surname}</CardTitle><div className="flex items-center gap-1">{player.team ? <p className="text-sm text-muted-foreground">{player.team.name}</p> : <p className="text-sm text-muted-foreground italic">Sin equipo</p>}<Button variant="ghost" size="icon" className="h-6 w-6 ml-1" onClick={() => openEditPlayer(player)}><Pencil className="h-3 w-3" /></Button></div></div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive shrink-0" onClick={() => { setDeletingPlayer(player); setShowDeleteConfirm(true); }}><Trash2 className="h-4 w-4" /></Button>
                      </div></CardHeader><CardContent className="space-y-2"><div className="flex flex-wrap gap-2">
                        {player.ranking && <Badge variant="secondary">#{player.ranking}</Badge>}
                        {getGenderLabel(player.gender) && <Badge variant="outline">{getGenderLabel(player.gender)}</Badge>}
                        {player.level && <Badge variant="outline"><Star className="mr-1 h-3 w-3" />{getLevelBadge(player.level)}</Badge>}
                        <Badge variant="outline">{getHandLabel(player.dominantHand)}</Badge>
                        {player.preferredPosition && <Badge variant="secondary">{getPositionLabel(player.preferredPosition)}</Badge>}
                      </div><div className="space-y-1 pt-2 text-sm text-muted-foreground"><div className="flex items-center gap-2"><Mail className="h-3 w-3" />{player.user.email}</div>{player.user.phone && <div className="flex items-center gap-2"><Phone className="h-3 w-3" />{player.user.phone}</div>}</div></CardContent></Card>
                    ))}</div>
                  </div>
                );
              });
            })()
          ) : groupByTeam ? (
            (() => {
              const grouped: Record<string, Player[]> = {};
              filtered.forEach(p => { const key = p.team?.id || "__no_team__"; if (!grouped[key]) grouped[key] = []; grouped[key].push(p); });
              const sortedKeys = Object.keys(grouped).sort((a, b) => { if (a === "__no_team__") return 1; if (b === "__no_team__") return -1; return (grouped[a][0].team?.name || "").localeCompare(grouped[b][0].team?.name || ""); });
              return sortedKeys.map(key => {
                const teamPlayers = grouped[key];
                const team = key === "__no_team__" ? null : teamPlayers[0].team;
                return (
                  <div key={key} className="space-y-3">
                    <div className="flex items-center gap-2 border-b pb-2">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div><h3 className="font-semibold text-lg">{team ? team.name : "Sin equipo"}</h3><p className="text-sm text-muted-foreground">{teamPlayers.length} jugador{teamPlayers.length > 1 ? "es" : ""}</p></div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{teamPlayers.map(player => (
                      <Card key={player.id} className="transition-shadow hover:shadow-md"><CardHeader className="pb-3"><div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">{player.user.name.charAt(0)}{player.user.surname.charAt(0)}</div>
                        <div className="flex-1"><CardTitle className="text-base">{player.user.name} {player.user.surname}</CardTitle><div className="flex items-center gap-1"><p className="text-sm text-muted-foreground">{player.club.name}</p><Button variant="ghost" size="icon" className="h-6 w-6 ml-1" onClick={() => openEditPlayer(player)}><Pencil className="h-3 w-3" /></Button></div></div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive shrink-0" onClick={() => { setDeletingPlayer(player); setShowDeleteConfirm(true); }}><Trash2 className="h-4 w-4" /></Button>
                      </div></CardHeader><CardContent className="space-y-2"><div className="flex flex-wrap gap-2">
                        {player.ranking && <Badge variant="secondary">#{player.ranking}</Badge>}
                        {getGenderLabel(player.gender) && <Badge variant="outline">{getGenderLabel(player.gender)}</Badge>}
                        {player.level && <Badge variant="outline"><Star className="mr-1 h-3 w-3" />{getLevelBadge(player.level)}</Badge>}
                        <Badge variant="outline">{getHandLabel(player.dominantHand)}</Badge>
                        {player.preferredPosition && <Badge variant="secondary">{getPositionLabel(player.preferredPosition)}</Badge>}
                      </div><div className="space-y-1 pt-2 text-sm text-muted-foreground"><div className="flex items-center gap-2"><Mail className="h-3 w-3" />{player.user.email}</div>{player.user.phone && <div className="flex items-center gap-2"><Phone className="h-3 w-3" />{player.user.phone}</div>}</div></CardContent></Card>
                    ))}</div>
                  </div>
                );
              });
            })()
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map(player => (
                <Card key={player.id} className="transition-shadow hover:shadow-md"><CardHeader className="pb-3"><div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">{player.user.name.charAt(0)}{player.user.surname.charAt(0)}</div>
                  <div className="flex-1"><CardTitle className="text-base">{player.user.name} {player.user.surname}</CardTitle><div className="flex items-center gap-1">{player.team ? <p className="text-sm text-muted-foreground">{player.team.name}</p> : <p className="text-sm text-muted-foreground italic">Sin equipo</p>}<Button variant="ghost" size="icon" className="h-6 w-6 ml-1" onClick={() => openEditPlayer(player)}><Pencil className="h-3 w-3" /></Button></div></div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive shrink-0" onClick={() => { setDeletingPlayer(player); setShowDeleteConfirm(true); }}><Trash2 className="h-4 w-4" /></Button>
                </div></CardHeader><CardContent className="space-y-2"><div className="flex flex-wrap gap-2">
                  {player.ranking && <Badge variant="secondary">#{player.ranking}</Badge>}
                  {getGenderLabel(player.gender) && <Badge variant="outline">{getGenderLabel(player.gender)}</Badge>}
                  {player.level && <Badge variant="outline"><Star className="mr-1 h-3 w-3" />{getLevelBadge(player.level)}</Badge>}
                  <Badge variant="outline">{getHandLabel(player.dominantHand)}</Badge>
                  {player.preferredPosition && <Badge variant="secondary">{getPositionLabel(player.preferredPosition)}</Badge>}
                </div><div className="space-y-1 pt-2 text-sm text-muted-foreground"><div className="flex items-center gap-2"><Mail className="h-3 w-3" />{player.user.email}</div>{player.user.phone && <div className="flex items-center gap-2"><Phone className="h-3 w-3" />{player.user.phone}</div>}</div></CardContent></Card>
              ))}
            </div>
          )}
          {/* Deleted players */}
          {filteredDeleted.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-muted-foreground border-b pb-2">Jugadores Borrados ({filteredDeleted.length})</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-50">
                {filteredDeleted.map(player => (
                  <Card key={player.id} className="border-dashed"><CardHeader className="pb-3"><div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">{player.user.name.charAt(0)}{player.user.surname.charAt(0)}</div>
                    <div className="flex-1"><CardTitle className="text-base">{player.user.name} {player.user.surname}</CardTitle><p className="text-sm text-muted-foreground italic">{player.team?.name || "Sin equipo"}</p></div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 shrink-0" onClick={() => handleRestorePlayer(player.id)} disabled={restoring === player.id} title="Restaurar"><RotateCcw className="h-4 w-4" /></Button>
                  </div></CardHeader><CardContent className="space-y-2"><div className="flex flex-wrap gap-2">
                    {player.level && <Badge variant="outline"><Star className="mr-1 h-3 w-3" />{getLevelBadge(player.level)}</Badge>}
                    <Badge variant="outline">{getHandLabel(player.dominantHand)}</Badge>
                  </div><p className="text-sm text-muted-foreground">{player.user.email}</p></CardContent></Card>
                ))}
              </div>
            </div>
          )}
        </>)}
      </div>
    </DashboardLayout>
  );
}