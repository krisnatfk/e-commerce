'use client'
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import Image from "next/image"
import Loading from "@/components/Loading"
import { useAuth, useUser } from "@clerk/nextjs"
import axios from "axios"
import { PencilIcon, Trash2Icon, XIcon, SaveIcon, ImagePlusIcon } from "lucide-react"

const CATEGORIES = [
    "Electronics", "Clothing", "Home & Kitchen", "Beauty & Health",
    "Toys & Games", "Sports & Outdoors", "Books & Media", "Food & Drink",
    "Hobbies & Crafts", "Others"
]

export default function AdminManageProducts() {

    const { getToken } = useAuth()
    const { user } = useUser()
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'Rp '

    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState([])
    const [editProduct, setEditProduct] = useState(null)
    const [newImages, setNewImages] = useState([])  // File objects for new uploads
    const [deleteConfirm, setDeleteConfirm] = useState(null)

    const fetchProducts = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.get('/api/admin/product', {
                headers: { Authorization: `Bearer ${token}` }
            })
            setProducts(data.products)
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
        setLoading(false)
    }

    const toggleStock = async (productId) => {
        try {
            const token = await getToken()
            const { data } = await axios.post('/api/admin/stock-toggle', { productId }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setProducts(prev => prev.map(p => p.id === productId ? { ...p, inStock: !p.inStock } : p))
            toast.success(data.message)
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
    }

    const openEditModal = (product) => {
        setEditProduct({
            ...product,
            existingImages: [...(product.images || [])],  // URLs to keep
        })
        setNewImages([])  // reset new files
    }

    const removeExistingImage = (index) => {
        setEditProduct(prev => ({
            ...prev,
            existingImages: prev.existingImages.filter((_, i) => i !== index)
        }))
    }

    const handleNewImageFiles = (e) => {
        const files = Array.from(e.target.files)
        setNewImages(prev => [...prev, ...files])
    }

    const removeNewImage = (index) => {
        setNewImages(prev => prev.filter((_, i) => i !== index))
    }

    const handleEdit = async () => {
        if (!editProduct) return
        if (editProduct.existingImages.length === 0 && newImages.length === 0) {
            return toast.error('Produk harus memiliki minimal 1 gambar')
        }
        try {
            const token = await getToken()
            const formData = new FormData()
            formData.append('productId', editProduct.id)
            formData.append('name', editProduct.name)
            formData.append('description', editProduct.description)
            formData.append('mrp', editProduct.mrp)
            formData.append('price', editProduct.price)
            formData.append('category', editProduct.category)
            formData.append('existingImages', JSON.stringify(editProduct.existingImages))
            newImages.forEach(file => formData.append('images', file))

            const { data } = await axios.put('/api/admin/product', formData, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setProducts(prev => prev.map(p => p.id === editProduct.id ? { ...p, ...data.product } : p))
            setEditProduct(null)
            setNewImages([])
            toast.success(data.message)
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
    }

    const handleDelete = async (productId) => {
        try {
            const token = await getToken()
            const { data } = await axios.delete(`/api/admin/product?productId=${productId}`, {
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
        if (user) fetchProducts()
    }, [user])

    if (loading) return <Loading />

    return (
        <>
            <h1 className="text-2xl text-slate-500 mb-5">Kelola <span className="text-slate-800 font-medium">Produk</span></h1>

            {products.length === 0 ? (
                <p className="text-slate-400 text-center py-12">Belum ada produk. Tambahkan produk baru dari menu "Tambah Produk".</p>
            ) : (
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
                                        <Image width={40} height={40} className='p-1 shadow rounded' src={product.images[0]} alt="" />
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
                                    <label className="relative inline-flex items-center cursor-pointer gap-3">
                                        <input type="checkbox" className="sr-only peer" onChange={() => toast.promise(toggleStock(product.id), { loading: "Updating..." })} checked={product.inStock} />
                                        <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-green-600 transition-colors"></div>
                                        <span className="dot absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></span>
                                    </label>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => openEditModal(product)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition" title="Edit">
                                            <PencilIcon size={15} />
                                        </button>
                                        <button onClick={() => setDeleteConfirm(product.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded transition" title="Hapus">
                                            <Trash2Icon size={15} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Edit Modal */}
            {editProduct && (
                <div onClick={() => { setEditProduct(null); setNewImages([]) }} className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-xs z-50">
                    <div onClick={e => e.stopPropagation()} className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
                        <button onClick={() => { setEditProduct(null); setNewImages([]) }} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"><XIcon size={20} /></button>
                        <h2 className="text-lg font-semibold text-slate-800 mb-4">Edit Produk</h2>
                        <div className="space-y-3">

                            {/* --- Image Section --- */}
                            <div>
                                <label className="text-xs text-slate-500 font-medium">Gambar Produk</label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {/* Existing images with remove button */}
                                    {editProduct.existingImages.map((url, i) => (
                                        <div key={`existing-${i}`} className="relative group">
                                            <img src={url} alt="" className="w-16 h-16 object-cover rounded border border-slate-200" />
                                            <button onClick={() => removeExistingImage(i)}
                                                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition">
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                    {/* New image previews with remove button */}
                                    {newImages.map((file, i) => (
                                        <div key={`new-${i}`} className="relative group">
                                            <img src={URL.createObjectURL(file)} alt="" className="w-16 h-16 object-cover rounded border-2 border-green-300" />
                                            <button onClick={() => removeNewImage(i)}
                                                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition">
                                                ✕
                                            </button>
                                            <span className="absolute bottom-0 left-0 right-0 bg-green-600 text-white text-[9px] text-center">Baru</span>
                                        </div>
                                    ))}
                                    {/* Add button */}
                                    <label className="w-16 h-16 border-2 border-dashed border-slate-300 rounded flex items-center justify-center cursor-pointer hover:border-green-400 transition">
                                        <ImagePlusIcon size={20} className="text-slate-400" />
                                        <input type="file" accept="image/*" multiple onChange={handleNewImageFiles} hidden />
                                    </label>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">Hover foto lalu klik ✕ untuk hapus. Klik + untuk tambah foto baru.</p>
                            </div>

                            <div>
                                <label className="text-xs text-slate-500">Nama Produk</label>
                                <input type="text" value={editProduct.name} onChange={e => setEditProduct(prev => ({ ...prev, name: e.target.value }))} className="w-full border border-slate-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-400" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500">Deskripsi</label>
                                <textarea rows={3} value={editProduct.description} onChange={e => setEditProduct(prev => ({ ...prev, description: e.target.value }))} className="w-full border border-slate-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-slate-500">MRP (Harga Asli)</label>
                                    <input type="number" value={editProduct.mrp} onChange={e => setEditProduct(prev => ({ ...prev, mrp: Number(e.target.value) }))} className="w-full border border-slate-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-400" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500">Harga Jual</label>
                                    <input type="number" value={editProduct.price} onChange={e => setEditProduct(prev => ({ ...prev, price: Number(e.target.value) }))} className="w-full border border-slate-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-400" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500">Kategori</label>
                                <select value={editProduct.category} onChange={e => setEditProduct(prev => ({ ...prev, category: e.target.value }))} className="w-full border border-slate-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-400">
                                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-5">
                            <button onClick={() => { setEditProduct(null); setNewImages([]) }} className="px-4 py-2 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 text-sm">Batal</button>
                            <button onClick={() => toast.promise(handleEdit(), { loading: 'Menyimpan...' })} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center gap-1">
                                <SaveIcon size={14} /> Simpan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteConfirm && (
                <div onClick={() => setDeleteConfirm(null)} className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-xs z-50">
                    <div onClick={e => e.stopPropagation()} className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6 text-center">
                        <Trash2Icon size={32} className="mx-auto text-red-500 mb-3" />
                        <h2 className="text-lg font-semibold text-slate-800 mb-2">Hapus Produk?</h2>
                        <p className="text-sm text-slate-500 mb-5">Produk dengan pesanan terkait akan dinonaktifkan.</p>
                        <div className="flex justify-center gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 text-sm">Batal</button>
                            <button onClick={() => toast.promise(handleDelete(deleteConfirm), { loading: 'Menghapus...' })} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">Ya, Hapus</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
