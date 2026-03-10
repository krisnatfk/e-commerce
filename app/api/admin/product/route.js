import imagekit from "@/configs/imageKit";
import prisma from "@/lib/prisma";
import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Helper: get or create the admin's store
async function getAdminStore() {
    let store = await prisma.store.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!store) {
        store = await prisma.store.create({
            data: {
                name: "TrimoJoyo",
                ownerId: "admin",
                description: "Toko resmi TrimoJoyo",
                logo: "https://img.icons8.com/color/96/shop.png",
            }
        });
    }
    return store.id;
}

// POST — add new product
export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) return NextResponse.json({ error: "not authorized" }, { status: 401 });

        const storeId = await getAdminStore();

        const formData = await request.formData();
        const name = formData.get("name");
        const description = formData.get("description");
        const mrp = Number(formData.get("mrp"));
        const price = Number(formData.get("price"));
        const category = formData.get("category");
        const images = formData.getAll("images");

        if (!name || !description || !mrp || !price || !category || images.length < 1) {
            return NextResponse.json({ error: "missing product details" }, { status: 400 });
        }

        const imageUrl = await Promise.all(images.map(async (image) => {
            const buffer = Buffer.from(await image.arrayBuffer());
            const response = await imagekit.upload({
                file: buffer,
                fileName: image.name,
                folder: "products"
            });
            const url = imagekit.url({
                path: response.filePath,
                transformation: [{ quality: "auto" }, { format: "webp" }, { width: "1024" }]
            });
            return url;
        }));

        await prisma.product.create({
            data: { name, description, mrp, price, category, images: imageUrl, storeId }
        });

        return NextResponse.json({ message: "Produk berhasil ditambahkan" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
    }
}

// GET — get all products
export async function GET(request) {
    try {
        const { userId } = getAuth(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) return NextResponse.json({ error: "not authorized" }, { status: 401 });

        const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
        return NextResponse.json({ products });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
    }
}

// PUT — edit product (accepts FormData with optional new images)
export async function PUT(request) {
    try {
        const { userId } = getAuth(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) return NextResponse.json({ error: "not authorized" }, { status: 401 });

        const formData = await request.formData();
        const productId = formData.get("productId");
        if (!productId) return NextResponse.json({ error: "missing productId" }, { status: 400 });

        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) return NextResponse.json({ error: "product not found" }, { status: 404 });

        const name = formData.get("name");
        const description = formData.get("description");
        const mrp = formData.get("mrp");
        const price = formData.get("price");
        const category = formData.get("category");
        const newImages = formData.getAll("images");
        // existingImages = JSON-stringified array of URLs the user kept
        const existingImagesRaw = formData.get("existingImages");

        const updateData = {};
        if (name) updateData.name = name;
        if (description) updateData.description = description;
        if (mrp) updateData.mrp = Number(mrp);
        if (price) updateData.price = Number(price);
        if (category) updateData.category = category;

        // Build final images array: kept existing + newly uploaded
        let finalImages = [];

        // Parse existing images the user chose to keep
        if (existingImagesRaw) {
            try { finalImages = JSON.parse(existingImagesRaw); } catch (e) { finalImages = []; }
        }

        // Upload new images to ImageKit
        if (newImages && newImages.length > 0 && newImages[0]?.size > 0) {
            const uploadedUrls = await Promise.all(newImages.map(async (image) => {
                const buffer = Buffer.from(await image.arrayBuffer());
                const response = await imagekit.upload({
                    file: buffer,
                    fileName: image.name,
                    folder: "products"
                });
                return imagekit.url({
                    path: response.filePath,
                    transformation: [{ quality: "auto" }, { format: "webp" }, { width: "1024" }]
                });
            }));
            finalImages = [...finalImages, ...uploadedUrls];
        }

        // Only update images if we have any
        if (finalImages.length > 0) {
            updateData.images = finalImages;
        }

        const updated = await prisma.product.update({ where: { id: productId }, data: updateData });
        return NextResponse.json({ message: "Produk berhasil diupdate", product: updated });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
    }
}

// DELETE — delete product
export async function DELETE(request) {
    try {
        const { userId } = getAuth(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) return NextResponse.json({ error: "not authorized" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');
        if (!productId) return NextResponse.json({ error: "missing productId" }, { status: 400 });

        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) return NextResponse.json({ error: "product not found" }, { status: 404 });

        const orderItems = await prisma.orderItem.findMany({ where: { productId } });
        if (orderItems.length > 0) {
            await prisma.product.update({ where: { id: productId }, data: { inStock: false } });
            return NextResponse.json({ message: "Produk dinonaktifkan (ada pesanan terkait)", softDeleted: true });
        }

        await prisma.product.delete({ where: { id: productId } });
        return NextResponse.json({ message: "Produk berhasil dihapus" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
    }
}
