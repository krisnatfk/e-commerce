'use client'
import Image from "next/image";
import { PackageIcon, TruckIcon, CheckCircleIcon, XCircleIcon, ClockIcon, CreditCardIcon, Loader2Icon } from "lucide-react";
import { useSelector } from "react-redux";
import Rating from "./Rating";
import { useState } from "react";
import RatingModal from "./RatingModal";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const STATUS_CONFIG = {
    ORDER_PLACED: { label: "Pesanan Dibuat", color: "text-blue-600 bg-blue-50", icon: PackageIcon },
    PROCESSING: { label: "Diproses", color: "text-yellow-600 bg-yellow-50", icon: ClockIcon },
    SHIPPED: { label: "Dikirim", color: "text-indigo-600 bg-indigo-50", icon: TruckIcon },
    DELIVERED: { label: "Selesai", color: "text-green-600 bg-green-50", icon: CheckCircleIcon },
    CANCELLED: { label: "Dibatalkan", color: "text-red-600 bg-red-50", icon: XCircleIcon },
};

const OrderItem = ({ order }) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'Rp ';
    const [ratingModal, setRatingModal] = useState(null);
    const [payLoading, setPayLoading] = useState(false);
    const { getToken } = useAuth();
    const router = useRouter();

    const { ratings } = useSelector(state => state.rating);

    const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.ORDER_PLACED;
    const StatusIcon = statusConfig.icon;

    // Payment deadline: 24 hours after creation
    const deadline = new Date(new Date(order.createdAt).getTime() + 24 * 60 * 60 * 1000);
    const isExpired = new Date() > deadline;
    const isMidtrans = order.paymentMethod === 'MIDTRANS';
    const isCod = order.paymentMethod === 'COD';
    const isUnpaid = !order.isPaid && isMidtrans && order.status !== 'CANCELLED';

    // Handle pay now button
    const handlePayNow = async () => {
        try {
            setPayLoading(true);
            const token = await getToken();
            const { data } = await axios.post('/api/orders/pay', { orderId: order.id }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (window.snap && data.token) {
                window.snap.pay(data.token, {
                    onSuccess: async function () {
                        // Mark order as paid in database
                        try {
                            await axios.post('/api/orders/confirm-payment',
                                { orderIds: [order.id] },
                                { headers: { Authorization: `Bearer ${token}` } }
                            );
                        } catch (e) { console.error('confirm-payment error', e); }
                        toast.success("Pembayaran berhasil! 🎉");
                        window.location.reload();
                    },
                    onPending: function () {
                        toast("Pembayaran pending, menunggu konfirmasi...");
                    },
                    onError: function () {
                        toast.error("Pembayaran gagal");
                    },
                    onClose: function () {
                        toast("Popup pembayaran ditutup");
                    }
                });
            } else {
                toast.error("Midtrans Snap tidak tersedia");
            }
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message);
        } finally {
            setPayLoading(false);
        }
    };

    return (
        <>
            <div className="border border-slate-200 rounded-xl p-4 sm:p-5 mb-4 bg-white shadow-sm hover:shadow-md transition-shadow">

                {/* Header: Order ID + Date */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>Order #{order.id.slice(-8).toUpperCase()}</span>
                        <span>•</span>
                        <span>{new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {/* Order Status Badge */}
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${statusConfig.color}`}>
                        <StatusIcon size={12} />
                        {statusConfig.label}
                    </span>
                </div>

                {/* Payment Info Bar */}
                <div className="flex flex-wrap items-center gap-2 mb-4 text-sm">
                    {isMidtrans && (
                        <>
                            <span className="text-slate-500">Pembayaran: <strong className="text-slate-700">Transfer (Midtrans)</strong></span>
                            <span className="text-slate-300">|</span>
                            {order.status === 'CANCELLED' ? (
                                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-red-50 text-red-600">❌ Dibatalkan</span>
                            ) : order.isPaid ? (
                                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-green-50 text-green-600">✅ Sudah Bayar</span>
                            ) : (
                                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-orange-50 text-orange-600">⏳ Belum Bayar</span>
                            )}
                        </>
                    )}
                    {isCod && (
                        <>
                            <span className="text-slate-500">Pembayaran: <strong className="text-slate-700">Bayar di Tempat (COD)</strong></span>
                            <span className="text-slate-300">|</span>
                            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-amber-50 text-amber-600">💵 Bayar saat diterima</span>
                        </>
                    )}
                </div>

                {/* Products */}
                <div className="flex flex-col gap-3 mb-4">
                    {order.orderItems.map((item, index) => (
                        <div key={index} className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-slate-100 flex items-center justify-center rounded-lg flex-shrink-0 overflow-hidden">
                                <Image
                                    className="h-12 w-auto object-contain"
                                    src={item.product.images[0]}
                                    alt="product_img"
                                    width={50}
                                    height={50}
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-700 text-sm truncate">{item.product.name}</p>
                                <p className="text-xs text-slate-400">{item.quantity}x {currency}{item.price.toLocaleString('id-ID')}</p>
                            </div>
                            <div>
                                {ratings.find(r => order.id === r.orderId && item.product.id === r.productId)
                                    ? <Rating value={ratings.find(r => order.id === r.orderId && item.product.id === r.productId).rating} />
                                    : order.status === "DELIVERED" && (
                                        <button onClick={() => setRatingModal({ orderId: order.id, productId: item.product.id })} className="text-xs text-green-600 hover:bg-green-50 px-2 py-1 rounded transition">
                                            ⭐ Beri Rating
                                        </button>
                                    )
                                }
                            </div>
                        </div>
                    ))}
                </div>

                {/* PAY NOW BUTTON for unpaid MIDTRANS orders */}
                {isUnpaid && !isExpired && (
                    <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-medium text-orange-800">⏳ Menunggu Pembayaran via Transfer</p>
                                <p className="text-xs text-orange-600">
                                    Bayar sebelum {deadline.toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} atau pesanan dibatalkan otomatis.
                                </p>
                            </div>
                            <button
                                onClick={handlePayNow}
                                disabled={payLoading}
                                className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg text-sm transition-all active:scale-95 disabled:opacity-50"
                            >
                                {payLoading ? (
                                    <><Loader2Icon size={16} className="animate-spin" /> Memproses...</>
                                ) : (
                                    <><CreditCardIcon size={16} /> Bayar Sekarang</>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Expired unpaid notice */}
                {isUnpaid && isExpired && order.status !== 'CANCELLED' && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">❌ Batas waktu pembayaran telah lewat. Pesanan akan dibatalkan otomatis.</p>
                    </div>
                )}

                {/* Footer info */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <div className="text-sm">
                        <span className="text-slate-400">Total: </span>
                        <span className="font-semibold text-slate-700">{currency}{order.total.toLocaleString('id-ID')}</span>
                        {order.shippingCourier && (
                            <span className="text-xs text-slate-400 ml-2">via {order.shippingCourier}</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Tracking Number */}
                        {order.trackingNumber && (
                            <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-medium">
                                📦 Resi: {order.trackingNumber}
                            </span>
                        )}
                    </div>
                </div>

                {/* Address (collapsible) */}
                <details className="mt-3 text-xs text-slate-400">
                    <summary className="cursor-pointer hover:text-slate-600 transition">Lihat Alamat Pengiriman</summary>
                    <p className="mt-1">{order.address.name} — {order.address.street}, {order.address.city}, {order.address.state} {order.address.zip}, {order.address.country}</p>
                    <p>{order.address.phone}</p>
                </details>
            </div>

            {ratingModal && <RatingModal ratingModal={ratingModal} setRatingModal={setRatingModal} />}
        </>
    )
}

export default OrderItem