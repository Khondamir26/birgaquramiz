"use client"

import dynamic from "next/dynamic"

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
  return (
    <>
      {children}
      <Footer />
      <BottomNavigation />
    </>
  )
}