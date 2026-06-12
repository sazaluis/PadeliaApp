"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetDescription } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Building2, Plus, ChevronLeft, ChevronRight, CalendarDays, MoreHorizontal, Pencil, Trash2, Clock, Dumbbell, Repeat, Loader2, CalendarRange } from "lucide-react";
import { startOfWeek, endOfWeek, addWeeks, subWeeks, format, addDays } from "date-fns";
import { ApplyTemplateModal } from "@/components/trainings/apply-template-modal";
import { TimeInput, addHourAndHalf } from "@/components/ui/time-input";
import { es } from "date-fns/locale";

// ── Color palette for teams ──
const TEAM_COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899",
  "#06b6d4", "#f97316", "#6366f1", "#14b8a6", "#e11d48", "#84cc16",
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getTeamColor(teamId: string): string {
  return TEAM_COLORS[hashString(teamId) % TEAM_COLORS.length];
}

// ── Types ──
interface Club {
  id: string; name: string; city: string; courts: number;
}
interface Team {
  id: string; name: string; category: string;
}
interface Coach {
  id: string; user: { name: string; surname: string };
}
interface Training {
  id: string; title: string; date: string; startTime: string; endTime: string | null;
  court: string | null; notes: string | null;
  team: { id: string; name: string; category: string };
  coach: { id: string; user: { name: string; surname: string } } | null;
}
interface TrainingTemplate {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  court: string | null;
  team: { id: string; name: string; category: string };
  coach: { id: string; user: { name: string; surname: string } } | null;
}

const DAY_LABELS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

// ── Week helper ──
function getWeekRange(date: Date) {
  const monday = startOfWeek(date, { weekStartsOn: 1 });
  const sunday = endOfWeek(date, { weekStartsOn: 1 });
  return { monday, sunday };
}

function formatWeekRange(date: Date): string {
  const { monday, sunday } = getWeekRange(date);
  const sameMonth = monday.getMonth() === sunday.getMonth();
  const sameYear = monday.getFullYear() === sunday.getFullYear();
  if (sameMonth && sameYear) {
    return `${monday.getDate()} – ${sunday.getDate()} ${format(sunday, "MMM", { locale: es })} ${sunday.getFullYear()}`;
  }
  if (sameYear) {
    return `${format(monday, "d MMM", { locale: es })} – ${format(sunday, "d MMM", { locale: es })} ${sunday.getFullYear()}`;
  }
  return `${format(monday, "d MMM yyyy", { locale: es })} – ${format(sunday, "d MMM yyyy", { locale: es })}`;
}

const DAYS_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// ── Generate court options from club.courts ──
function getCourtList(club: Club | null): string[] {
  if (!club || club.courts <= 0) return [];
  return Array.from({ length: club.courts }, (_, i) => `Pista ${i + 1}`);
}

export default function TrainingsPage() {
  const router = useRouter();

  // Club selection
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [loadingClubs, setLoadingClubs] = useState(true);

  // Week navigation
  const [weekBase, setWeekBase] = useState(() => new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Data
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // New training sheet
  const [showSheet, setShowSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: "10:00",
    endTime: "11:30",
    court: "",
    teamId: "",
    coachId: "",
    notes: "",
  });

  // Edit training
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);
  const [editFormData, setEditFormData] = useState({
    date: "", startTime: "", endTime: "", court: "", teamId: "", coachId: "", notes: "",
  });

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Templates
  const [templates, setTemplates] = useState<TrainingTemplate[]>([]);
  const [showTemplatesSheet, setShowTemplatesSheet] = useState(false);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TrainingTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    dayOfWeek: 0,
    startTime: "10:00",
    endTime: "11:00",
    court: "",
    teamId: "",
    coachId: "",
  });
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);

  // Apply templates (legacy weekly)
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [applyingTemplates, setApplyingTemplates] = useState(false);

  // Apply template modal (multi-step)
  const [showApplyTemplateModal, setShowApplyTemplateModal] = useState(false);
  const [preselectedTemplateId, setPreselectedTemplateId] = useState<string | null>(null);

  // ── Load clubs on mount ──
  useEffect(() => {
    fetch("/api/clubs").then(r => r.json()).then((data: Club[]) => {
      const active = Array.isArray(data) ? data : [];
      setClubs(active);
      setLoadingClubs(false);
      if (active.length === 1) {
        setSelectedClub(active[0]);
      }
    }).catch(() => setLoadingClubs(false));
  }, []);

  // ── Load teams & coaches when club changes ──
  useEffect(() => {
    if (!selectedClub) return;
    Promise.all([
      fetch(`/api/teams?clubId=${selectedClub.id}`).then(r => r.json()),
      fetch(`/api/coaches?clubId=${selectedClub.id}`).then(r => r.json()),
    ]).then(([teamsData, coachesData]) => {
      setTeams(Array.isArray(teamsData) ? teamsData : []);
      setCoaches(Array.isArray(coachesData) ? coachesData : []);
    }).catch(() => {});
  }, [selectedClub]);

  // ── Load templates when club changes ──
  const fetchTemplates = useCallback(async () => {
    if (!selectedClub) return;
    try {
      const res = await fetch(`/api/templates?clubId=${selectedClub.id}`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(Array.isArray(data) ? data : []);
      }
    } catch {}
  }, [selectedClub]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  // ── Fetch trainings for current week ──
  const fetchTrainings = useCallback(async () => {
    if (!selectedClub) return;
    setLoading(true);
    setError("");
    const { monday, sunday } = getWeekRange(weekBase);
    const params = new URLSearchParams({
      clubId: selectedClub.id,
      startDate: monday.toISOString(),
      endDate: sunday.toISOString(),
    });
    try {
      const res = await fetch(`/api/trainings?${params}`);
      if (!res.ok) throw new Error("Error al cargar sesiones");
      const data = await res.json();
      setTrainings(Array.isArray(data) ? data : []);
    } catch {
      setError("No se pudieron cargar las sesiones");
    }
    setLoading(false);
  }, [selectedClub, weekBase]);

  useEffect(() => { fetchTrainings(); }, [fetchTrainings]);

  // ── Create training ──
  const handleCreate = async () => {
    if (!selectedClub || !formData.teamId || !formData.date || !formData.startTime || !formData.endTime) return;
    setSaving(true);
    try {
      const res = await fetch("/api/trainings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, clubId: selectedClub.id }),
      });
      if (!res.ok) throw new Error();
      setShowSheet(false);
      setFormData({ date: format(new Date(), "yyyy-MM-dd"), startTime: "10:00", endTime: "11:30", court: "", teamId: "", coachId: "", notes: "" });
      fetchTrainings();
    } catch {
      alert("Error al crear la sesión");
    }
    setSaving(false);
  };

  // ── Edit training ──
  const openEdit = (training: Training) => {
    setEditingTraining(training);
    setEditFormData({
      date: format(new Date(training.date), "yyyy-MM-dd"),
      startTime: training.startTime,
      endTime: training.endTime || "11:00",
      court: training.court || "",
      teamId: training.team.id,
      coachId: training.coach?.id || "",
      notes: training.notes || "",
    });
  };

  const handleEdit = async () => {
    if (!editingTraining) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/trainings/${editingTraining.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });
      if (!res.ok) throw new Error();
      setEditingTraining(null);
      fetchTrainings();
    } catch {
      alert("Error al guardar cambios");
    }
    setSaving(false);
  };

  // ── Delete training ──
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/trainings/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setDeleteId(null);
      fetchTrainings();
    } catch {
      alert("Error al eliminar la sesión");
    }
    setDeleting(false);
  };

  // ── Template handlers ──
  const openNewTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({
      dayOfWeek: 0,
      startTime: "10:00",
      endTime: "11:00",
      court: "",
      teamId: "",
      coachId: "",
    });
    setShowNewTemplate(true);
  };

  const openEditTemplate = (template: TrainingTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      dayOfWeek: template.dayOfWeek,
      startTime: template.startTime,
      endTime: template.endTime,
      court: template.court || "",
      teamId: template.team.id,
      coachId: template.coach?.id || "",
    });
    setShowNewTemplate(true);
  };

  const handleSaveTemplate = async () => {
    if (!selectedClub || !templateForm.teamId || !templateForm.startTime || !templateForm.endTime) return;
    setSavingTemplate(true);
    try {
      const url = editingTemplate
        ? `/api/templates/${editingTemplate.id}`
        : "/api/templates";
      const method = editingTemplate ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...templateForm,
          clubId: selectedClub.id,
          coachId: templateForm.coachId || null,
          court: templateForm.court || null,
        }),
      });
      if (!res.ok) throw new Error();
      setShowNewTemplate(false);
      setEditingTemplate(null);
      fetchTemplates();
    } catch {
      alert("Error al guardar la plantilla");
    }
    setSavingTemplate(false);
  };

  const handleDeleteTemplate = async () => {
    if (!deleteTemplateId) return;
    try {
      const res = await fetch(`/api/templates/${deleteTemplateId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setDeleteTemplateId(null);
      fetchTemplates();
    } catch {
      alert("Error al eliminar la plantilla");
    }
  };

  const handleApplyTemplatesLegacy = async () => {
    if (!selectedClub) return;
    setApplyingTemplates(true);
    try {
      const { monday } = getWeekRange(weekBase);
      const res = await fetch("/api/trainings/apply-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubId: selectedClub.id,
          weekStart: monday.toISOString(),
        }),
      });
      if (!res.ok) throw new Error();
      setShowApplyDialog(false);
      fetchTrainings();
    } catch {
      alert("Error al aplicar las plantillas");
    }
    setApplyingTemplates(false);
  };

  // ── Club selection view ──
  if (loadingClubs) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      </DashboardLayout>
    );
  }

  if (!selectedClub) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          <div><h1 className="text-3xl font-bold tracking-tight">Entrenamientos</h1><p className="text-muted-foreground">Selecciona un club para gestionar sus entrenamientos</p></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clubs.map(club => (
              <Card key={club.id} className="transition-shadow hover:shadow-md cursor-pointer" onClick={() => setSelectedClub(club)}>
                <CardContent className="py-6">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-8 w-8 text-primary" />
                    <div><h3 className="font-semibold text-lg">{club.name}</h3><p className="text-sm text-muted-foreground">{club.city}</p></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Training view ──
  const weekDays: Date[] = [];
  const { monday, sunday } = getWeekRange(weekBase);
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDays.push(d);
  }

  const trainingsByDay: Record<string, Training[]> = {};
  weekDays.forEach(d => { trainingsByDay[format(d, "yyyy-MM-dd")] = []; });
  trainings.forEach(t => {
    const key = format(new Date(t.date), "yyyy-MM-dd");
    if (trainingsByDay[key]) trainingsByDay[key].push(t);
  });

  const isToday = (d: Date) => format(d, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  const courtOptions = getCourtList(selectedClub);

  const TrainingCard = ({ training }: { training: Training }) => (
    <div className="relative group">
      <div
        className="rounded-lg border bg-card p-2.5 cursor-pointer transition-shadow hover:shadow-sm"
        style={{ borderLeft: `3px solid ${getTeamColor(training.team.id)}` }}
      >
        <div className="flex items-start justify-between gap-1">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1">
              <Clock className="h-3 w-3" />
              <span>{training.startTime}{training.endTime ? ` - ${training.endTime}` : ""}</span>
            </div>
            <p className="text-xs font-medium text-foreground truncate">{training.team.name}</p>
            {training.court && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded-full mt-1">{training.court}</Badge>}
            {training.coach && (
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">{training.coach.user.name} {training.coach.user.surname}</p>
            )}
          </div>
          <div className="relative">
            <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
            <div className="absolute right-0 top-0 hidden group-hover:flex flex-col bg-popover border rounded-md shadow-md z-10 min-w-[100px]">
              <button className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors" onClick={() => openEdit(training)}>
                <Pencil className="h-3 w-3" /> Editar
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-muted transition-colors" onClick={() => setDeleteId(training.id)}>
                <Trash2 className="h-3 w-3" /> Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setSelectedClub(null)}><ChevronLeft className="h-5 w-5" /></Button>
              <div>
                <h1 className="text-xl font-medium">{selectedClub.name}</h1>
                <p className="text-sm text-muted-foreground">Entrenamientos</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowTemplatesSheet(true)}>
              <Repeat className="mr-1.5 h-4 w-4" />Plantillas
            </Button>
            {templates.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => { setPreselectedTemplateId(null); setShowApplyTemplateModal(true); }}>
                <CalendarRange className="mr-1.5 h-4 w-4" />Aplicar a periodo
              </Button>
            )}
            <Sheet open={showSheet} onOpenChange={setShowSheet}>
              <SheetTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" />Nueva sesión</Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader><SheetTitle>Nueva sesión de entrenamiento</SheetTitle></SheetHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-medium">Fecha</label>
                    <Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">Hora inicio</label>
                      <TimeInput
                        value={formData.startTime}
                        onChange={(v) => setFormData({
                          ...formData,
                          startTime: v,
                          endTime: addHourAndHalf(v),
                        })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Hora fin</label>
                      <TimeInput
                        value={formData.endTime}
                        onChange={(v) => setFormData({ ...formData, endTime: v })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Pista</label>
                    <Select value={formData.court} onValueChange={v => setFormData({ ...formData, court: v === "__none__" ? "" : v })}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar pista" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Sin pista</SelectItem>
                        {courtOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Equipo / grupo</label>
                    <Select value={formData.teamId} onValueChange={v => setFormData({ ...formData, teamId: v })}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar equipo" /></SelectTrigger>
                      <SelectContent>
                        {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Entrenador</label>
                    <Select value={formData.coachId} onValueChange={v => setFormData({ ...formData, coachId: v === "__none__" ? "" : v })}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar entrenador" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Sin entrenador</SelectItem>
                        {coaches.map(c => <SelectItem key={c.id} value={c.id}>{c.user.name} {c.user.surname}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Notas</label>
                    <Textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Opcional" />
                  </div>
                </div>
                <SheetFooter>
                  <Button variant="outline" onClick={() => setShowSheet(false)}>Cancelar</Button>
                  <Button onClick={handleCreate} disabled={saving || !formData.teamId || !formData.date || !formData.startTime || !formData.endTime}>
                    {saving ? "Guardando..." : "Guardar sesión"}
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Edit Sheet */}
        <Sheet open={!!editingTraining} onOpenChange={(open) => { if (!open) setEditingTraining(null); }}>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader><SheetTitle>Editar sesión</SheetTitle></SheetHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Fecha</label>
                <Input type="date" value={editFormData.date} onChange={e => setEditFormData({ ...editFormData, date: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Hora inicio</label>
                  <Input type="time" value={editFormData.startTime} onChange={e => setEditFormData({ ...editFormData, startTime: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Hora fin</label>
                  <Input type="time" value={editFormData.endTime} onChange={e => setEditFormData({ ...editFormData, endTime: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Pista</label>
                <Select value={editFormData.court || "__none__"} onValueChange={v => setEditFormData({ ...editFormData, court: v === "__none__" ? "" : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin pista</SelectItem>
                    {courtOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Equipo</label>
                <Select value={editFormData.teamId} onValueChange={v => setEditFormData({ ...editFormData, teamId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Entrenador</label>
                <Select value={editFormData.coachId || "__none__"} onValueChange={v => setEditFormData({ ...editFormData, coachId: v === "__none__" ? "" : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin entrenador</SelectItem>
                    {coaches.map(c => <SelectItem key={c.id} value={c.id}>{c.user.name} {c.user.surname}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Notas</label>
                <Textarea value={editFormData.notes} onChange={e => setEditFormData({ ...editFormData, notes: e.target.value })} />
              </div>
            </div>
            <SheetFooter>
              <Button variant="outline" onClick={() => setEditingTraining(null)}>Cancelar</Button>
              <Button onClick={handleEdit} disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Delete AlertDialog */}
        <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar sesión</AlertDialogTitle>
              <AlertDialogDescription>¿Estás seguro de que deseas eliminar esta sesión de entrenamiento? Esta acción no se puede deshacer.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Eliminando..." : "Eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Templates Sheet */}
        <Sheet open={showTemplatesSheet} onOpenChange={setShowTemplatesSheet}>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Plantillas de entrenamiento</SheetTitle>
              <SheetDescription>Define sesiones recurrentes que se repiten cada semana</SheetDescription>
            </SheetHeader>
            <div className="py-4 space-y-3">
              {templates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Repeat className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No hay plantillas activas</p>
                  <p className="text-xs">Crea una plantilla para automatizar sesiones semanales</p>
                </div>
              ) : (
                templates.map(t => (
                  <div key={t.id} className="flex items-start justify-between rounded-lg border p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{DAY_LABELS[t.dayOfWeek]} · {t.startTime}{t.endTime ? ` - ${t.endTime}` : ""}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t.team.name}</p>
                      <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                        {t.court && <span>{t.court}</span>}
                        {t.coach && <span>{t.coach.user.name} {t.coach.user.surname}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0 ml-2">
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Aplicar a periodo" onClick={() => { setShowTemplatesSheet(false); setPreselectedTemplateId(t.id); setShowApplyTemplateModal(true); }}>
                        <CalendarRange className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditTemplate(t)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTemplateId(t.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <SheetFooter>
              <div className="space-y-2 w-full">
                {templates.length > 0 && (
                  <Button variant="outline" className="w-full" onClick={() => { setShowTemplatesSheet(false); setPreselectedTemplateId(null); setShowApplyTemplateModal(true); }}>
                    <CalendarRange className="mr-2 h-4 w-4" />Aplicar plantillas a periodo
                  </Button>
                )}
                <Button onClick={openNewTemplate} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />Nueva plantilla
                </Button>
              </div>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* New/Edit Template Dialog */}
        <Sheet open={showNewTemplate} onOpenChange={(open) => { if (!open) { setShowNewTemplate(false); setEditingTemplate(null); } }}>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{editingTemplate ? "Editar plantilla" : "Nueva plantilla"}</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Día de la semana</label>
                <Select value={String(templateForm.dayOfWeek)} onValueChange={v => setTemplateForm({ ...templateForm, dayOfWeek: parseInt(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAY_LABELS.map((label, idx) => (
                      <SelectItem key={idx} value={String(idx)}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Hora inicio</label>
                  <Input type="time" value={templateForm.startTime} onChange={e => setTemplateForm({ ...templateForm, startTime: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Hora fin</label>
                  <Input type="time" value={templateForm.endTime} onChange={e => setTemplateForm({ ...templateForm, endTime: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Equipo</label>
                <Select value={templateForm.teamId} onValueChange={v => setTemplateForm({ ...templateForm, teamId: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar equipo" /></SelectTrigger>
                  <SelectContent>
                    {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Pista</label>
                <Select value={templateForm.court} onValueChange={v => setTemplateForm({ ...templateForm, court: v === "__none__" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar pista" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin pista</SelectItem>
                    {courtOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Entrenador</label>
                <Select value={templateForm.coachId} onValueChange={v => setTemplateForm({ ...templateForm, coachId: v === "__none__" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar entrenador" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin entrenador</SelectItem>
                    {coaches.map(c => <SelectItem key={c.id} value={c.id}>{c.user.name} {c.user.surname}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <SheetFooter>
              <Button variant="outline" onClick={() => { setShowNewTemplate(false); setEditingTemplate(null); }}>Cancelar</Button>
              <Button onClick={handleSaveTemplate} disabled={savingTemplate || !templateForm.teamId}>
                {savingTemplate ? "Guardando..." : (editingTemplate ? "Guardar cambios" : "Crear plantilla")}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Delete Template AlertDialog */}
        <AlertDialog open={!!deleteTemplateId} onOpenChange={(open) => { if (!open) setDeleteTemplateId(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar plantilla</AlertDialogTitle>
              <AlertDialogDescription>¿Estás seguro de que deseas eliminar esta plantilla? Las sesiones ya creadas no se verán afectadas.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDeleteTemplate}>Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Apply Templates AlertDialog (legacy weekly) */}
        <AlertDialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Aplicar plantillas</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Aplicar las plantillas a la semana del {formatWeekRange(weekBase)}? Se crearán {templates.length} sesiones basadas en tus plantillas activas. Las sesiones que ya existan ese día y hora no se duplicarán.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleApplyTemplatesLegacy} disabled={applyingTemplates}>
                {applyingTemplates ? "Aplicando..." : "Aplicar plantillas"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Apply Template Modal (multi-step) */}
        <ApplyTemplateModal
          open={showApplyTemplateModal}
          onOpenChange={setShowApplyTemplateModal}
          templates={templates}
          clubId={selectedClub.id}
          onSuccess={() => { fetchTrainings(); fetchTemplates(); }}
          preselectedTemplateId={preselectedTemplateId}
        />

        {/* Weekly Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setWeekBase(subWeeks(weekBase, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[180px] text-center">{formatWeekRange(weekBase)}</span>
            <Button variant="outline" size="icon" onClick={() => setWeekBase(addWeeks(weekBase, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {templates.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setShowApplyDialog(true)}>
                <Loader2 className="mr-1 h-4 w-4" /> Aplicar (semana)
              </Button>
            )}
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarDays className="mr-1 h-4 w-4" /> Hoy
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={weekBase}
                  onSelect={(date) => {
                    if (date) {
                      setWeekBase(date);
                      setCalendarOpen(false);
                    }
                  }}
                  autoFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Grid */}
        {error && <div className="text-sm text-destructive bg-destructive/5 p-3 rounded-md">{error}</div>}

        {loading ? (
          <div className="grid grid-cols-7 gap-3">
            {weekDays.map((d, i) => (
              <div key={i} className="space-y-3">
                <div className="h-14 bg-muted rounded-lg animate-pulse" />
                <div className="h-24 bg-muted rounded-lg animate-pulse" />
                <div className="h-24 bg-muted rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-3">
            {weekDays.map((day, idx) => {
              const dayKey = format(day, "yyyy-MM-dd");
              const dayTrainings = trainingsByDay[dayKey] || [];
              const today = isToday(day);
              return (
                <div key={idx} className="min-h-[200px]">
                  <div className="text-center mb-3">
                    <p className="text-xs text-muted-foreground">{DAYS_SHORT[idx]}</p>
                    <div className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium ${today ? "bg-primary text-primary-foreground" : ""}`}>
                      {day.getDate()}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {dayTrainings.map(t => <TrainingCard key={t.id} training={t} />)}
                    {dayTrainings.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                        <Dumbbell className="h-5 w-5 mb-1 opacity-30" />
                        <p className="text-xs">Sin sesiones</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}