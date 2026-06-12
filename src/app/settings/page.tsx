"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Bell, Shield, Palette } from "lucide-react";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
          <p className="text-muted-foreground">Administra tu cuenta y preferencias</p>
        </div>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Perfil
            </CardTitle>
            <CardDescription>Información personal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre</label>
                <Input placeholder="Tu nombre" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Apellidos</label>
                <Input placeholder="Tus apellidos" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" placeholder="tu@email.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Teléfono</label>
                <Input type="tel" placeholder="+34 600 000 000" />
              </div>
            </div>
            <Button>Guardar Cambios</Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notificaciones
            </CardTitle>
            <CardDescription>Configura tus preferencias de notificación</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Entrenamientos", description: "Recibir alertas de entrenamientos programados" },
              { label: "Convocatorias", description: "Notificación de nuevas convocatorias" },
              { label: "Resultados", description: "Resultado de partidos jugados" },
              { label: "Clasificación", description: "Cambios en la clasificación" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" className="peer sr-only" defaultChecked />
                  <div className="h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white" />
                </label>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Seguridad
            </CardTitle>
            <CardDescription>Gestiona tu contraseña y seguridad</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Contraseña actual</label>
                <Input type="password" placeholder="••••••" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nueva contraseña</label>
                <Input type="password" placeholder="••••••" />
              </div>
            </div>
            <Button variant="outline">Cambiar Contraseña</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}