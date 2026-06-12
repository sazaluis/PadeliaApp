import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              PI
            </div>
            <span className="text-xl font-bold text-primary">PadelIA</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/auth/register"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-1 items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 inline-flex items-center rounded-full border bg-background px-4 py-1.5 text-sm font-medium">
              🏆 Plataforma de gestión de pádel
            </div>
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-foreground md:text-6xl">
              Gestiona tu club de pádel
              <span className="text-primary"> como nunca</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Organiza equipos, entrenamientos, convocatorias y competiciones
              desde una sola plataforma. Diseñada para clubs, capitanes,
              entrenadores y jugadores.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/auth/register"
                className="rounded-lg bg-primary px-8 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Comenzar gratis
              </Link>
              <Link
                href="#features"
                className="rounded-lg border px-8 py-3 text-base font-medium text-foreground hover:bg-muted transition-colors"
              >
                Ver funcionalidades
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">
            Todo lo que necesitas para gestionar tu club
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon="👥"
              title="Gestión de Equipos"
              description="Crea y administra equipos masculinos, femeninos y mixtos con sus capitanes y entrenadores."
            />
            <FeatureCard
              icon="📅"
              title="Entrenamientos"
              description="Planifica entrenamientos, gestiona asistencias y registra evaluaciones de rendimiento."
            />
            <FeatureCard
              icon="📋"
              title="Convocatorias"
              description="Gestiona convocatorias para partidos de fin de semana con confirmación de asistencia."
            />
            <FeatureCard
              icon="🏆"
              title="Liga y Competiciones"
              description="Organiza temporadas, genera calendarios y registra resultados automáticamente."
            />
            <FeatureCard
              icon="📊"
              title="Clasificaciones"
              description="Clasificaciones automáticas con victorias, derrotas, sets y puntos."
            />
            <FeatureCard
              icon="📈"
              title="Dashboard Inteligente"
              description="Vista general personalizada según tu rol con estadísticas y próximos eventos."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 PadelIA. Plataforma SaaS de gestión de pádel.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 text-4xl">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}