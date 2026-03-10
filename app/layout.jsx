import { Outfit } from "next/font/google";
import { Toaster } from "react-hot-toast";
import StoreProvider from "@/app/StoreProvider";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Script from "next/script";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata = {
    title: "TrimoJoyo - Supplier Ayam Fillet Segar",
    description: "TrimoJoyo - Supplier Ayam Fillet Segar, Sehat, dan Halal. Solusi kebutuhan lauk protein terbaik Anda.",
};

export default function RootLayout({ children }) {
    return (
        <ClerkProvider>
            <html lang="en">
                <body className={`${outfit.className} antialiased`}>
                    <StoreProvider>
                        <Toaster />
                        {children}
                    </StoreProvider>
                    <Script type="text/javascript" src="https://app.sandbox.midtrans.com/snap/snap.js" data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY} strategy="beforeInteractive" />
                </body>
            </html>
        </ClerkProvider >
    );
}
