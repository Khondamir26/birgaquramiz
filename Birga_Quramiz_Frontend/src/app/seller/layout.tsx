"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { PageLoader } from '@/components/ui/FullPageLoader'
import { SellerSidebar } from '@/components/seller/SellerSidebar'

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isInitialized } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isInitialized) return
    if (!isAuthenticated) {
      router.replace('/login?from=/seller/dashboard')
      return
    }
    if (user?.role !== 'SELLER' && user?.role !== 'ADMIN') {
      router.replace('/')
    }
  }, [isInitialized, isAuthenticated, user, router])

  if (!isInitialized || !isAuthenticated || (user?.role !== 'SELLER' && user?.role !== 'ADMIN')) {
    return <PageLoader />
  }

  return (
    <div className="flex min-h-screen bg-[#f5f7fb]">
      <SellerSidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        {children}
      </div>
    </div>
  )
}
