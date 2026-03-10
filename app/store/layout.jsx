import { redirect } from "next/navigation"

export const metadata = {
    title: "TrimoJoyo - Store",
    description: "TrimoJoyo Store Dashboard",
}

// Store dashboard redirects to admin — single-store model
export default function StoreLayout({ children }) {
    redirect('/admin')
}
