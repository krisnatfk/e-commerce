import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { OrderStatus, PaymentMethod } from "@prisma/client";

// Auto-cancel unpaid MIDTRANS orders older than 24 hours
// Can be called by a cron job or on each orders page load
export async function GET() {
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const cancelledOrders = await prisma.order.updateMany({
            where: {
                paymentMethod: PaymentMethod.MIDTRANS,
                isPaid: false,
                status: { not: OrderStatus.CANCELLED },
                createdAt: { lt: twentyFourHoursAgo },
            },
            data: {
                status: OrderStatus.CANCELLED,
                cancelledAt: new Date(),
            },
        });

        return NextResponse.json({
            message: `${cancelledOrders.count} pesanan dibatalkan otomatis`,
            count: cancelledOrders.count,
        });
    } catch (error) {
        console.error("Auto-cancel error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
