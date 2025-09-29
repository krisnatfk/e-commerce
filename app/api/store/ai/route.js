import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { openai } from "@/configs/openai";


async function main(base64Image, mimeType) {
      const messages = [
        {
            "role": "system",
             "content": `
                        Kamu adalah asisten listing produk untuk sebuah toko e-commerce.
                        Tugasmu adalah menganalisis gambar produk dan menghasilkan data terstruktur.

                        Balas HANYA dengan JSON mentah (tanpa code block, tanpa markdown, tanpa penjelasan).
                        JSON harus mengikuti skema berikut:

                        {
                        "name": string,           // Nama produk singkat
                        "description": string,    // Deskripsi produk dengan bahasa promosi yang menarik
                        }
             `
        },
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Analisis gambar ini dan kembalikan nama + deskripsi.",
        },
        {
          "type": "image_url",
          "image_url": {
            "url": `data:${mimeType};base64,${base64Image}`
          },
        },
      ],
    }
  ];
 
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages,
    });

    const raw = response.choices[0].message.content

    // remove ```json or``` wrappers if present
    const cleaned = raw.replace(/```json|```/g, "").trim();

    let parsed;
    try {
        parsed = JSON.parse(cleaned)
    } catch (error) {
        throw new error("AI did not return valid JSON")
    }
    return parsed;
}

export async function POST(request){
    try {
        const {userId} = getAuth(request)
        const isSeller = await authSeller(userId)
        if(!isSeller){
            return NextResponse.json({error: 'not authorized'}, {status: 401})
        }
        const {base64Image, mimeType} = await request.json();
        const result = await main(base64Image, mimeType)
        return NextResponse.json({...result})
    } catch (error) {
        console.error(error);
        return NextResponse.json({error: error.code || error.message}, {status: 400})
    }
}