import Link from "next/link"
import { ShieldCheckIcon, TruckIcon, LeafIcon, UsersIcon, StarIcon, HeartIcon } from "lucide-react"

export const metadata = {
    title: "Tentang Kami — TrimoJoyo",
    description: "TrimoJoyo adalah pemasok ayam fillet segar dan berkualitas pilihan Anda. 100% halal, bersih, dan higienis untuk kebutuhan dapur dan bisnis Anda.",
}

const values = [
    {
        icon: ShieldCheckIcon,
        title: "100% Halal",
        desc: "Semua produk kami telah tersertifikasi halal dan diproses sesuai standar syariah."
    },
    {
        icon: LeafIcon,
        title: "Segar & Higienis",
        desc: "Dipotong dan dikemas setiap hari dengan standar kebersihan dan kesegaran terjamin."
    },
    {
        icon: TruckIcon,
        title: "Pengiriman Cepat",
        desc: "Dikirim langsung ke lokasi Anda dengan cold chain yang menjaga kualitas produk."
    },
    {
        icon: UsersIcon,
        title: "Dipercaya Bisnis",
        desc: "Melayani ratusan pelanggan dari restoran, catering, hingga konsumen rumahan."
    },
]

const stats = [
    { value: "500+", label: "Pelanggan Aktif" },
    { value: "10K+", label: "Produk Terjual" },
    { value: "4.9", label: "Rating Rata-rata" },
    { value: "24 Jam", label: "Respon Cepat" },
]

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white">

            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-slate-50">
                <div className="max-w-6xl mx-auto px-6 py-16 sm:py-24">
                    <div className="max-w-3xl">
                        <p className="text-green-600 font-medium text-sm tracking-wider uppercase mb-3">Tentang Kami</p>
                        <h1 className="text-3xl sm:text-5xl font-bold text-slate-800 leading-tight mb-6">
                            Pemasok Ayam Fillet <span className="text-green-600">Segar & Berkualitas</span> Pilihan Anda
                        </h1>
                        <p className="text-slate-500 text-lg leading-relaxed mb-8">
                            TrimoJoyo hadir sebagai solusi kebutuhan daging ayam berkualitas tinggi untuk bisnis dan keluarga Anda.
                            Dari dada fillet hingga berbagai karkas potong, kami menghadirkan produk sehat, bersih, dan 100% halal.
                        </p>
                        <div className="flex gap-3">
                            <Link href="/shop" className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-full text-sm font-medium transition-all active:scale-95">
                                Lihat Produk
                            </Link>
                            <Link href="/contact" className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-sm font-medium transition-all">
                                Hubungi Kami
                            </Link>
                        </div>
                    </div>
                </div>
                {/* Decorative */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-green-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            </section>

            {/* Stats */}
            <section className="border-y border-slate-100 bg-white">
                <div className="max-w-6xl mx-auto px-6 py-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {stats.map((stat, i) => (
                            <div key={i} className="text-center">
                                <p className="text-3xl font-bold text-green-600">{stat.value}</p>
                                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
                <div className="text-center mb-12">
                    <p className="text-green-600 font-medium text-sm tracking-wider uppercase mb-2">Kenapa TrimoJoyo?</p>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Komitmen Kami untuk Kualitas</h2>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {values.map((item, i) => (
                        <div key={i} className="group p-6 rounded-2xl border border-slate-100 hover:border-green-200 hover:shadow-lg transition-all duration-300 bg-white">
                            <div className="w-12 h-12 rounded-xl bg-green-50 group-hover:bg-green-100 flex items-center justify-center mb-4 transition-colors">
                                <item.icon size={22} className="text-green-600" />
                            </div>
                            <h3 className="font-semibold text-slate-800 mb-2">{item.title}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Story */}
            <section className="bg-slate-50">
                <div className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <p className="text-green-600 font-medium text-sm tracking-wider uppercase mb-3">Cerita Kami</p>
                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-6">Dari Lampung untuk Indonesia</h2>
                            <div className="space-y-4 text-slate-500 text-sm leading-relaxed">
                                <p>
                                    Berawal dari Bandar Lampung, TrimoJoyo didirikan dengan visi sederhana: menyediakan produk ayam berkualitas
                                    tinggi yang terjangkau untuk semua kalangan. Kami percaya bahwa setiap keluarga dan bisnis berhak mendapatkan
                                    bahan makanan yang segar, bersih, dan aman.
                                </p>
                                <p>
                                    Dengan pengalaman bertahun-tahun di industri perunggasan, kami memahami bahwa kualitas dimulai dari hulu.
                                    Dari seleksi ternak, proses pemotongan, hingga pengemasan — setiap langkah dikontrol ketat untuk memastikan
                                    produk terbaik sampai ke tangan Anda.
                                </p>
                                <p>
                                    Kini, TrimoJoyo telah melayani ratusan pelanggan dari berbagai daerah. Dengan hadirnya platform online ini,
                                    kami berkomitmen untuk terus menjangkau lebih banyak pelanggan dan memberikan pengalaman belanja yang mudah,
                                    cepat, dan terpercaya.
                                </p>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                            <HeartIcon size={48} className="text-green-600 mb-4" />
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Misi Kami</h3>
                            <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
                                Menyediakan produk ayam fillet dan olahan berkualitas tinggi dengan harga terjangkau,
                                proses higienis, dan pengiriman cepat untuk mendukung kebutuhan dapur dan bisnis di seluruh Indonesia.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="max-w-6xl mx-auto px-6 py-16 text-center">
                <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-10 sm:p-14">
                    <StarIcon size={32} className="text-green-200 mx-auto mb-4" />
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Siap Memesan?</h2>
                    <p className="text-green-100 mb-6 max-w-lg mx-auto">
                        Jelajahi produk kami dan nikmati pengalaman belanja ayam fillet segar langsung dari TrimoJoyo.
                    </p>
                    <Link href="/shop" className="inline-block px-8 py-3 bg-white text-green-700 font-medium rounded-full hover:bg-green-50 transition-all active:scale-95">
                        Belanja Sekarang
                    </Link>
                </div>
            </section>
        </div>
    )
}
