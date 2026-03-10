import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import authSeller from "@/middlewares/authSeller";
import { NextResponse } from "next/server";

// POST: Seller adds/updates tracking number (resi) for an order
export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        const storeId = await authSeller(userId);
        if (!storeId) {
            return NextResponse.json({ error: "not authorized" }, { status: 401 });
        }

        const { orderId, trackingNumber } = await request.json();

        if (!orderId || !trackingNumber) {
            return NextResponse.json({ error: "missing orderId or trackingNumber" }, { status: 400 });
        }

        // Verify the order belongs to this store
        const order = await prisma.order.findFirst({
            where: { id: orderId, storeId },
        });

        if (!order) {
            return NextResponse.json({ error: "order not found" }, { status: 404 });
        }

        // Update tracking number and auto-set status to SHIPPED
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                trackingNumber: trackingNumber.trim(),
                status: "SHIPPED",
            },
        });

        return NextResponse.json({
            message: "Resi berhasil ditambahkan",
            order: updatedOrder,
        });
    } catch (error) {
        console.error("Tracking update error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
