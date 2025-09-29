import StoreLayout from "@/components/store/StoreLayout";
import { SignedIn, SignedOut, SignIn } from "@clerk/nextjs";

export const metadata = {
    title: "KrisMart. - Store Dashboard",
    description: "KrisMart. - Store Dashboard",
};

export default function RootAdminLayout({ children }) {

    return (
        <>
        <SignedIn>
            <StoreLayout>
                {children}
            </StoreLayout>
            </SignedIn>
            <SignedOut>
                <div className="min-h-screen flex justify-center items-center"> 
                    <SignIn fallbackRedirectUrl="/store" routing="hash"/>
                </div>

            </SignedOut>
        </>
    );
}
