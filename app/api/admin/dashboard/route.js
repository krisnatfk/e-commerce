import prisma from "@/lib/prisma";
import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        const { userId } = getAuth(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ error: "not authorized" }, { status: 401 });
        }

        // Core stats
        const orders = await prisma.order.count();
        const products = await prisma.product.count();

        const allOrders = await prisma.order.findMany({
            select: { createdAt: true, total: true }
        });

        let totalRevenue = 0;
        allOrders.forEach(order => { totalRevenue += order.total; });
        const revenue = totalRevenue.toFixed(0);

        // Recent orders (last 10)
        const recentOrders = await prisma.order.findMany({
            include: { user: true },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        // Recent reviews (last 10)
        const recentReviews = await prisma.rating.findMany({
            include: { user: true, product: true },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        const dashboardData = {
            orders,
            products,
            revenue,
            allOrders,
            recentOrders,
            recentReviews,
        };

        return NextResponse.json({ dashboardData });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
    }
}