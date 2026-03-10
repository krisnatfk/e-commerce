import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import midtransClient from "midtrans-client";

// POST: Generate a new Midtrans Snap token for an unpaid order
export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        if (!userId) {
            return NextResponse.json({ error: "not authorized" }, { status: 401 });
        }

        const { orderId } = await request.json();

        if (!orderId) {
            return NextResponse.json({ error: "missing orderId" }, { status: 400 });
        }

        // Find the order and verify it belongs to the user
        const order = await prisma.order.findFirst({
            where: { id: orderId, userId },
            include: {
                orderItems: { include: { product: true } },
                user: true,
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
        }

        if (order.isPaid) {
            return NextResponse.json({ error: "Pesanan sudah dibayar" }, { status: 400 });
        }

        if (order.status === "CANCELLED") {
            return NextResponse.json({ error: "Pesanan sudah dibatalkan" }, { status: 400 });
        }

        if (order.paymentMethod !== "MIDTRANS") {
            return NextResponse.json({ error: "Metode pembayaran bukan MIDTRANS" }, { status: 400 });
        }

        // Create new Midtrans Snap transaction
        const snap = new midtransClient.Snap({
            isProduction: false,
            serverKey: process.env.MIDTRANS_SERVER_KEY,
            clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
        });

        const parameter = {
            transaction_details: {
                order_id: `GOCART-PAY-${Date.now()}-${orderId.substring(0, 5)}`,
                gross_amount: Math.round(order.total),
            },
            credit_card: { secure: true },
            customer_details: {
                first_name: order.user?.name || "Customer",
                email: order.user?.email || "",
            },
            item_details: order.orderItems.map(item => ({
                id: item.productId,
                price: Math.round(item.price),
                quantity: item.quantity,
                name: item.product?.name?.substring(0, 50) || "Product",
            })).concat(
                order.shippingCost > 0 ? [{
                    id: "SHIPPING",
                    price: Math.round(order.shippingCost),
                    quantity: 1,
                    name: `Ongkir ${order.shippingCourier || ''}`.trim(),
                }] : []
            ),
        };

        const transaction = await snap.createTransaction(parameter);

        return NextResponse.json({
            token: transaction.token,
            redirect_url: transaction.redirect_url,
        });
    } catch (error) {
        console.error("Payment retry error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
