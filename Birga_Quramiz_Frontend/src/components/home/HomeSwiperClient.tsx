'use client'

import dynamic from 'next/dynamic'

const HomeSwiper = dynamic(
  () => import('@/components/home/HomeSwiper'),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full rounded-2xl bg-slate-100 animate-pulse"
        style={{ aspectRatio: '16/7', minHeight: 180 }}
      />
    ),
  }
)

export default function HomeSwiperClient() {
  return <HomeSwiper />
}
