"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { getBrandBySlug } from "@/lib/api/brands"
import { getProducts } from "@/lib/api/products"
import type { Brand, PaginatedResponse, Product } from "@/types"
import { useTranslations } from "next-intl"
import Breadcrumbs from "@/components/navigation/Breadcrumbs"
import ProductCard from "@/components/product/ProductCard"

export default function BrandDetailPage() {
  const { id } = useParams()
  const slug = Array.isArray(id) ? id[0] : id

  const [brand, setBrand] = useState<Brand | null>(null)
  const [data, setData] = useState<PaginatedResponse<Product> | null>(null)
  const [loadingBrand, setLoadingBrand] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)

  const [prevSlug, setPrevSlug] = useState(slug)
  if (slug !== prevSlug) {
    setPrevSlug(slug)
    setLoadingBrand(true)
    setLoadingProducts(true)
  }
  const [errorBrand, setErrorBrand] = useState("")
  const [errorProducts, setErrorProducts] = useState("")

  const tNav = useTranslations("Navbar")

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    getBrandBySlug(slug)
      .then((data) => {
        if (!cancelled) {
          setBrand(data)
          setErrorBrand("")
        }
      })
      .catch((err) => {
        if (!cancelled) setErrorBrand(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoadingBrand(false)
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    getProducts(1, 100, undefined, undefined, undefined, undefined, undefined, slug)
      .then((res) => {
        if (!cancelled) {
          setData(res)
          setErrorProducts("")
        }
      })
      .catch((err) => {
        if (!cancelled) setErrorProducts(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoadingProducts(false)
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  const products = useMemo(() => data?.data ?? [], [data])

  const breadcrumbItems = [
    { label: tNav("home"), href: "/" },
    { label: "Бренды", href: "/brands" },
    { label: brand?.name || "..." },
  ]

  if (loadingBrand) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-12">
        <div className="mx-auto w-full md:max-w-[1440px] px-4 md:px-6 pt-6">
          <div className="h-40 w-full bg-white animate-pulse rounded-2xl mb-8" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-80 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (errorBrand || !brand) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-12 items-center pt-24">
        <div className="bg-white p-12 rounded-3xl max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-red-500 mb-2">Ошибка загрузки</h2>
          <p className="text-slate-500">{errorBrand || "Бренд не найден"}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-12">
      <div className="mx-auto w-full md:max-w-[1440px]">
        <div className="px-4 md:px-6 pt-3 md:pt-5">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        <div className="mx-auto flex flex-col gap-6 px-4 md:px-6 pt-4">
          <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-slate-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
            {brand.logoUrl ? (
              <div className="w-32 h-32 md:w-48 md:h-48 relative shrink-0 bg-white border border-slate-100 p-4 rounded-2xl">
                 <Image 
                    src={brand.logoUrl} 
                    alt={brand.name} 
                    fill
                    className="object-contain"
                 />
              </div>
            ) : (
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-2xl bg-gradient-to-br from-[#1B4D91] to-[#123668] flex items-center justify-center text-white font-black text-6xl shadow-inner shrink-0">
                {brand.name.charAt(0)}
              </div>
            )}

            <div className="flex flex-col gap-4 relative z-10 w-full">
               <h1 className="text-3xl md:text-5xl font-black text-[#1B4D91]">{brand.name}</h1>
               {brand.description && (
                  <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-3xl whitespace-pre-wrap bg-slate-50 p-4 md:p-6 rounded-2xl border border-slate-100">
                     {brand.description}
                  </p>
               )}
               {brand.website && (
                 <a 
                   href={brand.website.startsWith('http') ? brand.website : `https://${brand.website}`} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="mt-2 text-[#E31E24] font-bold text-sm hover:underline self-start bg-red-50 px-4 py-2 rounded-lg"
                 >
                   Официальный сайт
                 </a>
               )}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
              Ассортимент {brand.name} 
              <span className="bg-[#1B4D91]/10 text-[#1B4D91] px-3 py-1 rounded-full text-sm">
                 {data?.meta?.total ?? products.length} товаров 
              </span>
            </h2>

            {loadingProducts ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl h-[320px] animate-pulse" />
                ))}
              </div>
            ) : errorProducts ? (
               <div className="bg-red-50 text-red-500 p-6 rounded-2xl text-center">Вы не удалось загрузить ассортимент товаров.</div>
            ) : products.length === 0 ? (
              <div className="bg-white py-16 text-center rounded-3xl border border-dashed border-slate-200">
                <p className="text-slate-400 font-medium">К сожалению, на данный момент товары этого бренда отсутствуют.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
