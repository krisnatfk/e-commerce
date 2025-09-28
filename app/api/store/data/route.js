import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// get store info & store products


export async function GET(request) {
    try {
        // Get store username from query params
        const { searchParams } = new URL(request.url);
        const username = searchParams.get("username").toLocaleLowerCase();

        if (!username) {
            return NextResponse.json({ error: "missing store username" }, { status: 400 });
        }

        // get store info and instock products whit ratings
const store = await prisma.store.findFirst({
    where: { username, isActive: true },
    include: {
        Product: { include: { rating: true } }
    }
})

        if (!store) {
            return NextResponse.json({ error: "store not found" }, { status: 400 });
        }

        return NextResponse.json({ store });
    } catch (error) {
        console.error(error);
        return NextResponse.json({error: error.code || error.message}, {status: 400})
    }
}