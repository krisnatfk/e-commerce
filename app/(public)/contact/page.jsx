'use client'
import { useState } from "react"
import { MapPinIcon, PhoneIcon, MailIcon, ClockIcon, SendIcon, Loader2Icon, MessageCircleIcon, CheckCircleIcon } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

const contactInfo = [
    {
        icon: PhoneIcon,
        title: "Telepon / WhatsApp",
        detail: "+62 858-7740-1876",
        sub: "Senin — Sabtu, 08:00 — 17:00 WIB",
        href: "https://wa.me/6285877401876",
        color: "bg-green-50 text-green-600",
    },
    {
        icon: MailIcon,
        title: "Email",
        detail: "k1215na77@gmail.com",
        sub: "Respon dalam 1x24 jam",
        href: "mailto:k1215na77@gmail.com",
        color: "bg-blue-50 text-blue-600",
    },
    {
        icon: MapPinIcon,
        title: "Alamat",
        detail: "Bandar Lampung, Lampung",
        sub: "Indonesia, 94102",
        href: "https://maps.google.com/?q=Bandar+Lampung",
        color: "bg-orange-50 text-orange-600",
    },
    {
        icon: ClockIcon,
        title: "Jam Operasional",
        detail: "Senin — Sabtu",
        sub: "08:00 — 17:00 WIB",
        href: null,
        color: "bg-purple-50 text-purple-600",
    },
]

export default function ContactPage() {
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' })
    const [sending, setSending] = useState(false)
    const [sent, setSent] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.name || !formData.email || !formData.message) {
            return toast.error("Mohon isi semua field yang wajib")
        }
        setSending(true)
        // Simulate sending (replace with actual API later)
        await new Promise(r => setTimeout(r, 1500))
        setSending(false)
        setSent(true)
        toast.success("Pesan berhasil dikirim!")
        setFormData({ name: '', email: '', subject: '', message: '' })
        setTimeout(() => setSent(false), 4000)
    }

    return (
        <div className="min-h-screen bg-white">

            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-slate-50">
                <div className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
                    <div className="max-w-2xl">
                        <p className="text-green-600 font-medium text-sm tracking-wider uppercase mb-3">Hubungi Kami</p>
                        <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 leading-tight mb-4">
                            Ada Pertanyaan? <span className="text-green-600">Kami Siap Membantu</span>
                        </h1>
                        <p className="text-slate-500 leading-relaxed">
                            Jangan ragu untuk menghubungi kami. Tim TrimoJoyo siap menjawab pertanyaan seputar produk,
                            pemesanan, kerjasama reseller, atau hal lainnya.
                        </p>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-green-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            </section>

            {/* Contact Cards */}
            <section className="max-w-6xl mx-auto px-6 -mt-2 mb-12">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {contactInfo.map((item, i) => (
                        <a
                            key={i}
                            href={item.href || '#'}
                            target={item.href?.startsWith('http') ? '_blank' : undefined}
                            rel="noopener noreferrer"
                            className={`group p-5 rounded-xl border border-slate-100 hover:border-green-200 hover:shadow-lg transition-all duration-300 bg-white ${!item.href ? 'pointer-events-none' : ''}`}
                        >
                            <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center mb-3`}>
                                <item.icon size={18} />
                            </div>
                            <p className="font-semibold text-slate-800 text-sm mb-1">{item.title}</p>
                            <p className="text-slate-700 text-sm">{item.detail}</p>
                            <p className="text-slate-400 text-xs mt-1">{item.sub}</p>
                        </a>
                    ))}
                </div>
            </section>

            {/* Form + Map */}
            <section className="max-w-6xl mx-auto px-6 pb-16">
                <div className="grid lg:grid-cols-5 gap-8">
                    {/* Contact Form */}
                    <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 p-6 sm:p-8">
                        <div className="flex items-center gap-2 mb-6">
                            <MessageCircleIcon size={20} className="text-green-600" />
                            <h2 className="text-xl font-bold text-slate-800">Kirim Pesan</h2>
                        </div>

                        {sent ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <CheckCircleIcon size={48} className="text-green-500 mb-4" />
                                <h3 className="text-lg font-semibold text-slate-800 mb-2">Pesan Terkirim!</h3>
                                <p className="text-slate-500 text-sm">Terima kasih. Kami akan segera menghubungi Anda kembali.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-500 font-medium mb-1 block">Nama Lengkap *</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="John Doe"
                                            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-green-400 focus:ring-1 focus:ring-green-100 transition"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 font-medium mb-1 block">Email *</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                            placeholder="john@email.com"
                                            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-green-400 focus:ring-1 focus:ring-green-100 transition"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 font-medium mb-1 block">Subjek</label>
                                    <input
                                        type="text"
                                        value={formData.subject}
                                        onChange={e => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                                        placeholder="Pertanyaan tentang produk..."
                                        className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-green-400 focus:ring-1 focus:ring-green-100 transition"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 font-medium mb-1 block">Pesan *</label>
                                    <textarea
                                        rows={5}
                                        value={formData.message}
                                        onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
                                        placeholder="Tulis pesan Anda di sini..."
                                        className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-green-400 focus:ring-1 focus:ring-green-100 transition resize-none"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-full text-sm font-medium transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {sending ? (
                                        <><Loader2Icon size={16} className="animate-spin" /> Mengirim...</>
                                    ) : (
                                        <><SendIcon size={16} /> Kirim Pesan</>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Side Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Map */}
                        <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d127122.75866988!2d105.20935!3d-5.42917!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e40d3e8bfc0e9f3%3A0x386b0e0e37b97393!2sBandar%20Lampung%2C%20Lampung!5e0!3m2!1sid!2sid!4v1710000000000!5m2!1sid!2sid"
                                width="100%"
                                height="250"
                                style={{ border: 0 }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                className="w-full"
                            />
                        </div>

                        {/* WhatsApp CTA */}
                        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-center">
                            <PhoneIcon size={28} className="text-green-200 mx-auto mb-3" />
                            <h3 className="text-white font-bold text-lg mb-2">Chat via WhatsApp</h3>
                            <p className="text-green-100 text-sm mb-4">Respon cepat untuk pemesanan dan pertanyaan</p>
                            <a
                                href="https://wa.me/6285877401876?text=Halo%20TrimoJoyo,%20saya%20ingin%20bertanya..."
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block px-6 py-2.5 bg-white text-green-700 font-medium rounded-full text-sm hover:bg-green-50 transition-all active:scale-95"
                            >
                                Chat Sekarang
                            </a>
                        </div>

                        {/* FAQ teaser */}
                        <div className="bg-slate-50 rounded-2xl p-6">
                            <h3 className="font-bold text-slate-800 mb-3">Pertanyaan Umum</h3>
                            <div className="space-y-3 text-sm">
                                {[
                                    { q: "Bagaimana cara memesan?", a: "Pilih produk → Tambah ke keranjang → Checkout → Bayar" },
                                    { q: "Berapa minimum order?", a: "Tidak ada minimum order. Beli sesuai kebutuhan Anda." },
                                    { q: "Apakah bisa COD?", a: "Ya, kami mendukung pembayaran COD dan Transfer." },
                                ].map((faq, i) => (
                                    <details key={i} className="group">
                                        <summary className="cursor-pointer text-slate-700 font-medium hover:text-green-600 transition">{faq.q}</summary>
                                        <p className="text-slate-500 mt-1 pl-2">{faq.a}</p>
                                    </details>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
