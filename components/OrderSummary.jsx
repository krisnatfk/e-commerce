import { PlusIcon, SquarePenIcon, XIcon, TruckIcon, Loader2Icon } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import AddressModal from './AddressModal';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Protect, useAuth, useUser } from '@clerk/nextjs';
import axios from 'axios';
import { fetchCart } from '@/lib/features/cart/cartSlice';

const COURIERS = [
    { code: 'jne', name: 'JNE' },
    { code: 'tiki', name: 'TIKI' },
    { code: 'pos', name: 'POS Indonesia' },
    { code: 'sicepat', name: 'SiCepat' },
    { code: 'anteraja', name: 'AnterAja' },
];

const OrderSummary = ({ totalPrice, items }) => {

    const { user } = useUser()
    const { getToken } = useAuth()
    const dispatch = useDispatch()

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'Rp ';

    const router = useRouter();

    const addressList = useSelector(state => state.address.list);

    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [couponCodeInput, setCouponCodeInput] = useState('');
    const [coupon, setCoupon] = useState('');

    // Shipping states
    const [selectedCourier, setSelectedCourier] = useState('');
    const [shippingOptions, setShippingOptions] = useState([]);
    const [selectedShipping, setSelectedShipping] = useState(null);
    const [loadingShipping, setLoadingShipping] = useState(false);

    // Calculate total weight (assume 500g per item if no weight field)
    const totalWeight = items.reduce((acc, item) => acc + (item.weight || 500) * item.quantity, 0);

    // Fetch shipping cost when address and courier are selected
    useEffect(() => {
        if (selectedAddress?.city && selectedCourier) {
            fetchShippingCost();
        } else {
            setShippingOptions([]);
            setSelectedShipping(null);
        }
    }, [selectedAddress, selectedCourier]);

    const fetchShippingCost = async () => {
        try {
            setLoadingShipping(true);
            setSelectedShipping(null);
            const { data } = await axios.post('/api/shipping/cost', {
                destination: selectedAddress.city,
                weight: totalWeight,
                courier: selectedCourier,
            });

            // Binderbyte returns array of shipping options
            const costs = data.results || [];
            setShippingOptions(costs);
            if (costs.length > 0) {
                setSelectedShipping(costs[0]);
            }
        } catch (error) {
            console.error('Shipping cost error:', error);
            toast.error('Gagal menghitung ongkir. Coba kurir lain.');
            setShippingOptions([]);
        } finally {
            setLoadingShipping(false);
        }
    };

    // Binderbyte format: { service: "REG", description: "Regular", cost: 18000, etd: "1-2" }
    const shippingCost = selectedShipping?.cost || 0;
    const shippingEtd = selectedShipping?.etd || '';

    const handleCouponCode = async (event) => {
        event.preventDefault();
        try {
            if (!user) {
                return toast('Silakan masuk untuk melanjutkan')
            }
            const token = await getToken();
            const { data } = await axios.post('/api/coupon', { code: couponCodeInput }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setCoupon(data.coupon)
            toast.success('Kupon berhasil diterapkan')
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }

    }

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        try {
            if (!user) {
                return toast('Silakan masuk untuk memesan!')
            }
            if (!selectedAddress) {
                return toast('Silakan pilih alamat')
            }
            const token = await getToken();

            const orderData = {
                addressId: selectedAddress.id,
                items,
                paymentMethod,
                shippingCost: shippingCost,
                shippingCourier: selectedCourier ? `${selectedCourier.toUpperCase()} - ${selectedShipping?.service || ''}` : '',
            }

            if (coupon) {
                orderData.couponCode = coupon.code
            }

            // create order
            const { data } = await axios.post('/api/orders', orderData, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (paymentMethod === 'MIDTRANS') {
                if (window.snap) {
                    window.snap.pay(data.token, {
                        onSuccess: async function (result) {
                            // Mark orders as paid in database
                            try {
                                await axios.post('/api/orders/confirm-payment',
                                    { orderIds: data.orderIds },
                                    { headers: { Authorization: `Bearer ${token}` } }
                                );
                            } catch (e) { console.error('confirm-payment error', e); }
                            toast.success("Pembayaran berhasil!");
                            router.push('/orders');
                            dispatch(fetchCart({ getToken }));
                        },
                        onPending: async function (result) {
                            toast("Pembayaran pending, menunggu konfirmasi...");
                            router.push('/orders');
                            dispatch(fetchCart({ getToken }));
                        },
                        onError: function (result) {
                            toast.error("Pembayaran gagal!");
                        },
                        onClose: function () {
                            toast('Pembayaran ditutup tanpa menyelesaikan proses');
                            router.push('/orders');
                            dispatch(fetchCart({ getToken }));
                        }
                    });
                } else {
                    toast.error("Midtrans Snap is not loaded.");
                }
            } else {
                toast.success(data.message)
                router.push('/orders')
                dispatch(fetchCart({ getToken }))
            }

        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }


    }

    return (
        <div className='w-full max-w-lg lg:max-w-[380px] bg-slate-50/30 border border-slate-200 text-slate-500 text-sm rounded-xl p-7'>
            <h2 className='text-xl font-medium text-slate-600'>Ringkasan Pembayaran</h2>
            <p className='text-slate-400 text-xs my-4'>Metode Pembayaran</p>
            <div className='flex gap-2 items-center'>
                <input type="radio" id="COD" name="payment" onChange={() => setPaymentMethod('COD')} checked={paymentMethod === 'COD'} className='accent-gray-500' />
                <label htmlFor="COD" className='cursor-pointer'>Bayar di Tempat (COD)</label>
            </div>
            <div className='flex gap-2 items-center mt-1'>
                <input type="radio" id="MIDTRANS" name='payment' onChange={() => setPaymentMethod('MIDTRANS')} checked={paymentMethod === 'MIDTRANS'} className='accent-gray-500' />
                <label htmlFor="MIDTRANS" className='cursor-pointer'>Midtrans (QRIS/Transfer/E-Wallet)</label>
            </div>
            <div className='my-4 py-4 border-y border-slate-200 text-slate-400'>
                <p>Alamat</p>
                {
                    selectedAddress ? (
                        <div className='flex gap-2 items-center'>
                            <p>{selectedAddress.name}, {selectedAddress.city}, {selectedAddress.state}, {selectedAddress.zip}</p>
                            <SquarePenIcon onClick={() => { setSelectedAddress(null); setSelectedCourier(''); setShippingOptions([]); setSelectedShipping(null); }} className='cursor-pointer' size={18} />
                        </div>
                    ) : (
                        <div>
                            {
                                addressList.length > 0 && (
                                    <select className='border border-slate-400 p-2 w-full my-3 outline-none rounded' onChange={(e) => setSelectedAddress(addressList[e.target.value])} >
                                        <option value="">Pilih Alamat</option>
                                        {
                                            addressList.map((address, index) => (
                                                <option key={index} value={index}>{address.name}, {address.city}, {address.state}, {address.zip}</option>
                                            ))
                                        }
                                    </select>
                                )
                            }
                            <button className='flex items-center gap-1 text-slate-600 mt-1' onClick={() => setShowAddressModal(true)} >Tambah Alamat <PlusIcon size={18} /></button>
                        </div>
                    )
                }
            </div>

            {/* Shipping / Ongkir Section */}
            <Protect plan={'plus'} fallback={
                <div className='pb-4 border-b border-slate-200'>
                    <div className='flex items-center gap-2 mb-3'>
                        <TruckIcon size={16} className='text-slate-500' />
                        <p className='text-slate-500 font-medium'>Pengiriman</p>
                    </div>

                    {selectedAddress ? (
                        <>
                            {/* Courier Selection */}
                            <div className='mb-3'>
                                <select
                                    className='border border-slate-400 p-2 w-full outline-none rounded text-sm'
                                    value={selectedCourier}
                                    onChange={(e) => setSelectedCourier(e.target.value)}
                                >
                                    <option value="">Pilih Kurir</option>
                                    {COURIERS.map(c => (
                                        <option key={c.code} value={c.code}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Shipping Options */}
                            {loadingShipping && (
                                <div className='flex items-center gap-2 text-xs text-slate-400'>
                                    <Loader2Icon size={14} className='animate-spin' />
                                    <p>Menghitung ongkir...</p>
                                </div>
                            )}

                            {!loadingShipping && shippingOptions.length > 0 && (
                                <div className='space-y-2'>
                                    {shippingOptions.map((option, idx) => (
                                        <label key={idx} className={`flex items-center justify-between p-2 rounded border cursor-pointer text-xs ${selectedShipping?.service === option.service ? 'border-slate-600 bg-slate-50' : 'border-slate-200'}`}>
                                            <div className='flex items-center gap-2'>
                                                <input
                                                    type="radio"
                                                    name="shipping"
                                                    checked={selectedShipping?.service === option.service}
                                                    onChange={() => setSelectedShipping(option)}
                                                    className='accent-gray-500'
                                                />
                                                <div>
                                                    <p className='font-medium text-slate-600'>{option.service}</p>
                                                    <p className='text-slate-400'>{option.description}</p>
                                                    {option.etd && (
                                                        <p className='text-slate-400'>Est: {option.etd} hari</p>
                                                    )}
                                                </div>
                                            </div>
                                            <p className='font-medium text-slate-600'>{currency}{(option.cost || 0).toLocaleString('id-ID')}</p>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <p className='text-xs text-slate-400'>Pilih alamat terlebih dahulu untuk menghitung ongkir</p>
                    )}
                </div>
            }>
                <div className='pb-4 border-b border-slate-200'>
                    <div className='flex items-center gap-2 text-green-600'>
                        <TruckIcon size={16} />
                        <p className='font-medium text-sm'>🎉 Gratis Ongkir (Anggota Plus)</p>
                    </div>
                </div>
            </Protect>

            {/* Price Summary */}
            <div className='py-4 border-b border-slate-200'>
                <div className='flex justify-between'>
                    <div className='flex flex-col gap-1 text-slate-400'>
                        <p>Subtotal:</p>
                        <p>Ongkir:</p>
                        {coupon && <p>Kupon:</p>}
                    </div>
                    <div className='flex flex-col gap-1 font-medium text-right'>
                        <p>{currency}{totalPrice.toLocaleString('id-ID')}</p>
                        <p>
                            <Protect plan={'plus'} fallback={
                                shippingCost > 0 ? `${currency}${shippingCost.toLocaleString('id-ID')}` : 'Pilih kurir'
                            }>
                                Gratis
                            </Protect>
                        </p>
                        {coupon && <p>{`-${currency}${((coupon.discount / 100) * totalPrice).toLocaleString('id-ID')}`}</p>}
                    </div>
                </div>
                {
                    !coupon ? (
                        <form onSubmit={e => toast.promise(handleCouponCode(e), { loading: 'Memeriksa kupon...' })} className='flex justify-center gap-3 mt-3'>
                            <input onChange={(e) => setCouponCodeInput(e.target.value)} value={couponCodeInput} type="text" placeholder='Kode Kupon' className='border border-slate-400 p-1.5 rounded w-full outline-none' />
                            <button className='bg-slate-600 text-white px-3 rounded hover:bg-slate-800 active:scale-95 transition-all'>Pakai</button>
                        </form>
                    ) : (
                        <div className='w-full flex items-center justify-center gap-2 text-xs mt-2'>
                            <p>Kode: <span className='font-semibold ml-1'>{coupon.code.toUpperCase()}</span></p>
                            <p>{coupon.description}</p>
                            <XIcon size={18} onClick={() => setCoupon('')} className='hover:text-red-700 transition cursor-pointer' />
                        </div>
                    )
                }
            </div>
            <div className='flex justify-between py-4'>
                <p>Total:</p>
                <p className='font-medium text-right'>
                    <Protect plan={'plus'} fallback={`${currency}${coupon ? (totalPrice + shippingCost - (coupon.discount / 100 * totalPrice)).toLocaleString('id-ID') : (totalPrice + shippingCost).toLocaleString('id-ID')}`}>
                        {currency}{coupon ? (totalPrice - (coupon.discount / 100 * totalPrice)).toLocaleString('id-ID') : totalPrice.toLocaleString('id-ID')}
                    </Protect>
                </p>
            </div>

            {shippingEtd && (
                <p className='text-xs text-slate-400 mb-3'>
                    Estimasi pengiriman: {shippingEtd} hari kerja
                </p>
            )}

            <button onClick={e => toast.promise(handlePlaceOrder(e), { loading: 'Memproses pesanan...' })} className='w-full bg-slate-700 text-white py-2.5 rounded hover:bg-slate-900 active:scale-95 transition-all'>Pesan Sekarang</button>

            {showAddressModal && <AddressModal setShowAddressModal={setShowAddressModal} />}

        </div>
    )
}

export default OrderSummary