'use client'
import { addAddress } from "@/lib/features/address/addressSlice"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import { XIcon, SearchIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import { useDispatch } from "react-redux"

const AddressModal = ({ setShowAddressModal }) => {

    const { getToken } = useAuth()
    const dispatch = useDispatch()

    const [cities, setCities] = useState([])
    const [citySearch, setCitySearch] = useState('')
    const [showCityDropdown, setShowCityDropdown] = useState(false)
    const [address, setAddress] = useState({
        name: '',
        email: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'Indonesia',
        phone: ''
    })

    useEffect(() => {
        const fetchCities = async () => {
            try {
                const { data } = await axios.get('/api/shipping/cities')
                setCities(data.cities || [])
            } catch (error) {
                console.error('Failed to fetch cities:', error)
            }
        }
        fetchCities()
    }, [])

    const filteredCities = cities.filter(city =>
        city.toLowerCase().includes(citySearch.toLowerCase())
    ).slice(0, 15)

    const handleCitySelect = (city) => {
        setAddress({
            ...address,
            city: city,
        })
        setCitySearch(city)
        setShowCityDropdown(false)
    }

    const handleAddressChange = (e) => {
        setAddress({
            ...address,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (!address.city) {
                return toast.error('Pilih kota dari dropdown')
            }
            const token = await getToken()
            const { data } = await axios.post('/api/address', { address }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            dispatch(addAddress(data.newAddress))
            toast.success(data.message)
            setShowAddressModal(false)
        } catch (error) {
            console.log(error)
            toast.error(error?.response?.data?.message || error.message)
        }
    }

    return (
        <form onSubmit={e => toast.promise(handleSubmit(e), { loading: 'Menyimpan alamat...' })} className="fixed inset-0 z-50 bg-white/60 backdrop-blur h-screen flex items-center justify-center">
            <div className="flex flex-col gap-4 text-slate-700 w-full max-w-sm mx-6 max-h-[90vh] overflow-y-auto">
                <h2 className='text-3xl '>Tambah <span className="font-semibold">Alamat Baru</span></h2>
                <input name="name" onChange={handleAddressChange} value={address.name} className="p-2 px-4 outline-none border border-slate-200 rounded w-full" type="text" placeholder="Nama lengkap" required />
                <input name="email" onChange={handleAddressChange} value={address.email} className="p-2 px-4 outline-none border border-slate-200 rounded w-full" type="email" placeholder="Alamat email" required />
                <input name="street" onChange={handleAddressChange} value={address.street} className="p-2 px-4 outline-none border border-slate-200 rounded w-full" type="text" placeholder="Jalan / Alamat lengkap" required />

                {/* City Search - Binderbyte uses city names */}
                <div className="relative">
                    <div className="flex items-center border border-slate-200 rounded">
                        <SearchIcon size={16} className="ml-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari kota..."
                            value={citySearch}
                            onChange={(e) => {
                                setCitySearch(e.target.value)
                                setShowCityDropdown(true)
                                // Also update city in address directly for manual typing
                                setAddress(prev => ({ ...prev, city: e.target.value }))
                            }}
                            onFocus={() => setShowCityDropdown(true)}
                            className="p-2 px-3 outline-none rounded w-full"
                        />
                    </div>
                    {showCityDropdown && filteredCities.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white border border-slate-200 rounded mt-1 max-h-40 overflow-y-auto shadow-lg">
                            {filteredCities.map((city, idx) => (
                                <li
                                    key={idx}
                                    className="px-4 py-2 hover:bg-slate-100 cursor-pointer text-sm"
                                    onClick={() => handleCitySelect(city)}
                                >
                                    {city}
                                </li>
                            ))}
                        </ul>
                    )}
                    {address.city && (
                        <p className="text-xs text-green-600 mt-1">✓ {address.city}</p>
                    )}
                </div>

                <input name="state" onChange={handleAddressChange} value={address.state} className="p-2 px-4 outline-none border border-slate-200 rounded w-full" type="text" placeholder="Provinsi" required />
                <div className="flex gap-4">
                    <input name="zip" onChange={handleAddressChange} value={address.zip} className="p-2 px-4 outline-none border border-slate-200 rounded w-full" type="number" placeholder="Kode Pos" required />
                    <input name="country" onChange={handleAddressChange} value={address.country} className="p-2 px-4 outline-none border border-slate-200 rounded w-full" type="text" placeholder="Negara" required />
                </div>
                <input name="phone" onChange={handleAddressChange} value={address.phone} className="p-2 px-4 outline-none border border-slate-200 rounded w-full" type="text" placeholder="No. Telepon" required />
                <button className="bg-slate-800 text-white text-sm font-medium py-2.5 rounded-md hover:bg-slate-900 active:scale-95 transition-all">SIMPAN ALAMAT</button>
            </div>
            <XIcon size={30} className="absolute top-5 right-5 text-slate-500 hover:text-slate-700 cursor-pointer" onClick={() => setShowAddressModal(false)} />
        </form>
    )
}

export default AddressModal