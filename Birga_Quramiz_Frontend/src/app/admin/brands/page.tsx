"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Pencil, Trash2, Plus, X, Tag } from "lucide-react"
import { getBrands, createBrand, updateBrand, deleteBrand, type BrandInput } from "@/lib/api/brands"
import type { Brand } from "@/types"
import BrandLogo from "@/components/brand/BrandLogo"

export default function AdminBrandsPage() {
  const t = useTranslations("AdminBrands")
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  
  const [formData, setFormData] = useState<BrandInput>({
    name: "",
    slug: "",
    logoUrl: "",
    website: "",
    description: "",
    featured: false
  })
  


  const loadBrands = () => {
    setLoading(true)
    getBrands()
      .then((data) => {
        setBrands(data)
        setError("")
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    getBrands()
      .then((data) => {
        setBrands(data)
        setError("")
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleOpenModal = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand)
      setFormData({
        name: brand.name,
        slug: brand.slug,
        logoUrl: brand.logoUrl || "",
        website: brand.website || "",
        description: brand.description || "",
        featured: brand.featured
      })
    } else {
      setEditingBrand(null)
      setFormData({
        name: "",
        slug: "",
        logoUrl: "",
        website: "",
        description: "",
        featured: false
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingBrand(null)
  }

  const generateSlug = (name: string) => {
     return name
       .toLowerCase()
       .replace(/[^a-z0-9]+/g, '-')
       .replace(/(^-|-$)+/g, '');
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const name = e.target.value
     setFormData(prev => ({
        ...prev, 
        name,
        slug: !editingBrand ? generateSlug(name) : prev.slug
     }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingBrand) {
        await updateBrand(editingBrand.id, formData)
      } else {
        await createBrand(formData)
      }
      handleCloseModal()
      loadBrands()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : t("btnSave"))
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("deleteConfirm"))) return
    try {
      await deleteBrand(id)
      loadBrands()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : t("tooltipDelete"))
    }
  }

  return (
    <div className="flex flex-col flex-1 pb-12">
      <div className="mx-auto w-full max-w-[1440px] px-4 pt-4 md:px-7 md:pt-7 flex flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1B4D91]/10 text-[#1B4D91]">
            <Tag className="size-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-[#1B4D91]">{t("title")}</h1>
            <p className="text-[12px] text-slate-400 font-medium mt-0.5">{t("description")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!loading && brands.length > 0 && (
            <span className="text-[13px] font-bold text-slate-400">
              {t("total")}: <span className="text-slate-600">{brands.length}</span>
            </span>
          )}
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-[#1B4D91] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#123668] transition-colors active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            {t("addBrand")}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-5 py-4 text-[13px] font-bold text-slate-500 uppercase tracking-wider">
                  {t("colLogo")}
                </th>
                <th className="px-5 py-4 text-[13px] font-bold text-slate-500 uppercase tracking-wider">
                  {t("colName")}
                </th>
                <th className="px-5 py-4 text-[13px] font-bold text-slate-500 uppercase tracking-wider">
                  {t("colSlug")}
                </th>
                <th className="px-5 py-4 text-[13px] font-bold text-slate-500 uppercase tracking-wider">
                  {t("colFeatured")}
                </th>
                <th className="px-5 py-4 text-[13px] font-bold text-slate-500 uppercase tracking-wider text-right">
                  {t("colActions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B4D91]"></div>
                  </td>
                </tr>
              ) : brands.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-500 font-medium">
                    {t("empty")}
                  </td>
                </tr>
              ) : (
                brands.map((brand) => (
                  <tr key={brand.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {brand.logoUrl ? (
                          <div className="w-12 h-12 relative bg-white border border-slate-100 shrink-0 p-1 rounded-lg flex items-center justify-center">
                            <BrandLogo 
                              src={brand.logoUrl} 
                              alt={brand.name} 
                              fill
                              className="object-contain" 
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-400">
                             {brand.name.charAt(0)}
                          </div>
                       )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-bold text-slate-800">{brand.name}</div>
                      {brand.website && (
                         <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">{brand.website}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <code className="bg-slate-100 text-[#1B4D91] px-2 py-1 rounded text-xs font-mono">
                        {brand.slug}
                      </code>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                        {brand.featured ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {t("featuredBadge")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                            {t("regularBadge")}
                          </span>
                        )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenModal(brand)}
                          className="p-2 text-slate-400 hover:text-[#1B4D91] hover:bg-[#1B4D91]/10 rounded-lg transition-colors"
                          title={t("tooltipEdit")}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(brand.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title={t("tooltipDelete")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-bold text-slate-800">
                {editingBrand ? t("modalEditTitle") : t("modalNewTitle")}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    {t("fieldName")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleNameChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1B4D91]/20 focus:border-[#1B4D91] transition-all"
                    placeholder={t("namePlaceholder")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    {t("fieldSlug")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1B4D91]/20 focus:border-[#1B4D91] transition-all font-mono text-sm"
                    placeholder="milwaukee"
                  />
                  <p className="text-xs text-slate-400 mt-1">{t("fieldSlugHint", { slug: "milwaukee" })}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    {t("fieldLogo")}
                  </label>
                  <div className="flex gap-3">
                     <input
                       type="url"
                       value={formData.logoUrl}
                       onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1B4D91]/20 focus:border-[#1B4D91] transition-all"
                       placeholder="https://example.com/logo.png"
                     />
                      {formData.logoUrl && (
                        <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl shrink-0 p-1 relative flex items-center justify-center overflow-hidden">
                          <BrandLogo 
                            src={formData.logoUrl} 
                            alt="Preview" 
                            fill
                            className="object-contain" 
                          />
                        </div>
                      )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    {t("fieldWebsite")}
                  </label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1B4D91]/20 focus:border-[#1B4D91] transition-all"
                    placeholder="milwaukeetool.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    {t("fieldDescription")}
                  </label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1B4D91]/20 focus:border-[#1B4D91] transition-all resize-none"
                    placeholder={t("descriptionPlaceholder")}
                  />
                </div>
                
                <label className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                  <div className="relative flex items-center">
                     <input
                       type="checkbox"
                       checked={formData.featured}
                       onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                       className="w-5 h-5 accent-[#1B4D91] rounded cursor-pointer"
                     />
                  </div>
                  <div>
                     <div className="text-sm font-bold text-slate-700">{t("fieldFeatured")}</div>
                     <div className="text-xs text-slate-500 mt-0.5">{t("fieldFeaturedHint")}</div>
                  </div>
                </label>

              </div>

              <div className="pt-4 mt-6 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  {t("btnCancel")}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#1B4D91] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#123668] transition-colors shadow-sm shadow-[#1B4D91]/20"
                >
                  {editingBrand ? t("btnSave") : t("btnAdd")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
