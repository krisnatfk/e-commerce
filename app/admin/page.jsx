'use client'
import Loading from "@/components/Loading"
import OrdersAreaChart from "@/components/OrdersAreaChart"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import { CircleDollarSignIcon, ShoppingBasketIcon, TagsIcon, StarIcon, TrendingUpIcon, PackageIcon } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

export default function AdminDashboard() {

    const { getToken } = useAuth()
    const router = useRouter()
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'Rp '

    const [loading, setLoading] = useState(true)
    const [dashboardData, setDashboardData] = useState({
        products: 0,
        revenue: 0,
        orders: 0,
        allOrders: [],
        recentOrders: [],
        topProducts: [],
        recentReviews: [],
    })

    const dashboardCardsData = [
        { title: 'Total Produk', value: dashboardData.products, icon: ShoppingBasketIcon, color: 'bg-blue-50 text-blue-600' },
        { title: 'Pendapatan', value: currency + Number(dashboardData.revenue).toLocaleString('id-ID'), icon: CircleDollarSignIcon, color: 'bg-green-50 text-green-600' },
        { title: 'Total Pesanan', value: dashboardData.orders, icon: TagsIcon, color: 'bg-purple-50 text-purple-600' },
        { title: 'Total Review', value: dashboardData.recentReviews?.length || 0, icon: StarIcon, color: 'bg-amber-50 text-amber-600' },
    ]

    const fetchDashboardData = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.get('/api/admin/dashboard', {
                headers: { Authorization: `Bearer ${token}` }
            })
            setDashboardData(data.dashboardData)
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
        setLoading(false)
    }

    useEffect(() => { fetchDashboardData() }, [])

    if (loading) return <Loading />

    return (
        <div className="text-slate-500 mb-10">
            <h1 className="text-2xl">Admin <span className="text-slate-800 font-medium">Dashboard</span></h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-6">
                {dashboardCardsData.map((card, index) => (
                    <div key={index} className="flex items-center gap-4 border border-slate-200 p-4 rounded-xl hover:shadow-md transition-shadow bg-white">
                        <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center`}>
                            <card.icon size={22} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">{card.title}</p>
                            <b className="text-xl font-semibold text-slate-700">{card.value}</b>
                        </div>
                    </div>
                ))}
            </div>

            {/* Chart */}
            <div className="mb-8">
                <OrdersAreaChart allOrders={dashboardData.allOrders} />
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 mb-8">
                <button onClick={() => router.push('/admin/add-product')} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition">
                    <PackageIcon size={16} /> Tambah Produk
                </button>
                <button onClick={() => router.push('/admin/orders')} className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 text-sm transition">
                    <TagsIcon size={16} /> Lihat Pesanan
                </button>
                <button onClick={() => router.push('/admin/manage-product')} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm transition">
                    <TrendingUpIcon size={16} /> Kelola Produk
                </button>
            </div>

            {/* Recent Orders */}
            {dashboardData.recentOrders && dashboardData.recentOrders.length > 0 && (
                <div className="mb-8">
                    <h2 className="font-medium text-slate-700 mb-3">Pesanan Terbaru</h2>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left">Pelanggan</th>
                                    <th className="px-4 py-3 text-left">Total</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Tanggal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dashboardData.recentOrders.map((order, i) => (
                                    <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                                        <td className="px-4 py-3 text-slate-700">{order.user?.name || '—'}</td>
                                        <td className="px-4 py-3 font-medium">{currency}{order.total.toLocaleString('id-ID')}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-1 rounded-full ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-700'
                                                : order.status === 'SHIPPED' ? 'bg-indigo-100 text-indigo-700'
                                                    : order.status === 'CANCELLED' ? 'bg-red-100 text-red-700'
                                                        : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {order.status === 'ORDER_PLACED' ? 'Baru' : order.status === 'PROCESSING' ? 'Proses' : order.status === 'SHIPPED' ? 'Kirim' : order.status === 'DELIVERED' ? 'Selesai' : 'Batal'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-400 text-xs">{new Date(order.createdAt).toLocaleDateString('id-ID')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Recent Reviews */}
            {dashboardData.recentReviews && dashboardData.recentReviews.length > 0 && (
                <div>
                    <h2 className="font-medium text-slate-700 mb-3">Review Terbaru</h2>
                    <div className="space-y-3">
                        {dashboardData.recentReviews.map((review, i) => (
                            <div key={i} className="flex items-start gap-4 border border-slate-100 rounded-xl p-4 bg-white">
                                <Image src={review.user?.image} alt="" className="w-10 h-10 rounded-full" width={40} height={40} />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-medium text-sm text-slate-700">{review.user?.name}</p>
                                        <div className="flex">
                                            {Array(5).fill('').map((_, idx) => (
                                                <StarIcon key={idx} size={12} className="text-transparent" fill={review.rating >= idx + 1 ? "#16a34a" : "#d1d5db"} />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400">{review.product?.name}</p>
                                    {review.review && <p className="text-sm text-slate-500 mt-1">{review.review}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}