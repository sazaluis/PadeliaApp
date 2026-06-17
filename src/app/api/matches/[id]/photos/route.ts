import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prismadb from "@/lib/prisma";
import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";

const MAX_PHOTOS = 10;
const ACCEPTED_FORMATS = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || !["GLOBAL_ADMIN", "CLUB_MANAGER"].includes(role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const match = await prismadb.match.findUnique({ where: { id: params.id } });
    if (!match) {
      return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
    }

    // Obtener fotos actuales
    const currentPhotos: string[] = match.photos ? JSON.parse(match.photos) : [];
    if (currentPhotos.length >= MAX_PHOTOS) {
      return NextResponse.json(
        { error: `Máximo de ${MAX_PHOTOS} fotos por partido` },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const files = formData.getAll("photos") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No se enviaron archivos" }, { status: 400 });
    }

    if (currentPhotos.length + files.length > MAX_PHOTOS) {
      return NextResponse.json(
        { error: `Solo puedes añadir ${MAX_PHOTOS - currentPhotos.length} fotos más` },
        { status: 400 }
      );
    }

    // Crear directorio de uploads
    const uploadDir = join(process.cwd(), "public", "uploads", "matches", params.id);
    await mkdir(uploadDir, { recursive: true });

    const newPhotos: string[] = [];

    for (const file of files) {
      // Validar formato
      if (!ACCEPTED_FORMATS.includes(file.type)) {
        return NextResponse.json(
          { error: `Formato no aceptado: ${file.type}. Usa jpg, png o webp` },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generar nombre único
      const ext = file.name.split(".").pop() || "jpg";
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const filepath = join(uploadDir, filename);

      await writeFile(filepath, buffer);
      newPhotos.push(`/uploads/matches/${params.id}/${filename}`);
    }

    // Actualizar campo photos en el partido
    const allPhotos = [...currentPhotos, ...newPhotos];
    await prismadb.match.update({
      where: { id: params.id },
      data: { photos: JSON.stringify(allPhotos) },
    });

    return NextResponse.json({ photos: allPhotos }, { status: 201 });
  } catch (error) {
    console.error("[PHOTOS_POST]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || !["GLOBAL_ADMIN", "CLUB_MANAGER"].includes(role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { filename } = body;

    if (!filename) {
      return NextResponse.json({ error: "Nombre de archivo requerido" }, { status: 400 });
    }

    const match = await prismadb.match.findUnique({ where: { id: params.id } });
    if (!match) {
      return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
    }

    const currentPhotos: string[] = match.photos ? JSON.parse(match.photos) : [];
    const photoToDelete = currentPhotos.find(p => p.includes(filename));

    if (!photoToDelete) {
      return NextResponse.json({ error: "Foto no encontrada" }, { status: 404 });
    }

    // Eliminar archivo físico
    const filepath = join(process.cwd(), "public", photoToDelete);
    try {
      await unlink(filepath);
    } catch {
      // Si el archivo no existe, continuamos igual
    }

    // Actualizar lista de fotos
    const updatedPhotos = currentPhotos.filter(p => p !== photoToDelete);
    await prismadb.match.update({
      where: { id: params.id },
      data: { photos: updatedPhotos.length > 0 ? JSON.stringify(updatedPhotos) : null },
    });

    return NextResponse.json({ photos: updatedPhotos });
  } catch (error) {
    console.error("[PHOTOS_DELETE]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}