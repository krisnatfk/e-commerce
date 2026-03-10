'use client'
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import Image from "next/image"
import Loading from "@/components/Loading"
import { useAuth, useUser } from "@clerk/nextjs"
import axios from "axios"
import { PencilIcon, Trash2Icon, XIcon, SaveIcon } from "lucide-react"

const CATEGORIES = [
    "Electronics", "Fashion", "Food", "Health", "Sports",
    "Beauty", "Home", "Books", "Toys", "Automotive", "Other"
]

export default function StoreManageProducts() {

    const { getToken } = useAuth()
    const { user } = useUser()

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'Rp '

    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState([])
    const [editProduct, setEditProduct] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)

    const fetchProducts = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.get('/api/store/product', {
                headers: { Authorization: `Bearer ${token}` }
            })
            setProducts(data.products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message)
        }
        setLoading(false)
    }

    const toggleStock = async (productId) => {
        try {
            const token = await getToken()
            const { data } = await axios.post('/api/store/stock-toggle', { productId }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setProducts(prevProducts => prevProducts.map(product => product.id === productId ? { ...product, inStock: !product.inStock } : product))
            toast.success(data.message)
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message)
        }
    }

    const handleEdit = async () => {
        if (!editProduct) return
        try {
            const token = await getToken()
            const { data } = await axios.put('/api/store/product', {
                productId: editProduct.id,
                name: editProduct.name,
                description: editProduct.description,
                mrp: editProduct.mrp,
                price: editProduct.price,
                category: editProduct.category,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setProducts(prev => prev.map(p => p.id === editProduct.id ? { ...p, ...data.product } : p))
            setEditProduct(null)
            toast.success(data.message)
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
    }

    const handleDelete = async (productId) => {
        try {
            const token = await getToken()
            const { data } = await axios.delete(`/api/store/product?productId=${productId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (data.softDeleted) {
                setProducts(prev => prev.map(p => p.id === productId ? { ...p, inStock: false } : p))
            } else {
                setProducts(prev => prev.filter(p => p.id !== productId))
            }
            setDeleteConfirm(null)
            toast.success(data.message)
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
    }

    useEffect(() => {
        if (user) {
            fetchProducts()
        }
    }, [user])

    if (loading) return <Loading />

    return (
        <>
            <h1 className="text-2xl text-slate-500 mb-5">Manage <span className="text-slate-800 font-medium">Products</span></h1>
            <table className="w-full max-w-5xl text-left ring ring-slate-200 rounded overflow-hidden text-sm">
                <thead className="bg-slate-50 text-gray-700 uppercase tracking-wider">
                    <tr>
                        <th className="px-4 py-3">Produk</th>
                        <th className="px-4 py-3 hidden md:table-cell">Kategori</th>
                        <th className="px-4 py-3 hidden md:table-cell">MRP</th>
                        <th className="px-4 py-3">Harga</th>
                        <th className="px-4 py-3">Stok</th>
                        <th className="px-4 py-3">Aksi</th>
                    </tr>
                </thead>
                <tbody className="text-slate-700">
                    {products.map((product) => (
                        <tr key={product.id} className="border-t border-gray-200 hover:bg-gray-50">
                            <td className="px-4 py-3">
                                <div className="flex gap-2 items-center">
                                    <Image width={40} height={40} className='p-1 shadow rounded cursor-pointer' src={product.images[0]} alt="" />
                                    <div>
                                        <p className="font-medium text-sm">{product.name}</p>
                                        <p className="text-xs text-slate-400 hidden md:block truncate max-w-[200px]">{product.description}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                                <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full">{product.category}</span>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell line-through text-slate-400">{currency}{product.mrp.toLocaleString('id-ID')}</td>
                            <td className="px-4 py-3 font-medium">{currency}{product.price.toLocaleString('id-ID')}</td>
                            <td className="px-4 py-3">
                                <label className="relative inline-flex items-center cursor-pointer text-gray-900 gap-3">
                                    <input type="checkbox" className="sr-only peer" onChange={() => toast.promise(toggleStock(product.id), { loading: "Updating..." })} checked={product.inStock} />
                                    <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-green-600 transition-colors duration-200"></div>
                                    <span className="dot absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                                </label>
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setEditProduct({ ...product })}
                                        className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition"
                                        title="Edit Produk"
                                    >
                                        <PencilIcon size={15} />
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(product.id)}
                                        className="text-red-600 hover:bg-red-50 p-1.5 rounded transition"
                                        title="Hapus Produk"
                                    >
                                        <Trash2Icon size={15} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Edit Product Modal */}
            {editProduct && (
                <div onClick={() => setEditProduct(null)} className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-xs z-50">
                    <div onClick={e => e.stopPropagation()} className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
                        <button onClick={() => setEditProduct(null)} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600">
                            <XIcon size={20} />
                        </button>
                        <h2 className="text-lg font-semibold text-slate-800 mb-4">Edit Produk</h2>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-slate-500">Nama Produk</label>
                                <input
                                    type="text"
                                    value={editProduct.name}
                                    onChange={e => setEditProduct(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-400"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500">Deskripsi</label>
                                <textarea
                                    rows={3}
                                    value={editProduct.description}
                                    onChange={e => setEditProduct(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-slate-500">MRP (Harga Asli)</label>
                                    <input
                                        type="number"
                                        value={editProduct.mrp}
                                        onChange={e => setEditProduct(prev => ({ ...prev, mrp: Number(e.target.value) }))}
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-400"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500">Harga Jual</label>
                                    <input
                                        type="number"
                                        value={editProduct.price}
                                        onChange={e => setEditProduct(prev => ({ ...prev, price: Number(e.target.value) }))}
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-400"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500">Kategori</label>
                                <select
                                    value={editProduct.category}
                                    onChange={e => setEditProduct(prev => ({ ...prev, category: e.target.value }))}
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-400"
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-5">
                            <button onClick={() => setEditProduct(null)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 text-sm">
                                Batal
                            </button>
                            <button
                                onClick={() => toast.promise(handleEdit(), { loading: 'Menyimpan...' })}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center gap-1"
                            >
                                <SaveIcon size={14} /> Simpan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div onClick={() => setDeleteConfirm(null)} className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-xs z-50">
                    <div onClick={e => e.stopPropagation()} className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6 text-center">
                        <Trash2Icon size={32} className="mx-auto text-red-500 mb-3" />
                        <h2 className="text-lg font-semibold text-slate-800 mb-2">Hapus Produk?</h2>
                        <p className="text-sm text-slate-500 mb-5">
                            Produk yang sudah memiliki pesanan akan dinonaktifkan, bukan dihapus.
                        </p>
                        <div className="flex justify-center gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 text-sm">
                                Batal
                            </button>
                            <button
                                onClick={() => toast.promise(handleDelete(deleteConfirm), { loading: 'Menghapus...' })}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                            >
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}