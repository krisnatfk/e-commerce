'use client'
import PageTitle from "@/components/PageTitle"
import { useEffect, useState } from "react";
import OrderItem from "@/components/OrderItem";
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Loading from "@/components/Loading";

const TABS = [
    { key: 'ALL', label: 'Semua' },
    { key: 'UNPAID', label: 'Belum Bayar' },
    { key: 'ORDER_PLACED', label: 'Diproses' },
    { key: 'SHIPPED', label: 'Dikirim' },
    { key: 'DELIVERED', label: 'Selesai' },
    { key: 'CANCELLED', label: 'Dibatalkan' },
];

export default function Orders() {

    const { getToken } = useAuth()
    const { user, isLoaded } = useUser()

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('ALL')
    const router = useRouter()

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const token = await getToken()
                // Trigger auto-cancel for expired orders (non-blocking)
                axios.get('/api/orders/auto-cancel').catch(() => { })
                const { data } = await axios.get('/api/orders', {
                    headers: { Authorization: `Bearer ${token}` }
                })
                setOrders(data.orders)
                setLoading(false)
            } catch (error) {
                toast.error(error?.response?.data?.error || error.message)
                setLoading(false)
            }
        }
        if (isLoaded) {
            if (user) {
                fetchOrders()
            } else {
                router.push('/')
            }
        }
    }, [isLoaded, user, getToken, router]);

    const filteredOrders = orders.filter(order => {
        if (activeTab === 'ALL') return true
        if (activeTab === 'UNPAID') return !order.isPaid && order.paymentMethod === 'MIDTRANS' && order.status !== 'CANCELLED'
        return order.status === activeTab
    })

    if (!isLoaded || loading) {
        return <Loading />
    }

    return (
        <div className="min-h-[70vh] mx-6">
            <div className="my-10 sm:my-20 max-w-4xl mx-auto">
                <PageTitle heading="Pesanan Saya" text={`Total ${orders.length} pesanan`} linkText={'Kembali ke beranda'} />

                {/* Filter Tabs */}
                <div className="flex gap-1 overflow-x-auto pb-2 mb-6 border-b border-slate-200">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-2 text-sm rounded-t-lg whitespace-nowrap transition-all
                                ${activeTab === tab.key
                                    ? 'bg-slate-700 text-white font-medium'
                                    : 'text-slate-500 hover:bg-slate-100'
                                }`}
                        >
                            {tab.label}
                            {tab.key === 'UNPAID' && orders.filter(o => !o.isPaid && o.paymentMethod === 'MIDTRANS' && o.status !== 'CANCELLED').length > 0 && (
                                <span className="ml-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                    {orders.filter(o => !o.isPaid && o.paymentMethod === 'MIDTRANS' && o.status !== 'CANCELLED').length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Orders List */}
                {filteredOrders.length > 0 ? (
                    <div className="space-y-2">
                        {filteredOrders.map((order) => (
                            <OrderItem order={order} key={order.id} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <p className="text-lg font-medium">Tidak ada pesanan</p>
                        <p className="text-sm mt-1">
                            {activeTab === 'ALL' ? 'Kamu belum memiliki pesanan' : `Tidak ada pesanan dengan status "${TABS.find(t => t.key === activeTab)?.label}"`}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}