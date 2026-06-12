import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prismadb from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, surname, email, password, phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nombre, email y contraseña son obligatorios" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prismadb.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Ya existe un usuario con este email" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user with PLAYER role by default
    const user = await prismadb.user.create({
      data: {
        name,
        surname,
        email,
        passwordHash,
        phone: phone || null,
        role: "PLAYER",
      },
    });

    return NextResponse.json(
      {
        message: "Usuario registrado correctamente",
        user: { id: user.id, email: user.email, name: user.name },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}