import prisma from "@/lib/prisma";
import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// POST — toggle product stock
export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) return NextResponse.json({ error: "not authorized" }, { status: 401 });

        const { productId } = await request.json();
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) return NextResponse.json({ error: "product not found" }, { status: 404 });

        await prisma.product.update({
            where: { id: productId },
            data: { inStock: !product.inStock }
        });

        return NextResponse.json({ message: product.inStock ? "Produk dinonaktifkan" : "Produk diaktifkan" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
    }
}
