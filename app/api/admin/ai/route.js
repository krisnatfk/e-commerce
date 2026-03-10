import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { genai } from "@/configs/gemini";

async function withRetry(fn, maxRetries = 4) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            const status = error.status;
            if ((status === 429 || status === 503) && attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 3000 + Math.random() * 2000;
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw error;
        }
    }
}

async function analyzeImage(base64Image, mimeType) {
    const prompt = `
Kamu adalah asisten listing produk untuk sebuah toko e-commerce.
Tugasmu adalah menganalisis gambar produk dan menghasilkan data terstruktur.

Balas HANYA dengan JSON mentah (tanpa code block, tanpa markdown, tanpa penjelasan).
JSON harus mengikuti skema berikut:

{
  "name": string,
  "description": string
}
`;

    const response = await withRetry(() =>
        genai.models.generateContent({
            model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
            contents: [{ role: "user", parts: [{ text: prompt }, { inlineData: { mimeType, data: base64Image } }] }],
        })
    );

    const raw = response.text;
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
}

export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) return NextResponse.json({ error: "not authorized" }, { status: 401 });

        const { base64Image, mimeType } = await request.json();
        const result = await analyzeImage(base64Image, mimeType);
        return NextResponse.json({ ...result });
    } catch (error) {
        console.error("AI Route Error:", error.message);
        if (error.status === 429) {
            return NextResponse.json({ error: "API rate limit. Tunggu 1-2 menit." }, { status: 429 });
        }
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
