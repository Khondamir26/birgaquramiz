"use client"

import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { useAuthStore } from "@/store/authStore"

const Footer = dynamic(
  () => import("@/components/layout/Footer"),
  { ssr: false }
)

const BottomNavigation = dynamic(
  () => import("@/components/layout/BottomNavigation"),
  { ssr: false }
)

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? 'birga_quramiz_bot'

function TelegramPhoneLinkScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white px-6 text-center">
      <div className="mb-6 text-5xl">📱</div>
      <h1 className="text-[22px] font-black text-slate-900 mb-3">Telefon raqamni ulang</h1>
      <p className="text-[14px] text-slate-500 mb-8 max-w-[280px]">
        Ilovadan foydalanish uchun Telegram botda telefon raqamingizni ulang
      </p>
      <a
        href={`https://t.me/${BOT_USERNAME}`}
        target="_blank"
        rel="noopener noreferrer"
        className="h-13 px-8 rounded-full bg-[#229ED9] text-white font-black text-[15px] flex items-center gap-2 shadow-lg shadow-[#229ED9]/30 active:scale-[0.98] transition-all"
      >
        <svg className="size-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.16 14.26l-2.947-.924c-.64-.203-.652-.64.135-.954l11.566-4.458c.537-.194 1.006.131.98.297z"/>
        </svg>
        Botni ochish
      </a>
    </div>
  )
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isDispatcher = pathname.startsWith("/dispatcher")
  const telegramRequiresPhone = useAuthStore((s) => s.telegramRequiresPhone)

  if (telegramRequiresPhone) {
    return <TelegramPhoneLinkScreen />
  }

  return (
    <>
      {children}
      {!isDispatcher && <Footer />}
      {!isDispatcher && <BottomNavigation />}
    </>
  )
}
