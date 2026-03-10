import prisma from "@/lib/prisma";
import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// POST — update order status
export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) return NextResponse.json({ error: "not authorized" }, { status: 401 });

        const { orderId, status } = await request.json();
        await prisma.order.update({ where: { id: orderId }, data: { status } });
        return NextResponse.json({ message: "Status pesanan diperbarui" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
    }
}

// GET — get all orders
export async function GET(request) {
    try {
        const { userId } = getAuth(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) return NextResponse.json({ error: "not authorized" }, { status: 401 });

        const orders = await prisma.order.findMany({
            include: { user: true, address: true, orderItems: { include: { product: true } } },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ orders });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
    }
}
