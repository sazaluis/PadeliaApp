"use client";

import { useSession } from "next-auth/react";
import { Bell, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Header() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      GLOBAL_ADMIN: "Administrador Global",
      CLUB_MANAGER: "Responsable de Club",
      TEAM_CAPTAIN: "Capitán de Equipo",
      COACH: "Entrenador",
      PLAYER: "Jugador",
    };
    return labels[role] || role;
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white dark:bg-gray-950 px-6">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar equipos, jugadores, partidos..."
            className="w-full rounded-lg border bg-muted/50 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Role Badge */}
        <Badge variant="secondary">{getRoleLabel(userRole)}</Badge>

        {/* Notifications */}
        <button className="relative rounded-md p-2 hover:bg-muted">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
            3
          </span>
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium text-sm">
            {session?.user?.name?.charAt(0) || "U"}
          </div>
        </div>
      </div>
    </header>
  );
}