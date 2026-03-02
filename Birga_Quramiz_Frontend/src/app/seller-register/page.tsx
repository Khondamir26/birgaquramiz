import { SellerSignupForm } from "@/components/seller-signup-form";

export default function SellerRegisterPage() {
    return (
        <div className="page-shell flex min-h-[80vh] items-center justify-center p-6">
            <div className="w-full max-w-sm md:max-w-4xl">
                <SellerSignupForm />
            </div>
        </div>
    );
}
