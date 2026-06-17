"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Calendar, Clock, MapPin, Swords, Link2, Camera, Trash2, Save, Edit } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface MatchDetail {
  id: string;
  matchDate: string;
  matchTime?: string;
  court?: string;
  status: string;
  notes?: string;
  observations?: string;
  photos?: string;
  homeTeam: { id: string; name: string; category: string; clubId: string };
  awayTeam: { id: string; name: string; category: string; clubId: string };
  matchday?: { id: string; number: number; name?: string; league?: { name: string } };
  result?: {
    set1Local?: number;
    set1Visitor?: number;
    set2Local?: number;
    set2Visitor?: number;
    set3Local?: number;
    set3Visitor?: number;
    localSets?: number;
    visitorSets?: number;
    totalSetsHome: number;
    totalSetsAway: number;
    pair1SetsHome: number;
    pair1SetsAway: number;
    pair2SetsHome: number;
    pair2SetsAway: number;
    pair3SetsHome: number;
    pair3SetsAway: number;
  };
  convocation?: {
    id: string;
    status: string;
    players: Array<{
      player: { user: { name?: string; surname?: string } };
      status: string;
    }>;
  };
}

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;

  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingObservations, setSavingObservations] = useState(false);

  // Result dialog
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [resultForm, setResultForm] = useState({
    set1Local: 0, set1Visitor: 0,
    set2Local: 0, set2Visitor: 0,
    set3Local: 0, set3Visitor: 0,
    hasThirdSet: false,
  });

  // Observations
  const [observations, setObservations] = useState("");
  const observationsRef = useRef<HTMLTextAreaElement>(null);

  // Photos
  const [uploading, setUploading] = useState(false);
  const [deletePhoto, setDeletePhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMatch();
  }, [matchId]);

  const fetchMatch = async () => {
    try {
      const res = await fetch(`/api/matches/${matchId}`);
      if (res.ok) {
        const data = await res.json();
        setMatch(data);
        setObservations(data.observations || "");
      } else {
        toast.error("Partido no encontrado");
        router.push("/matches");
      }
    } catch {
      toast.error("Error al cargar el partido");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d: string) =>
    new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(new Date(d));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED": return <Badge variant="success">Jugado</Badge>;
      case "SCHEDULED": return <Badge variant="outline">Programado</Badge>;
      case "IN_PROGRESS": return <Badge>En curso</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Guardar resultado
  const handleSaveResult = async () => {
    try {
      const body: any = {
        set1Local: resultForm.set1Local,
        set1Visitor: resultForm.set1Visitor,
        set2Local: resultForm.set2Local,
        set2Visitor: resultForm.set2Visitor,
      };
      if (resultForm.hasThirdSet) {
        body.set3Local = resultForm.set3Local;
        body.set3Visitor = resultForm.set3Visitor;
      }

      const res = await fetch(`/api/matches/${matchId}/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success("Resultado guardado correctamente");
        setShowResultDialog(false);
        fetchMatch();
      } else {
        const err = await res.json();
        toast.error(err.error || "Error al guardar resultado");
      }
    } catch {
      toast.error("Error al guardar resultado");
    }
  };

  // Guardar observaciones
  const handleSaveObservations = async () => {
    setSavingObservations(true);
    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ observations }),
      });
      if (res.ok) {
        toast.success("Observaciones guardadas");
      } else {
        toast.error("Error al guardar observaciones");
      }
    } catch {
      toast.error("Error al guardar observaciones");
    } finally {
      setSavingObservations(false);
    }
  };

  // Subir fotos
  const handleUploadPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("photos", files[i]);
      }

      const res = await fetch(`/api/matches/${matchId}/photos`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast.success(`${files.length} foto(s) subida(s)`);
        fetchMatch();
      } else {
        const err = await res.json();
        toast.error(err.error || "Error al subir fotos");
      }
    } catch {
      toast.error("Error al subir fotos");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Eliminar foto
  const handleDeletePhoto = async () => {
    if (!deletePhoto) return;
    try {
      const filename = deletePhoto.split("/").pop();
      const res = await fetch(`/api/matches/${matchId}/photos`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
      if (res.ok) {
        toast.success("Foto eliminada");
        fetchMatch();
      } else {
        toast.error("Error al eliminar foto");
      }
    } catch {
      toast.error("Error al eliminar foto");
    } finally {
      setDeletePhoto(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  if (!match) return null;

  const photos: string[] = match.photos ? JSON.parse(match.photos) : [];
  const isCompleted = match.status === "COMPLETED";
  const hasResult = !!match.result;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Cabecera */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/matches")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">Detalle del Partido</h1>
              {getStatusBadge(match.status)}
            </div>
          </div>
        </div>

        {/* Info del partido */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Calendar className="h-4 w-4" />
                  <span>Jornada {match.matchday?.number}</span>
                  {match.matchday?.league && <><span>·</span><span>{match.matchday.league.name}</span></>}
                  <span>·</span>
                  <span>{formatDate(match.matchDate)}</span>
                  {match.matchTime && <><span>·</span><span className="flex items-center gap-1"><Clock className="h-3 w-3" />{match.matchTime}</span></>}
                  {match.court && <><span>·</span><span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{match.court}</span></>}
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-xl">{match.homeTeam.name}</span>
                  <Swords className="h-6 w-6 text-muted-foreground" />
                  <span className="font-bold text-xl">{match.awayTeam.name}</span>
                </div>
              </div>

              {match.convocation && (
                <Button variant="outline" size="sm" onClick={() => router.push(`/convocations`)}>
                  <Link2 className="h-4 w-4 mr-2" />
                  Ver convocatoria
                </Button>
              )}
            </div>

            {/* Resultado */}
            {isCompleted && hasResult && match.result && (
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">
                      {match.result.localSets ?? match.result.totalSetsHome} - {match.result.visitorSets ?? match.result.totalSetsAway}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Sets</div>
                  </div>
                  <div className="flex-1 space-y-1">
                    {match.result.set1Local !== undefined && match.result.set1Visitor !== undefined ? (
                      <>
                        <div className="text-sm">Set 1: <span className="font-medium">{match.result.set1Local} - {match.result.set1Visitor}</span></div>
                        <div className="text-sm">Set 2: <span className="font-medium">{match.result.set2Local} - {match.result.set2Visitor}</span></div>
                        {match.result.set3Local !== undefined && match.result.set3Visitor !== undefined && match.result.set3Local !== null && (
                          <div className="text-sm">Set 3: <span className="font-medium">{match.result.set3Local} - {match.result.set3Visitor}</span></div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="text-sm">Pareja 1: <span className="font-medium">{match.result.pair1SetsHome} - {match.result.pair1SetsAway}</span></div>
                        <div className="text-sm">Pareja 2: <span className="font-medium">{match.result.pair2SetsHome} - {match.result.pair2SetsAway}</span></div>
                        <div className="text-sm">Pareja 3: <span className="font-medium">{match.result.pair3SetsHome} - {match.result.pair3SetsAway}</span></div>
                      </>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => {
                    if (match.result?.set1Local !== undefined) {
                      setResultForm({
                        set1Local: match.result.set1Local || 0,
                        set1Visitor: match.result.set1Visitor || 0,
                        set2Local: match.result.set2Local || 0,
                        set2Visitor: match.result.set2Visitor || 0,
                        set3Local: match.result.set3Local || 0,
                        set3Visitor: match.result.set3Visitor || 0,
                        hasThirdSet: match.result.set3Local !== null && match.result.set3Local !== undefined,
                      });
                    }
                    setShowResultDialog(true);
                  }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar resultado
                  </Button>
                </div>
              </div>
            )}

            {!isCompleted && (
              <div className="mt-6 pt-4 border-t">
                <Button onClick={() => setShowResultDialog(true)}>
                  Registrar resultado
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Observaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Observaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              ref={observationsRef}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Incidencias, notas del árbitro, comentarios generales..."
              rows={4}
            />
            <div className="flex justify-end mt-3">
              <Button variant="outline" size="sm" onClick={handleSaveObservations} disabled={savingObservations}>
                <Save className="h-4 w-4 mr-2" />
                {savingObservations ? "Guardando..." : "Guardar observaciones"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Fotos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Fotos del partido</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{photos.length}/10</span>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading || photos.length >= 10}>
                  <Camera className="h-4 w-4 mr-2" />
                  {uploading ? "Subiendo..." : "Añadir fotos"}
                </Button>
                <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUploadPhotos} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {photos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No hay fotos subidas</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {photos.map((photo, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-md overflow-hidden border">
                    <Image src={photo} alt={`Foto ${idx + 1}`} fill className="object-cover" />
                    <button
                      onClick={() => setDeletePhoto(photo)}
                      className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de resultado */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{hasResult ? "Editar resultado" : "Registrar resultado"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center text-sm font-medium text-muted-foreground">
              <div></div>
              <div>{match.homeTeam.name}</div>
              <div>{match.awayTeam.name}</div>
            </div>

            {[1, 2].map((setNum) => (
              <div key={setNum} className="grid grid-cols-3 gap-4 items-center">
                <div className="text-sm font-medium">Set {setNum}</div>
                <Input
                  type="number"
                  min={0}
                  max={7}
                  value={setNum === 1 ? resultForm.set1Local : resultForm.set2Local}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    if (setNum === 1) setResultForm({ ...resultForm, set1Local: val });
                    else setResultForm({ ...resultForm, set2Local: val });
                  }}
                />
                <Input
                  type="number"
                  min={0}
                  max={7}
                  value={setNum === 1 ? resultForm.set1Visitor : resultForm.set2Visitor}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    if (setNum === 1) setResultForm({ ...resultForm, set1Visitor: val });
                    else setResultForm({ ...resultForm, set2Visitor: val });
                  }}
                />
              </div>
            ))}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hasThirdSet"
                checked={resultForm.hasThirdSet}
                onChange={(e) => setResultForm({ ...resultForm, hasThirdSet: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="hasThirdSet" className="text-sm">Set 3 (opcional)</label>
            </div>

            {resultForm.hasThirdSet && (
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="text-sm font-medium">Set 3</div>
                <Input
                  type="number"
                  min={0}
                  max={7}
                  value={resultForm.set3Local}
                  onChange={(e) => setResultForm({ ...resultForm, set3Local: parseInt(e.target.value) || 0 })}
                />
                <Input
                  type="number"
                  min={0}
                  max={7}
                  value={resultForm.set3Visitor}
                  onChange={(e) => setResultForm({ ...resultForm, set3Visitor: parseInt(e.target.value) || 0 })}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowResultDialog(false)}>Cancelar</Button>
              <Button onClick={handleSaveResult}>Guardar resultado</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog eliminar foto */}
      <AlertDialog open={!!deletePhoto} onOpenChange={() => setDeletePhoto(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar foto</AlertDialogTitle>
            <AlertDialogDescription>¿Estás seguro de que deseas eliminar esta foto? Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePhoto} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}