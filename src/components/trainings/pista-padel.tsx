"use client";

import { useState } from "react";

interface JugadorEnPista {
  jugadorId: string;
  nombre: string;
  esInvitado: boolean;
  equipoOrigenNombre?: string | null;
}

interface PistaPadelProps {
  numero: number;
  jugadores: JugadorEnPista[];
  onQuitarJugador?: (jugadorId: string) => void;
  onDropJugador?: (jugadorId: string) => void;
  capacidadMaxima?: number;
}

// 4 posiciones en las zonas de defensa (entre línea de saque y fondo de cristal)
// Zona defensa izquierda: x=10→x=130, separada por línea central y=130
// Zona defensa derecha:   x=370→x=490, separada por línea central y=130
// cx = punto medio horizontal de cada zona de defensa
// cy = punto medio vertical de cada mitad (superior/inferior)
const POSICIONES = [
  { cx: 70,  cy: 70 },   // defensa izq, mitad superior — Jugador 1
  { cx: 70,  cy: 190 },  // defensa izq, mitad inferior — Jugador 2
  { cx: 430, cy: 70 },   // defensa der, mitad superior — Jugador 3
  { cx: 430, cy: 190 },  // defensa der, mitad inferior — Jugador 4
];

function splitNombre(nombre: string): { name: string; surname: string } {
  const idx = nombre.indexOf(" ");
  if (idx === -1) return { name: nombre, surname: "" };
  return {
    name: nombre.slice(0, idx),
    surname: nombre.slice(idx + 1),
  };
}

export function PistaPadel({
  numero,
  jugadores,
  onQuitarJugador,
  onDropJugador,
  capacidadMaxima = 4,
}: PistaPadelProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const jugadorId = e.dataTransfer.getData("jugadorId");
    if (!jugadorId || !onDropJugador) return;
    if (jugadores.length >= capacidadMaxima) return;
    onDropJugador(jugadorId);
  };

  // Mapa de jugadores asignados por índice de posición (0-3)
  const jugadoresMap = new Map<string, JugadorEnPista>();
  jugadores.slice(0, 4).forEach((j, idx) => {
    jugadoresMap.set(String(idx), j);
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">Pista {numero}</span>
        <span className="text-[10px] text-muted-foreground">{jugadores.length}/{capacidadMaxima}</span>
      </div>

      <div
        className="relative w-full rounded-md border border-green-700 overflow-hidden"
        style={{ backgroundColor: "#2D7D46", cursor: onDropJugador ? "default" : undefined }}
        onDragOver={onDropJugador ? handleDragOver : undefined}
        onDragLeave={onDropJugador ? handleDragLeave : undefined}
        onDrop={onDropJugador ? handleDrop : undefined}
      >
        <svg
          viewBox="0 0 500 260"
          className="w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
          style={{ pointerEvents: "none" }}
        >
          {/* Zona de drop (solo visible cuando isDragOver) */}
          {isDragOver && (
            <rect
              x="10" y="10" width="480" height="240"
              fill="rgba(134,239,172,0.3)"
              stroke="#86efac"
              strokeWidth="2"
              strokeDasharray="6,3"
              rx="2"
            />
          )}

          {/* Rectángulo exterior completo */}
          <rect
            x="10" y="10" width="480" height="240"
            fill="none"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="2.5"
            rx="2"
          />

          {/* Línea vertical central (RED) */}
          <line
            x1="250" y1="10" x2="250" y2="250"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="3"
          />

          {/* Línea vertical izquierda de saque */}
          <line
            x1="130" y1="10" x2="130" y2="250"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="1.5"
          />

          {/* Línea vertical derecha de saque */}
          <line
            x1="370" y1="10" x2="370" y2="250"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="1.5"
          />

          {/* Línea horizontal central izquierda */}
          <line
            x1="130" y1="130" x2="250" y2="130"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="1.5"
          />

          {/* Línea horizontal central derecha */}
          <line
            x1="250" y1="130" x2="370" y2="130"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="1.5"
          />

          {/* Placeholder o jugador en cada una de las 4 posiciones */}
          {POSICIONES.map((pos, idx) => {
            const jugador = jugadoresMap.get(String(idx));

            if (jugador) {
              const { name, surname } = splitNombre(jugador.nombre);
              return (
                <foreignObject
                  key={`fo-${jugador.jugadorId}`}
                  x={pos.cx - 55}
                  y={pos.cy - 15}
                  width="110"
                  height="30"
                  style={{ pointerEvents: "all" }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "110px",
                      height: "30px",
                      backgroundColor: "rgba(255,255,255,0.15)",
                      border: "1px solid rgba(255,255,255,0.4)",
                      borderRadius: "9999px",
                      padding: "2px 6px",
                      boxSizing: "border-box",
                      color: "white",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                      lineHeight: "1.2",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "100%",
                      }}
                    >
                      {name}
                    </span>
                    <span
                      style={{
                        fontSize: "8px",
                        fontWeight: 400,
                        opacity: 0.85,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "100%",
                      }}
                    >
                      {surname}
                    </span>
                    {jugador.esInvitado && (
                      <span
                        style={{
                          position: "absolute",
                          top: "-4px",
                          right: "-4px",
                          backgroundColor: "#6366f1",
                          color: "white",
                          borderRadius: "3px",
                          padding: "0 4px",
                          fontSize: "7px",
                          fontWeight: 700,
                          lineHeight: "14px",
                        }}
                      >
                        I
                      </span>
                    )}
                    {onQuitarJugador && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuitarJugador(jugador.jugadorId);
                        }}
                        style={{
                          position: "absolute",
                          top: "-4px",
                          left: "-4px",
                          backgroundColor: "rgba(0,0,0,0.4)",
                          borderRadius: "9999px",
                          width: "14px",
                          height: "14px",
                          lineHeight: "14px",
                          fontSize: "10px",
                          border: "none",
                          color: "white",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        className="hover:bg-black/60 transition-colors"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </foreignObject>
              );
            }

            // Placeholder para posición vacía (borde discontinuo + texto)
            return (
              <g key={`ph-${idx}`}>
                <rect
                  x={pos.cx - 50}
                  y={pos.cy - 14}
                  width={100}
                  height={28}
                  rx={14}
                  fill="rgba(255,255,255,0.05)"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth={1.5}
                  strokeDasharray="5,3"
                />
                <text
                  x={pos.cx}
                  y={pos.cy + 4}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.35)"
                  fontSize={10}
                  fontStyle="italic"
                >
                  Arrastra aquí
                </text>
              </g>
            );
          })}

          {/* Texto general cuando no hay ningún jugador (extra) */}
          {jugadores.length === 0 && (
            <text
              x="250" y="85"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(255,255,255,0.4)"
              fontSize="11"
              fontStyle="italic"
            >
              Sin jugadores asignados
            </text>
          )}
        </svg>
      </div>
    </div>
  );
}