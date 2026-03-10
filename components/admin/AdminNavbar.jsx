'use client'
import { useUser, UserButton } from "@clerk/nextjs"
import Link from "next/link"

const AdminNavbar = () => {

    const { user } = useUser()

    return (
        <div className="flex items-center justify-between px-4 sm:px-8 lg:px-12 py-3 border-b border-slate-200 transition-all">
            <Link href="/" className="relative text-2xl sm:text-4xl font-semibold text-slate-700">
                <span className="text-green-600">Trimo</span>Joyo<span className="text-green-600 text-3xl sm:text-5xl leading-0">.</span>
                <p className="absolute text-[10px] sm:text-xs font-semibold -top-1 -right-13 px-2 sm:px-3 p-0.5 rounded-full flex items-center gap-2 text-white bg-green-500">
                    Admin
                </p>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
                <p className="hidden sm:block">Hi, {user?.firstName}</p>
                <UserButton />
            </div>
        </div>
    )
}

export default AdminNavbar