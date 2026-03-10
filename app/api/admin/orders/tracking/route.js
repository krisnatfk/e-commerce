import prisma from "@/lib/prisma";
import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// POST — add tracking number to order
export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) return NextResponse.json({ error: "not authorized" }, { status: 401 });

        const { orderId, trackingNumber } = await request.json();

        if (!orderId || !trackingNumber) {
            return NextResponse.json({ error: "orderId dan trackingNumber wajib diisi" }, { status: 400 });
        }

        await prisma.order.update({
            where: { id: orderId },
            data: { trackingNumber, status: "SHIPPED" }
        });

        return NextResponse.json({ message: "Resi berhasil ditambahkan, status → Dikirim" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
    }
}
