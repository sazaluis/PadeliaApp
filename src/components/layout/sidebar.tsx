"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCheck,
  Calendar,
  ClipboardList,
  Trophy,
  GraduationCap,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Swords,
} from "lucide-react";
import { useSidebar } from "./sidebar-context";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Clubes",
    href: "/clubs",
    icon: Building2,
    roles: ["GLOBAL_ADMIN"],
  },
  {
    label: "Equipos",
    href: "/teams",
    icon: Users,
    roles: ["GLOBAL_ADMIN", "CLUB_MANAGER", "TEAM_CAPTAIN", "COACH"],
  },
  {
    label: "Jugadores",
    href: "/players",
    icon: UserCheck,
    roles: ["GLOBAL_ADMIN", "CLUB_MANAGER", "TEAM_CAPTAIN", "COACH"],
  },
  {
    label: "Entrenamientos",
    href: "/trainings",
    icon: GraduationCap,
    roles: ["GLOBAL_ADMIN", "CLUB_MANAGER", "TEAM_CAPTAIN", "COACH", "PLAYER"],
  },
  {
    label: "Convocatorias",
    href: "/convocations",
    icon: ClipboardList,
    roles: ["GLOBAL_ADMIN", "CLUB_MANAGER", "TEAM_CAPTAIN", "COACH", "PLAYER"],
  },
  {
    label: "Liga",
    href: "/league",
    icon: Trophy,
    roles: ["GLOBAL_ADMIN", "CLUB_MANAGER", "TEAM_CAPTAIN", "COACH", "PLAYER"],
  },
  {
    label: "Partidos",
    href: "/matches",
    icon: Swords,
    roles: ["GLOBAL_ADMIN", "CLUB_MANAGER", "TEAM_CAPTAIN", "COACH", "PLAYER"],
  },
  {
    label: "Notificaciones",
    href: "/notifications",
    icon: Bell,
    roles: ["GLOBAL_ADMIN", "CLUB_MANAGER", "TEAM_CAPTAIN", "COACH", "PLAYER"],
  },
  {
    label: "Configuración",
    href: "/settings",
    icon: Settings,
    roles: ["GLOBAL_ADMIN", "CLUB_MANAGER"],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { collapsed, toggle } = useSidebar();

  const userRole = (session?.user as any)?.role;

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  });

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-white dark:bg-gray-950 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              PI
            </div>
            <span className="text-lg font-bold text-primary">PadelIA</span>
          </Link>
        )}
        <button
          onClick={toggle}
          className="rounded-md p-1 hover:bg-muted"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 p-2">
        {filteredNavItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="absolute bottom-0 left-0 right-0 border-t p-4">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
              {session?.user?.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {session?.user?.name || "Usuario"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {userRole?.replace("_", " ")}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="rounded-md p-1 hover:bg-muted"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="flex w-full justify-center rounded-md p-2 hover:bg-muted"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
}