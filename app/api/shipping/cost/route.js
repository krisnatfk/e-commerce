import { NextResponse } from "next/server";

// Built-in shipping cost calculator
// Since BinderByte /v1/cost API is not available, we calculate shipping internally
// using realistic flat-rate pricing based on Indonesian courier services.

// Province zone mapping (approximate distance zones from origin)
// Zone 1: Same province/island = cheapest
// Zone 2: Nearby islands (Jawa-Sumatera, etc.)
// Zone 3: Far islands (Kalimantan, Sulawesi, etc.)
// Zone 4: Very far (Papua, Maluku, NTT, etc.)

const ZONE_MAP = {
    // Sumatera
    "aceh": 2, "sumatera utara": 2, "medan": 2, "sumatera barat": 2, "padang": 2,
    "riau": 2, "pekanbaru": 2, "jambi": 2, "sumatera selatan": 2, "palembang": 2,
    "bengkulu": 2, "lampung": 1, "bandar lampung": 1,
    "kepulauan bangka belitung": 2, "kepulauan riau": 2, "batam": 2,

    // Jawa
    "dki jakarta": 2, "jakarta": 2, "jakarta pusat": 2, "jakarta utara": 2,
    "jakarta barat": 2, "jakarta selatan": 2, "jakarta timur": 2,
    "jawa barat": 2, "bandung": 2, "bogor": 2, "depok": 2, "bekasi": 2,
    "tangerang": 2, "tangerang selatan": 2, "serang": 2, "cilegon": 2,
    "banten": 2, "cirebon": 2, "tasikmalaya": 2, "sukabumi": 2,
    "jawa tengah": 2, "semarang": 2, "solo": 2, "surakarta": 2,
    "purwokerto": 2, "tegal": 2, "pekalongan": 2, "magelang": 2,
    "klaten": 2, "karanganyar": 2, "sukoharjo": 2, "wonogiri": 2, "boyolali": 2,
    "jawa timur": 2, "surabaya": 2, "malang": 2, "kediri": 2, "jember": 2,
    "probolinggo": 2, "mojokerto": 2, "pasuruan": 2, "blitar": 2,
    "gresik": 2, "sidoarjo": 2, "lamongan": 2, "tuban": 2, "bangkalan": 2,
    "di yogyakarta": 2, "yogyakarta": 2,

    // Bali & Nusa Tenggara
    "bali": 3, "denpasar": 3,
    "nusa tenggara barat": 3, "mataram": 3, "lombok": 3,
    "nusa tenggara timur": 4, "kupang": 4,

    // Kalimantan
    "kalimantan barat": 3, "pontianak": 3,
    "kalimantan tengah": 3, "palangkaraya": 3,
    "kalimantan selatan": 3, "banjarmasin": 3,
    "kalimantan timur": 3, "samarinda": 3, "balikpapan": 3,
    "kalimantan utara": 3, "tarakan": 3,

    // Sulawesi
    "sulawesi utara": 3, "manado": 3,
    "sulawesi tengah": 3, "palu": 3,
    "sulawesi selatan": 3, "makassar": 3, "ujung pandang": 3,
    "sulawesi tenggara": 3, "kendari": 3,
    "gorontalo": 3,
    "sulawesi barat": 3,

    // Maluku & Papua
    "maluku": 4, "ambon": 4,
    "maluku utara": 4, "ternate": 4,
    "papua": 4, "jayapura": 4,
    "papua barat": 4, "sorong": 4,
    "papua selatan": 4, "papua tengah": 4, "papua pegunungan": 4,
};

// Courier pricing per kg per zone (in Rupiah)
const COURIER_RATES = {
    jne: {
        name: "JNE",
        services: [
            { service: "REG", description: "JNE Reguler", zonePrice: [9000, 11000, 18000, 28000], zoneEtd: ["1-2", "2-3", "3-5", "5-7"] },
            { service: "OKE", description: "JNE Ongkos Kirim Ekonomis", zonePrice: [7000, 9000, 15000, 23000], zoneEtd: ["2-3", "3-5", "4-7", "7-14"] },
            { service: "YES", description: "JNE Yakin Esok Sampai", zonePrice: [15000, 20000, 30000, 45000], zoneEtd: ["1", "1-2", "2-3", "3-5"] },
        ]
    },
    tiki: {
        name: "TIKI",
        services: [
            { service: "REG", description: "TIKI Reguler", zonePrice: [9000, 11000, 17000, 27000], zoneEtd: ["2-3", "3-4", "4-6", "6-8"] },
            { service: "ECO", description: "TIKI Economy", zonePrice: [7000, 9000, 14000, 22000], zoneEtd: ["3-5", "4-6", "5-8", "8-14"] },
            { service: "ONS", description: "TIKI Over Night Service", zonePrice: [16000, 21000, 32000, 48000], zoneEtd: ["1", "1-2", "2-3", "3-5"] },
        ]
    },
    pos: {
        name: "POS Indonesia",
        services: [
            { service: "Paket Kilat Khusus", description: "POS Kilat Khusus", zonePrice: [10000, 12000, 19000, 30000], zoneEtd: ["2-4", "3-5", "4-7", "7-10"] },
            { service: "Express Next Day", description: "POS Express", zonePrice: [18000, 23000, 35000, 50000], zoneEtd: ["1", "1-2", "2-3", "3-5"] },
        ]
    },
    sicepat: {
        name: "SiCepat",
        services: [
            { service: "REG", description: "SiCepat Reguler", zonePrice: [8500, 10000, 16000, 26000], zoneEtd: ["1-2", "2-3", "3-5", "5-7"] },
            { service: "BEST", description: "SiCepat Besok Sampai Tujuan", zonePrice: [14000, 18000, 28000, 42000], zoneEtd: ["1", "1-2", "2-3", "3-4"] },
        ]
    },
    anteraja: {
        name: "AnterAja",
        services: [
            { service: "REG", description: "AnterAja Reguler", zonePrice: [8000, 10000, 16000, 25000], zoneEtd: ["2-3", "3-4", "4-6", "6-8"] },
            { service: "ND", description: "AnterAja Next Day", zonePrice: [15000, 19000, 29000, 44000], zoneEtd: ["1", "1-2", "2-3", "3-5"] },
        ]
    },
};

function getZone(city, originCity) {
    const cityLower = city.toLowerCase().trim();
    const originLower = originCity.toLowerCase().trim();

    // Same city = zone 1
    if (cityLower === originLower) return 1;

    // Look up in zone map
    const zone = ZONE_MAP[cityLower];
    if (zone) return zone;

    // Default to zone 3 if unknown
    return 3;
}

export async function POST(request) {
    try {
        const { destination, weight, courier } = await request.json();

        if (!destination || !weight || !courier) {
            return NextResponse.json(
                { error: "Missing required fields: destination, weight, courier" },
                { status: 400 }
            );
        }

        const origin = process.env.STORE_ORIGIN_CITY || "Lampung";
        const courierData = COURIER_RATES[courier];

        if (!courierData) {
            return NextResponse.json(
                { error: `Kurir '${courier}' tidak tersedia` },
                { status: 400 }
            );
        }

        const zone = getZone(destination, origin);
        const zoneIndex = zone - 1; // convert 1-based to 0-based

        // Weight in grams to kg, minimum 1 kg
        const weightKg = Math.max(1, Math.ceil(weight / 1000));

        const results = courierData.services.map(svc => ({
            service: svc.service,
            description: svc.description,
            cost: svc.zonePrice[zoneIndex] * weightKg,
            etd: svc.zoneEtd[zoneIndex],
        }));

        return NextResponse.json({ results });
    } catch (error) {
        console.error("Shipping cost error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
