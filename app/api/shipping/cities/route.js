import { NextResponse } from "next/server";

// No separate cities endpoint needed for Binderbyte - it uses city names directly.
// This endpoint can still be used to validate or provide city suggestions.

export async function GET() {
    try {
        // Binderbyte uses city names, not city IDs.
        // Return a list of common Indonesian cities for the frontend autocomplete.
        const commonCities = [
            "Jakarta Pusat", "Jakarta Utara", "Jakarta Barat", "Jakarta Selatan", "Jakarta Timur",
            "Surabaya", "Bandung", "Medan", "Semarang", "Makassar",
            "Palembang", "Tangerang", "Depok", "Bekasi", "Bogor",
            "Malang", "Yogyakarta", "Solo", "Denpasar", "Batam",
            "Pekanbaru", "Pontianak", "Banjarmasin", "Manado", "Padang",
            "Samarinda", "Balikpapan", "Cirebon", "Tasikmalaya", "Sukabumi",
            "Serang", "Cilegon", "Tangerang Selatan", "Lampung", "Jambi",
            "Mataram", "Kupang", "Ambon", "Jayapura", "Sorong",
            "Purwokerto", "Tegal", "Pekalongan", "Magelang", "Kediri",
            "Jember", "Probolinggo", "Mojokerto", "Pasuruan", "Blitar",
            "Gresik", "Sidoarjo", "Lamongan", "Tuban", "Bangkalan",
            "Klaten", "Karanganyar", "Sukoharjo", "Wonogiri", "Boyolali",
        ];

        return NextResponse.json({ cities: commonCities });
    } catch (error) {
        console.error("Cities error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
