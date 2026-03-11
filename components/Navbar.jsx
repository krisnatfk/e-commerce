'use client'
import { LayoutDashboardIcon, PackageIcon, Search, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useUser, useClerk, UserButton, Protect, useAuth } from "@clerk/nextjs";
import axios from "axios";

const Navbar = () => {
    const { user } = useUser();
    const { openSignIn } = useClerk();
    const { getToken } = useAuth();
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const cartCount = useSelector(state => state.cart.total);

    // Check if current user is admin
    useEffect(() => {
        const checkAdmin = async () => {
            if (!user) {
                setIsAdmin(false);
                return;
            }
            try {
                const token = await getToken();
                const { data } = await axios.get('/api/admin/is-admin', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setIsAdmin(data.isAdmin);
            } catch (error) {
                setIsAdmin(false);
            }
        };
        checkAdmin();
    }, [user]);

    const handleSearch = (e) => {
        e.preventDefault();
        router.push(`/shop?search=${search}`);
    }

    return (
        <nav className="relative bg-white">
            <div className="mx-6">
                <div className="flex items-center justify-between max-w-7xl mx-auto py-4 transition-all">
                    <Link href="/" className="relative text-4xl font-semibold text-slate-700">
                        <span className="text-green-600">Trimo</span>Joyo<span className="text-green-600 text-5xl leading-0">.</span>
                        <Protect plan='plus'>
                            <p className="absolute text-xs font-semibold -top-1 -right-8 px-3 p-0.5 rounded-full flex items-center gap-2 text-white bg-green-500">
                                plus
                            </p>
                        </Protect>

                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden sm:flex items-center gap-4 lg:gap-8 text-slate-600">
                        <Link href="/">Beranda</Link>
                        <Link href="/shop">Belanja</Link>
                        <Link href="/about">Tentang</Link>
                        <Link href="/contact">Kontak</Link>

                        <form onSubmit={handleSearch} className="hidden xl:flex items-center w-xs text-sm gap-2 bg-slate-100 px-4 py-3 rounded-full">
                            <Search size={18} className="text-slate-600" />
                            <input className="w-full bg-transparent outline-none placeholder-slate-600" type="text" placeholder="Cari produk" value={search} onChange={(e) => setSearch(e.target.value)} required />
                        </form>

                        <Link href="/cart" className="relative flex items-center gap-2 text-slate-600">
                            <ShoppingCart size={18} />
                            Keranjang
                            <button className="absolute -top-1 left-3 text-[8px] text-white bg-slate-600 size-3.5 rounded-full">{cartCount}</button>
                        </Link>

                        {!user ? (
                            <button onClick={openSignIn} className="px-8 py-2 bg-indigo-500 hover:bg-indigo-600 transition text-white rounded-full">
                                Masuk
                            </button>
                        ) : (
                            <UserButton>
                                <UserButton.MenuItems>
                                    <UserButton.Action labelIcon={<PackageIcon size={16} />} label="Pesanan Saya" onClick={() => router.push('/orders')} />
                                    <UserButton.Action labelIcon={<ShoppingCart size={16} />} label="Keranjang" onClick={() => router.push('/cart')} />
                                    {isAdmin && (
                                        <UserButton.Action labelIcon={<LayoutDashboardIcon size={16} />} label="Dashboard Admin" onClick={() => router.push('/admin')} />
                                    )}
                                </UserButton.MenuItems>
                            </UserButton>
                        )}
                    </div>

                    {/* Mobile Menu */}
                    <div className="sm:hidden flex items-center gap-4">
                        {/* Cart Icon untuk Mobile */}
                        <Link href="/cart" className="relative flex items-center text-slate-600">
                            <ShoppingCart size={20} />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 text-[10px] text-white bg-slate-600 size-4 rounded-full flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        {/* User Button untuk Mobile */}
                        {user ? (
                            <UserButton>
                                <UserButton.MenuItems>
                                    <UserButton.Action labelIcon={<PackageIcon size={16} />} label="Pesanan Saya" onClick={() => router.push('/orders')} />
                                    <UserButton.Action labelIcon={<ShoppingCart size={16} />} label="Keranjang" onClick={() => router.push('/cart')} />
                                    {isAdmin && (
                                        <UserButton.Action labelIcon={<LayoutDashboardIcon size={16} />} label="Dashboard Admin" onClick={() => router.push('/admin')} />
                                    )}
                                </UserButton.MenuItems>
                            </UserButton>
                        ) : (
                            <button onClick={openSignIn} className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-sm transition text-white rounded-full">
                                Masuk
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <hr className="border-gray-300" />
        </nav>
    )
}

export default Navbar;