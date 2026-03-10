import imagekit from "@/configs/imageKit";
import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// add new product
export async function POST(request) {
    try {
        const { userId } = getAuth(request)
        const storeId = await authSeller(userId)
        if (!storeId) {
            return NextResponse.json({ error: "not authorized" }, { status: 401 })
        }

        // get the data from teh form
        const formData = await request.formData()
        const name = formData.get("name")
        const description = formData.get("description")
        const mrp = Number(formData.get("mrp"))
        const price = Number(formData.get("price"))
        const category = formData.get("category")
        const images = formData.getAll("images")

        if (!name || !description || !mrp || !price || !category || images.length < 1) {
            return NextResponse.json({ error: "missing product details" }, { status: 401 })
        }

        // upload images to imagekit
        const imageUrl = await Promise.all(images.map(async (image) => {
            const buffer = Buffer.from(await image.arrayBuffer());
            const response = await imagekit.upload({
                file: buffer,
                fileName: image.name,
                folder: "products"
            })
            const url = imagekit.url({
                path: response.filePath,
                transformation: [
                    { quality: "auto" },
                    { format: "webp" },
                    { width: "1024" }
                ]
            })
            return url
        }))

        await prisma.product.create({
            data: {
                name,
                description,
                mrp,
                price,
                category,
                images: imageUrl,
                storeId
            }
        })

        return NextResponse.json({ message: "product added successfully" })

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}

// get all products of a seller
export async function GET(request) {
    try {
        const { userId } = getAuth(request)
        const storeId = await authSeller(userId)
        if (!storeId) {
            return NextResponse.json({ error: "not authorized" }, { status: 401 })
        }
        const products = await prisma.product.findMany({
            where: { storeId }
        })

        return NextResponse.json({ products })
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}

// edit product
export async function PUT(request) {
    try {
        const { userId } = getAuth(request)
        const storeId = await authSeller(userId)
        if (!storeId) {
            return NextResponse.json({ error: "not authorized" }, { status: 401 })
        }

        const { productId, name, description, mrp, price, category } = await request.json()

        if (!productId) {
            return NextResponse.json({ error: "missing productId" }, { status: 400 })
        }

        // Verify product belongs to this store
        const product = await prisma.product.findFirst({
            where: { id: productId, storeId }
        })

        if (!product) {
            return NextResponse.json({ error: "product not found" }, { status: 404 })
        }

        // Build update data (only include fields that are provided)
        const updateData = {}
        if (name !== undefined) updateData.name = name
        if (description !== undefined) updateData.description = description
        if (mrp !== undefined) updateData.mrp = Number(mrp)
        if (price !== undefined) updateData.price = Number(price)
        if (category !== undefined) updateData.category = category

        const updated = await prisma.product.update({
            where: { id: productId },
            data: updateData
        })

        return NextResponse.json({ message: "Produk berhasil diupdate", product: updated })
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}

// delete product
export async function DELETE(request) {
    try {
        const { userId } = getAuth(request)
        const storeId = await authSeller(userId)
        if (!storeId) {
            return NextResponse.json({ error: "not authorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const productId = searchParams.get('productId')

        if (!productId) {
            return NextResponse.json({ error: "missing productId" }, { status: 400 })
        }

        // Verify product belongs to this store
        const product = await prisma.product.findFirst({
            where: { id: productId, storeId }
        })

        if (!product) {
            return NextResponse.json({ error: "product not found" }, { status: 404 })
        }

        // Check if product has any orders
        const orderItems = await prisma.orderItem.findMany({
            where: { productId }
        })

        if (orderItems.length > 0) {
            // Soft approach: just mark as out of stock instead of deleting
            await prisma.product.update({
                where: { id: productId },
                data: { inStock: false }
            })
            return NextResponse.json({
                message: "Produk memiliki pesanan terkait. Produk dinonaktifkan (tidak dihapus).",
                softDeleted: true
            })
        }

        await prisma.product.delete({
            where: { id: productId }
        })

        return NextResponse.json({ message: "Produk berhasil dihapus" })
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}