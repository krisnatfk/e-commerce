'use client'
import { useEffect, useState } from "react"
import Loading from "@/components/Loading"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import toast from "react-hot-toast"
import { TruckIcon } from "lucide-react"

const STATUS_LABELS = {
    ORDER_PLACED: { label: "Pesanan Baru", color: "bg-blue-100 text-blue-700" },
    PROCESSING: { label: "Diproses", color: "bg-yellow-100 text-yellow-700" },
    SHIPPED: { label: "Dikirim", color: "bg-indigo-100 text-indigo-700" },
    DELIVERED: { label: "Selesai", color: "bg-green-100 text-green-700" },
    CANCELLED: { label: "Dibatalkan", color: "bg-red-100 text-red-700" },
}

export default function AdminOrders() {
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'Rp '
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [trackingInputs, setTrackingInputs] = useState({})
    const [filterStatus, setFilterStatus] = useState('ALL')

    const { getToken } = useAuth()

    const fetchOrders = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.get('/api/admin/orders', { headers: { Authorization: `Bearer ${token}` } })
            setOrders(data.orders)
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        } finally { setLoading(false) }
    }

    const updateOrderStatus = async (orderId, status) => {
        try {
            const token = await getToken()
            await axios.post('/api/admin/orders', { orderId, status }, { headers: { Authorization: `Bearer ${token}` } })
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
            toast.success('Status diperbarui')
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
    }

    const submitTracking = async (orderId) => {
        const trackingNumber = trackingInputs[orderId]
        if (!trackingNumber?.trim()) return toast.error('Masukkan nomor resi')
        try {
            const token = await getToken()
            await axios.post('/api/admin/orders/tracking', { orderId, trackingNumber }, { headers: { Authorization: `Bearer ${token}` } })
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, trackingNumber, status: 'SHIPPED' } : o))
            setTrackingInputs(prev => ({ ...prev, [orderId]: '' }))
            toast.success('Resi berhasil ditambahkan!')
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
    }

    useEffect(() => { fetchOrders() }, [])

    if (loading) return <Loading />

    const filteredOrders = orders.filter(o => {
        if (filterStatus === 'ALL') return true
        if (filterStatus === 'UNPAID') return !o.isPaid && o.paymentMethod === 'MIDTRANS' && o.status !== 'CANCELLED'
        return o.status === filterStatus
    })

    return (
        <>
            <h1 className="text-2xl text-slate-500 mb-5">Kelola <span className="text-slate-800 font-medium">Pesanan</span></h1>

            {/* Filter Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-2 mb-5">
                {[
                    { key: 'ALL', label: 'Semua' },
                    { key: 'UNPAID', label: 'Belum Bayar' },
                    { key: 'ORDER_PLACED', label: 'Pesanan Baru' },
                    { key: 'PROCESSING', label: 'Diproses' },
                    { key: 'SHIPPED', label: 'Dikirim' },
                    { key: 'DELIVERED', label: 'Selesai' },
                    { key: 'CANCELLED', label: 'Dibatalkan' },
                ].map(tab => (
                    <button key={tab.key} onClick={() => setFilterStatus(tab.key)}
                        className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-all ${filterStatus === tab.key ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                        {tab.label}
                        {tab.key === 'UNPAID' && orders.filter(o => !o.isPaid && o.paymentMethod === 'MIDTRANS' && o.status !== 'CANCELLED').length > 0 && (
                            <span className="ml-1 bg-orange-500 text-white text-xs px-1.5 rounded-full">
                                {orders.filter(o => !o.isPaid && o.paymentMethod === 'MIDTRANS' && o.status !== 'CANCELLED').length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {filteredOrders.length === 0 ? (
                <p className="text-slate-400 text-center py-12">Tidak ada pesanan</p>
            ) : (
                <div className="overflow-x-auto max-w-6xl rounded-md shadow border border-gray-200">
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="bg-gray-50 text-gray-700 text-xs uppercase tracking-wider">
                            <tr>
                                {["No", "Customer", "Total", "Metode", "Status Bayar", "Resi", "Status", "Tanggal"].map((h, i) => (
                                    <th key={i} className="px-4 py-3">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredOrders.map((order, index) => (
                                <tr key={order.id} className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => { setSelectedOrder(order); setIsModalOpen(true) }}>
                                    <td className="pl-6 text-green-600">{index + 1}</td>
                                    <td className="px-4 py-3">{order.user?.name}</td>
                                    <td className="px-4 py-3 font-medium text-slate-800">{currency}{order.total.toLocaleString('id-ID')}</td>
                                    <td className="px-4 py-3">
                                        {order.paymentMethod === 'MIDTRANS'
                                            ? <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">Transfer</span>
                                            : <span className="bg-amber-50 text-amber-700 text-xs px-2 py-1 rounded-full">COD</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        {order.status === 'CANCELLED' ? <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">❌ Batal</span>
                                            : order.isPaid ? <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">✅ Lunas</span>
                                                : order.paymentMethod === 'COD' ? <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full">💵 Bayar di tempat</span>
                                                    : <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">⏳ Belum Bayar</span>}
                                    </td>
                                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                        {order.trackingNumber ? (
                                            <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full font-mono">{order.trackingNumber}</span>
                                        ) : order.status !== 'CANCELLED' ? (
                                            <div className="flex items-center gap-1">
                                                <input type="text" placeholder="No. Resi" value={trackingInputs[order.id] || ''}
                                                    onChange={e => setTrackingInputs(prev => ({ ...prev, [order.id]: e.target.value }))}
                                                    className="border border-slate-300 rounded px-2 py-1 text-xs w-28 outline-none focus:border-indigo-400" />
                                                <button onClick={() => submitTracking(order.id)}
                                                    className="bg-indigo-600 text-white text-xs px-2 py-1 rounded hover:bg-indigo-700 transition flex items-center gap-1">
                                                    <TruckIcon size={12} /> Kirim
                                                </button>
                                            </div>
                                        ) : <span className="text-xs text-slate-300">—</span>}
                                    </td>
                                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                        <select value={order.status} onChange={e => updateOrderStatus(order.id, e.target.value)}
                                            className="border-gray-300 rounded-md text-xs focus:ring focus:ring-green-200 py-1">
                                            <option value="ORDER_PLACED">Pesanan Baru</option>
                                            <option value="PROCESSING">Diproses</option>
                                            <option value="SHIPPED">Dikirim</option>
                                            <option value="DELIVERED">Selesai</option>
                                            <option value="CANCELLED">Dibatalkan</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">
                                        {new Date(order.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Detail Modal */}
            {isModalOpen && selectedOrder && (
                <div onClick={() => setIsModalOpen(false)} className="fixed inset-0 flex items-center justify-center bg-black/50 text-slate-700 text-sm backdrop-blur-xs z-50">
                    <div onClick={e => e.stopPropagation()} className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-semibold text-slate-900 mb-4 text-center">Detail Pesanan</h2>

                        {/* Payment + Status */}
                        <div className="mb-4 p-3 bg-slate-50 rounded-lg text-sm">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="text-slate-500">Pembayaran:</span>
                                <strong className="text-slate-700">{selectedOrder.paymentMethod === 'MIDTRANS' ? 'Transfer (Midtrans)' : 'Bayar di Tempat (COD)'}</strong>
                                <span className="text-slate-300">|</span>
                                {selectedOrder.status === 'CANCELLED' ? <span className="bg-red-100 text-red-700 text-xs px-2.5 py-1 rounded-full">❌ Dibatalkan</span>
                                    : selectedOrder.isPaid ? <span className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full">✅ Sudah Bayar</span>
                                        : selectedOrder.paymentMethod === 'COD' ? <span className="bg-amber-100 text-amber-700 text-xs px-2.5 py-1 rounded-full">💵 Bayar saat diterima</span>
                                            : <span className="bg-orange-100 text-orange-700 text-xs px-2.5 py-1 rounded-full">⏳ Belum Bayar</span>}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-500">Status:</span>
                                <span className={`text-xs px-2.5 py-1 rounded-full ${STATUS_LABELS[selectedOrder.status]?.color}`}>
                                    {STATUS_LABELS[selectedOrder.status]?.label}
                                </span>
                            </div>
                        </div>

                        {/* Customer */}
                        <div className="mb-4">
                            <h3 className="font-semibold mb-2">Customer</h3>
                            <p><span className="text-green-700">Nama:</span> {selectedOrder.user?.name}</p>
                            <p><span className="text-green-700">Email:</span> {selectedOrder.user?.email}</p>
                            <p><span className="text-green-700">Telp:</span> {selectedOrder.address?.phone}</p>
                            <p><span className="text-green-700">Alamat:</span> {`${selectedOrder.address?.street}, ${selectedOrder.address?.city}, ${selectedOrder.address?.state}, ${selectedOrder.address?.zip}`}</p>
                        </div>

                        {/* Shipping */}
                        <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                            <h3 className="font-semibold mb-2 flex items-center gap-2"><TruckIcon size={16} /> Pengiriman</h3>
                            <p><span className="text-green-700">Kurir:</span> {selectedOrder.shippingCourier || '—'}</p>
                            <p><span className="text-green-700">Ongkir:</span> {currency}{(selectedOrder.shippingCost || 0).toLocaleString('id-ID')}</p>
                            <p><span className="text-green-700">No. Resi:</span> {selectedOrder.trackingNumber || <span className="text-slate-400 italic">Belum diisi</span>}</p>
                        </div>

                        {/* Products */}
                        <div className="mb-4">
                            <h3 className="font-semibold mb-2">Produk</h3>
                            {selectedOrder.orderItems.map((item, i) => (
                                <div key={i} className="flex items-center gap-4 border border-slate-100 shadow rounded p-2 mb-2">
                                    <img src={item.product?.images?.[0]} alt="" className="w-14 h-14 object-cover rounded" />
                                    <div className="flex-1">
                                        <p className="text-slate-800">{item.product?.name}</p>
                                        <p>Qty: {item.quantity} — {currency}{item.price.toLocaleString('id-ID')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Total */}
                        <div className="p-3 bg-green-50 rounded-lg mb-4">
                            <p className="font-semibold text-lg text-green-800">Total: {currency}{selectedOrder.total.toLocaleString('id-ID')}</p>
                        </div>

                        <div className="flex justify-end">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-200 rounded hover:bg-slate-300">Tutup</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
