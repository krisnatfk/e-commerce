import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// POST: Confirm payment for an order (called from frontend after Midtrans onSuccess)
export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        if (!userId) {
            return NextResponse.json({ error: "not authorized" }, { status: 401 });
        }

        const { orderIds } = await request.json();

        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return NextResponse.json({ error: "missing orderIds" }, { status: 400 });
        }

        // Update all provided orders that belong to this user
        const result = await prisma.order.updateMany({
            where: {
                id: { in: orderIds },
                userId: userId,
                paymentMethod: "MIDTRANS",
                isPaid: false,
            },
            data: {
                isPaid: true,
            },
        });

        return NextResponse.json({
            message: `${result.count} pesanan berhasil dikonfirmasi`,
            count: result.count,
        });
    } catch (error) {
        console.error("Confirm payment error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
