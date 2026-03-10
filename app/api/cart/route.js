// /app/api/cart/route.js
import prisma from "@/lib/prisma";
import { ensureUserExists } from "@/lib/ensureUser";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// POST /api/cart  -> simpan cart di kolom user.cart
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }

    // Ensure user exists in DB (auto-sync from Clerk)
    await ensureUserExists(userId);

    const body = await request.json();
    const cart = body?.cart ?? {};

    // Simpan / overwrite cart JSON di user
    await prisma.user.update({
      where: { id: userId },
      data: { cart }
    });

    // Kembalikan cart yang tersimpan untuk sinkronisasi client
    return NextResponse.json({ message: "cart_saved", cart });
  } catch (error) {
    console.error("POST /api/cart error:", error);
    return NextResponse.json({ error: error.message || "server_error" }, { status: 500 });
  }
}

// GET /api/cart  -> ambil cart user, kembalikan { cart: { ... } }
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }

    // Ensure user exists in DB (auto-sync from Clerk)
    await ensureUserExists(userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { cart: true }
    });

    // Pastikan format balikan konsisten: { cart: {...} }
    return NextResponse.json({ cart: user?.cart ?? {} });
  } catch (error) {
    console.error("GET /api/cart error:", error);
    return NextResponse.json({ error: error.message || "server_error" }, { status: 500 });
  }
}
