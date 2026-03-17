"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { getBrands } from "@/lib/api/brands"
import type { Brand } from "@/types"
import { useTranslations } from "next-intl"
import Breadcrumbs from "@/components/navigation/Breadcrumbs"

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const tNav = useTranslations("Navbar")

  useEffect(() => {
    let cancelled = false
    getBrands()
      .then((data) => {
        if (!cancelled) {
          setBrands(data)
          setError("")
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const breadcrumbItems = [
    { label: tNav("home"), href: "/" },
    { label: "Бренды" },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-12">
      <div className="mx-auto w-full md:max-w-[1440px]">
        <div className="px-4 md:px-6 pt-3 md:pt-5">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        <div className="mx-auto flex flex-col gap-6 px-4 md:px-6 pt-6">
          <h1 className="text-2xl md:text-3xl font-black text-[#1B4D91]">Все Бренды</h1>
          <p className="text-slate-500 max-w-2xl">
            Выберите интересующий вас бренд, чтобы увидеть полный каталог продукции от официальных производителей и дистрибьюторов.
          </p>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl h-36 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-500 p-6 rounded-2xl text-center">
              <p className="font-bold">Ошибка при загрузке брендов</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          ) : brands.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl text-center text-slate-500">
              <p className="font-bold text-lg">Бренды не найдены</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {brands.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/brands/${brand.slug}`}
                  className="bg-white rounded-2xl p-6 flex items-center justify-center flex-col gap-4 shadow-sm hover:shadow-md transition-shadow active:scale-95 duration-200 border border-transparent hover:border-[#1B4D91]/10 aspect-square text-center group"
                >
                  {brand.logoUrl ? (
                    <div className="relative w-full h-16 flex items-center justify-center overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-300">
                      {brand.logoUrl.startsWith('http') ? (
                        <img 
                          src={brand.logoUrl} 
                          alt={brand.name} 
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <Image 
                          src={brand.logoUrl} 
                          alt={brand.name} 
                          fill
                          className="object-contain"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-[#1B4D91] font-black text-xl group-hover:bg-[#1B4D91]/10 transition-colors">
                      {brand.name.charAt(0)}
                    </div>
                  )}
                  <span className="font-bold text-slate-700 text-sm group-hover:text-[#1B4D91] transition-colors">{brand.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
