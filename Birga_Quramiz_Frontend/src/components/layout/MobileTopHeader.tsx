"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";

export default function MobileTopHeader() {
    const { user } = useAuth();
    const pathname = usePathname();

    // Only show on homepage
    const isHomePage = pathname === "/" || pathname === "/en" || pathname === "/ru" || pathname === "/uz";
    if (!isHomePage) return null;

    const logoSrc = user?.role === "SELLER" ? "/sellers-panel-logo.png" : "/logo.png";

    return (
        <header className="sticky top-0 z-50 flex h-[60px] w-full items-center justify-between border-b border-slate-100/80 bg-white/95 backdrop-blur-md px-4 md:hidden shadow-sm">
            <Link href="/" className="flex items-center">
                <Image
                    src={logoSrc}
                    alt="Birga Quramiz"
                    width={240}
                    height={64}
                    className="h-14 w-auto object-contain"
                    priority
                />
            </Link>

            <LanguageSwitcher />
        </header>
    );
}
