"use client"

import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"

const Footer = dynamic(
  () => import("@/components/layout/Footer"),
  { ssr: false }
)

const BottomNavigation = dynamic(
  () => import("@/components/layout/BottomNavigation"),
  { ssr: false }
)

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isDispatcher = pathname.startsWith("/dispatcher")

  return (
    <>
      {children}
      {!isDispatcher && <Footer />}
      {!isDispatcher && <BottomNavigation />}
    </>
  )
}