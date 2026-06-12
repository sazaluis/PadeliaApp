import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "PadelIA - Gestión de Equipos de Pádel",
  description:
    "Plataforma SaaS para la gestión de equipos de pádel, entrenamientos y competiciones",
  keywords: [
    "pádel",
    "gestión",
    "equipos",
    "ligas",
    "entrenamientos",
    "competiciones",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}