"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Check, Loader2, Calendar, ChevronRight, ChevronLeft, Repeat } from "lucide-react";

interface TrainingTemplate {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  court: string | null;
  team: { id: string; name: string; category: string };
  coach: { id: string; user: { name: string; surname: string } } | null;
}

interface ApplyTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: TrainingTemplate[];
  clubId: string;
  onSuccess: () => void;
  preselectedTemplateId?: string | null;
}

const DAY_LABELS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const QUARTER_LABELS = ["Q1 (Ene-Mar)", "Q2 (Abr-Jun)", "Q3 (Jul-Sep)", "Q4 (Oct-Dic)"];

function formatDateRange(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  return `${start.toLocaleDateString("es-ES", opts)} – ${end.toLocaleDateString("es-ES", opts)}`;
}

function calculateSessionCount(template: TrainingTemplate, startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  while (current <= endDate) {
    const isoDay = current.getDay() === 0 ? 6 : current.getDay() - 1;
    if (isoDay === template.dayOfWeek) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

function getDateRange(mode: string, year: number, month?: number, quarter?: number): { start: Date; end: Date } | null {
  if (mode === "monthly" && month !== undefined) {
    return { start: new Date(year, month - 1, 1), end: new Date(year, month, 0) };
  }
  if (mode === "quarterly" && quarter !== undefined) {
    const startMonth = (quarter - 1) * 3;
    return { start: new Date(year, startMonth, 1), end: new Date(year, startMonth + 3, 0) };
  }
  if (mode === "annual") {
    return { start: new Date(year, 0, 1), end: new Date(year, 11, 31) };
  }
  return null;
}

export function ApplyTemplateModal({
  open,
  onOpenChange,
  templates,
  clubId,
  onSuccess,
  preselectedTemplateId,
}: ApplyTemplateModalProps) {
  const [step, setStep] = useState(1);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [mode, setMode] = useState<"monthly" | "quarterly" | "annual">("monthly");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedQuarter, setSelectedQuarter] = useState<number>(Math.floor(new Date().getMonth() / 3) + 1);
  const [onConflict, setOnConflict] = useState<"skip" | "replace">("skip");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setStep(1);
      setSelectedTemplateId(preselectedTemplateId || "");
      setMode("monthly");
      setSelectedYear(new Date().getFullYear());
      setSelectedMonth(new Date().getMonth() + 1);
      setSelectedQuarter(Math.floor(new Date().getMonth() / 3) + 1);
      setOnConflict("skip");
      setLoading(false);
      setResult(null);
      setError("");
    }
  }, [open, preselectedTemplateId]);

  useEffect(() => {
    if (open && preselectedTemplateId) setStep(2);
  }, [open, preselectedTemplateId]);

  const selectedTemplate = useMemo(() => templates.find((t) => t.id === selectedTemplateId), [templates, selectedTemplateId]);
  const dateRange = useMemo(() => getDateRange(mode, selectedYear, selectedMonth, selectedQuarter), [mode, selectedYear, selectedMonth, selectedQuarter]);
  const sessionCount = useMemo(() => {
    if (!selectedTemplate || !dateRange) return 0;
    return calculateSessionCount(selectedTemplate, dateRange.start, dateRange.end);
  }, [selectedTemplate, dateRange]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const hasPastDates = dateRange ? dateRange.start < today : false;
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const handleConfirm = async () => {
    if (!selectedTemplateId || !dateRange) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/trainings/apply-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplateId,
          mode,
          year: selectedYear,
          month: mode === "monthly" ? selectedMonth : undefined,
          quarter: mode === "quarterly" ? selectedQuarter : undefined,
          onConflict,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error al aplicar la plantilla"); setLoading(false); return; }
      setResult({ created: data.created, skipped: data.skipped });
      setLoading(false);
    } catch { setError("Error de conexión"); setLoading(false); }
  };

  const handleClose = () => { if (result) onSuccess(); onOpenChange(false); };

  const renderStep1 = () => (
    <div className="space-y-4">
      <DialogDescription>Selecciona la plantilla de entrenamiento que deseas aplicar a un periodo completo.</DialogDescription>
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {templates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground"><Repeat className="h-8 w-8 mx-auto mb-2 opacity-30" /><p className="text-sm">No hay plantillas activas</p></div>
        ) : templates.map((t) => (
          <button key={t.id} className={`w-full text-left rounded-lg border p-3 transition-all ${selectedTemplateId === t.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"}`} onClick={() => setSelectedTemplateId(t.id)}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{DAY_LABELS[t.dayOfWeek]} · {t.startTime} - {t.endTime}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.team.name}</p>
                <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                  {t.court && <span>{t.court}</span>}
                  {t.coach && <span>{t.coach.user.name} {t.coach.user.surname}</span>}
                </div>
              </div>
              {selectedTemplateId === t.id && <Check className="h-4 w-4 text-primary shrink-0 mt-1" />}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <DialogDescription>
        Elige el periodo para la plantilla <strong>{DAY_LABELS[selectedTemplate!.dayOfWeek]} {selectedTemplate!.startTime}</strong> del equipo <strong>{selectedTemplate!.team.name}</strong>.
      </DialogDescription>
      <div>
        <label className="text-sm font-medium mb-2 block">Tipo de periodo</label>
        <div className="grid grid-cols-3 gap-2">
          {[{ value: "monthly", label: "Mensual", icon: "📅" }, { value: "quarterly", label: "Trimestral", icon: "📆" }, { value: "annual", label: "Anual", icon: "🗓️" }].map((opt) => (
            <button key={opt.value} className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-sm transition-all ${mode === opt.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"}`} onClick={() => setMode(opt.value as any)}>
              <span className="text-lg">{opt.icon}</span><span className="font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Año</label>
        <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{yearOptions.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {mode === "monthly" && (
        <div>
          <label className="text-sm font-medium mb-2 block">Mes</label>
          <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{MONTH_NAMES.map((name, idx) => <SelectItem key={idx + 1} value={String(idx + 1)}>{name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
      {mode === "quarterly" && (
        <div>
          <label className="text-sm font-medium mb-2 block">Trimestre</label>
          <Select value={String(selectedQuarter)} onValueChange={(v) => setSelectedQuarter(parseInt(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{QUARTER_LABELS.map((label, idx) => <SelectItem key={idx + 1} value={String(idx + 1)}>{label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
      {dateRange && (
        <div className="rounded-lg bg-muted/50 p-3 space-y-1">
          <p className="text-sm font-medium"><Calendar className="inline h-4 w-4 mr-1" />{formatDateRange(dateRange.start, dateRange.end)}</p>
          <p className="text-sm text-muted-foreground">Se crearán <strong className="text-foreground">{sessionCount}</strong> sesiones</p>
          {hasPastDates && <p className="text-xs text-amber-600 flex items-center gap-1 mt-1"><AlertTriangle className="h-3 w-3" />El periodo incluye fechas pasadas</p>}
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      {result ? (
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 text-center">
          <Check className="h-10 w-10 text-primary mx-auto mb-2" />
          <p className="text-lg font-semibold">¡Sesiones creadas!</p>
          <div className="flex justify-center gap-4 mt-2 text-sm text-muted-foreground">
            <span>Creadas: <strong className="text-foreground">{result.created}</strong></span>
            {result.skipped > 0 && <span>Omitidas: <strong className="text-foreground">{result.skipped}</strong></span>}
          </div>
        </div>
      ) : (
        <>
          <DialogDescription>Revisa los detalles antes de crear las sesiones.</DialogDescription>
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Plantilla</span><span className="text-sm font-medium">{DAY_LABELS[selectedTemplate!.dayOfWeek]} {selectedTemplate!.startTime}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Equipo</span><span className="text-sm font-medium">{selectedTemplate!.team.name}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Periodo</span><span className="text-sm font-medium">{dateRange && formatDateRange(dateRange.start, dateRange.end)}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Sesiones</span><Badge variant="secondary">{sessionCount}</Badge></div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Si ya existen sesiones en este periodo:</label>
            <div className="flex gap-2">
              <button className={`flex-1 rounded-lg border p-2.5 text-sm transition-all ${onConflict === "skip" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"}`} onClick={() => setOnConflict("skip")}>Omitir existentes</button>
              <button className={`flex-1 rounded-lg border p-2.5 text-sm transition-all ${onConflict === "replace" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"}`} onClick={() => setOnConflict("replace")}>Reemplazar</button>
            </div>
          </div>
          {hasPastDates && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>El periodo incluye fechas anteriores a hoy. Se crearán sesiones igualmente.</span>
            </div>
          )}
        </>
      )}
      {error && <div className="text-sm text-destructive bg-destructive/5 p-3 rounded-md">{error}</div>}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Aplicar plantilla a periodo</DialogTitle>
          <div className="flex items-center gap-2 pt-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium ${step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{step > s ? "✓" : s}</div>
                {s < 3 && <div className={`w-8 h-0.5 ${step > s ? "bg-primary" : "bg-muted"}`} />}
              </div>
            ))}
            <div className="flex gap-4 ml-2 text-xs text-muted-foreground">
              <span className={step === 1 ? "text-foreground font-medium" : ""}>Plantilla</span>
              <span className={step === 2 ? "text-foreground font-medium" : ""}>Periodo</span>
              <span className={step === 3 ? "text-foreground font-medium" : ""}>Confirmar</span>
            </div>
          </div>
        </DialogHeader>
        <div className="py-2">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>
        <DialogFooter>
          {step > 1 && !result && <Button variant="outline" onClick={() => setStep(step - 1)}><ChevronLeft className="h-4 w-4 mr-1" /> Atrás</Button>}
          {step < 3 && <Button onClick={() => setStep(step + 1)} disabled={step === 1 ? !selectedTemplateId : !(dateRange && sessionCount > 0)}>Siguiente <ChevronRight className="h-4 w-4 ml-1" /></Button>}
          {step === 3 && !result && (
            <>
              <Button variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button onClick={handleConfirm} disabled={loading}>{loading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Creando...</> : "Crear sesiones"}</Button>
            </>
          )}
          {result && <Button onClick={handleClose}>Cerrar</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}