import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import midtransClient from "midtrans-client";

// Midtrans Payment Notification Webhook
export async function POST(request) {
    try {
        const body = await request.json();

        const apiClient = new midtransClient.Snap({
            isProduction: false,
            serverKey: process.env.MIDTRANS_SERVER_KEY,
            clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
        });

        const statusResponse = await apiClient.transaction.notification(body);

        const orderId = statusResponse.order_id;
        const transactionStatus = statusResponse.transaction_status;
        const fraudStatus = statusResponse.fraud_status;

        // Extract our internal order ID from the Midtrans order_id format: TRIMOJOYO-{timestamp}-{orderIdPrefix}
        // We need to find orders that match the timestamp window

        let isPaid = false;

        if (transactionStatus === "capture") {
            if (fraudStatus === "accept") {
                isPaid = true;
            }
        } else if (transactionStatus === "settlement") {
            isPaid = true;
        } else if (
            transactionStatus === "cancel" ||
            transactionStatus === "deny" ||
            transactionStatus === "expire"
        ) {
            isPaid = false;
        } else if (transactionStatus === "pending") {
            isPaid = false;
        }

        if (isPaid) {
            // Find recent unpaid Midtrans orders and mark them as paid
            // The orderId format is: TRIMOJOYO-{timestamp}-{cuidPrefix}
            const parts = orderId.split("-");
            const cuidPrefix = parts[parts.length - 1]; // last segment is the cuid prefix

            const orders = await prisma.order.findMany({
                where: {
                    paymentMethod: "MIDTRANS",
                    isPaid: false,
                    id: { startsWith: cuidPrefix },
                },
            });

            if (orders.length > 0) {
                await prisma.order.updateMany({
                    where: {
                        id: { in: orders.map((o) => o.id) },
                    },
                    data: { isPaid: true },
                });
            } else {
                // Fallback: find any recent unpaid Midtrans orders
                const recentOrders = await prisma.order.findMany({
                    where: {
                        paymentMethod: "MIDTRANS",
                        isPaid: false,
                        createdAt: {
                            gte: new Date(Date.now() - 30 * 60 * 1000), // last 30 minutes
                        },
                    },
                    orderBy: { createdAt: "desc" },
                    take: 5,
                });

                if (recentOrders.length > 0) {
                    await prisma.order.updateMany({
                        where: {
                            id: { in: recentOrders.map((o) => o.id) },
                        },
                        data: { isPaid: true },
                    });
                }
            }
        }

        return NextResponse.json({ status: "ok" });
    } catch (error) {
        console.error("Midtrans notification error:", error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
