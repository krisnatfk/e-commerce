import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { genai } from "@/configs/gemini";


// Retry helper with exponential backoff for rate-limited APIs
async function withRetry(fn, maxRetries = 4) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const status = error.status; // @google/genai throws ApiError with .status
      if ((status === 429 || status === 503) && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 3000 + Math.random() * 2000;
        console.log(`Rate limited (${status}). Retrying in ${Math.round(delay / 1000)}s... (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}


async function main(base64Image, mimeType) {
  const prompt = `
Kamu adalah asisten listing produk untuk sebuah toko e-commerce.
Tugasmu adalah menganalisis gambar produk dan menghasilkan data terstruktur.

Balas HANYA dengan JSON mentah (tanpa code block, tanpa markdown, tanpa penjelasan).
JSON harus mengikuti skema berikut:

{
  "name": string,           // Nama produk singkat
  "description": string     // Deskripsi produk dengan bahasa promosi yang menarik
}
`;

  const response = await withRetry(() =>
    genai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Image,
              },
            },
          ],
        },
      ],
    })
  );

  const raw = response.text;

  // remove ```json or ``` wrappers if present
  const cleaned = raw.replace(/```json|```/g, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error("AI did not return valid JSON: " + cleaned.substring(0, 200));
  }
  return parsed;
}

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const isSeller = await authSeller(userId);
    if (!isSeller) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }
    const { base64Image, mimeType } = await request.json();
    const result = await main(base64Image, mimeType);
    return NextResponse.json({ ...result });
  } catch (error) {
    console.error("AI Route Error:", {
      status: error.status || error.httpErrorCode,
      message: error.message,
      model: process.env.GEMINI_MODEL,
    });

    if (error.status === 429 || error.httpErrorCode === 429) {
      return NextResponse.json(
        { error: "API Gemini rate limit tercapai. Tunggu 1-2 menit lalu coba lagi." },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}