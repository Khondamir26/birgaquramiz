"use client"

import { useEffect, useState, useMemo } from "react"
import { Pencil, Trash2, Plus, X, ChevronRight, FolderOpen, Folder } from "lucide-react"
import { useTranslations } from "next-intl"
import { getCategories, createCategory, updateCategory, deleteCategory, type CategoryInput } from "@/lib/api/categories"
import type { Category } from "@/types"

const EMPTY_FORM: CategoryInput = {
  name: "",
  nameEn: "",
  nameUz: "",
  code: "",
  slug: "",
  parentId: null,
}

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[а-яё]/g, (c) => ({ а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"yo",ж:"zh",з:"z",и:"i",й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"h",ц:"ts",ч:"ch",ш:"sh",щ:"sch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya" }[c] ?? c))
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
}

export default function AdminCategoriesPage() {
  const t = useTranslations("AdminCategories")
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState<CategoryInput>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const loadCategories = () => {
    setLoading(true)
    getCategories()
      .then((data) => { setCategories(data); setError("") })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadCategories() }, [])

  // Build tree: parents + their children
  const { parents, childrenMap } = useMemo(() => {
    const parents = categories.filter((c) => !c.parentId)
    const childrenMap: Record<string, Category[]> = {}
    categories.forEach((c) => {
      if (c.parentId) {
        if (!childrenMap[c.parentId]) childrenMap[c.parentId] = []
        childrenMap[c.parentId].push(c)
      }
    })
    return { parents, childrenMap }
  }, [categories])

  const parentOptions = useMemo(() => categories.filter((c) => !c.parentId), [categories])

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const handleOpenModal = (cat?: Category, defaultParentId?: string) => {
    if (cat) {
      setEditingCategory(cat)
      setFormData({
        name: cat.name,
        nameEn: cat.nameEn ?? "",
        nameUz: cat.nameUz ?? "",
        code: cat.code,
        slug: cat.slug ?? "",
        parentId: cat.parentId ?? null,
      })
    } else {
      setEditingCategory(null)
      setFormData({ ...EMPTY_FORM, parentId: defaultParentId ?? null })
    }
    setIsModalOpen(true)
  }

  const handleClose = () => { setIsModalOpen(false); setEditingCategory(null) }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setFormData((prev) => ({
      ...prev,
      name,
      slug: !editingCategory ? generateSlug(name) : prev.slug,
      code: !editingCategory && !prev.code ? name.toUpperCase().replace(/\s+/g, "_").slice(0, 20) : prev.code,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload: CategoryInput = {
        ...formData,
        parentId: formData.parentId || null,
        nameEn: formData.nameEn || undefined,
        nameUz: formData.nameUz || undefined,
        slug: formData.slug || undefined,
      }
      if (editingCategory) {
        await updateCategory(editingCategory.id, payload)
      } else {
        await createCategory(payload)
      }
      handleClose()
      loadCategories()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : t("saving"))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (cat: Category) => {
    const children = childrenMap[cat.id]
    const hasChildren = children && children.length > 0
    const msg = hasChildren
      ? t("deleteConfirmChildren", { name: cat.name, count: children.length })
      : t("deleteConfirm", { name: cat.name })
    if (!window.confirm(msg)) return
    try {
      await deleteCategory(cat.id)
      loadCategories()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : t("tooltipDelete"))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1B4D91]">{t("title")}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {t("description")}
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-[#1B4D91] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#123668] transition-colors active:scale-95 shrink-0"
        >
          <Plus className="w-5 h-5" />
          {t("addCategory")}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: t("statsTotal"), value: categories.length, color: "#1B4D91" },
          { label: t("statsParent"), value: parents.length, color: "#8b5cf6" },
          { label: t("statsSub"), value: categories.length - parents.length, color: "#10b981" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">{s.label}</p>
            <p className="text-2xl font-black mt-1" style={{ color: s.color }}>{loading ? "—" : s.value}</p>
          </div>
        ))}
      </div>

      {/* Tree table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-5 py-4 text-[13px] font-bold text-slate-500 uppercase tracking-wider">{t("colName")}</th>
                <th className="px-5 py-4 text-[13px] font-bold text-slate-500 uppercase tracking-wider">{t("colCode")}</th>
                <th className="px-5 py-4 text-[13px] font-bold text-slate-500 uppercase tracking-wider">{t("colSlug")}</th>
                <th className="px-5 py-4 text-[13px] font-bold text-slate-500 uppercase tracking-wider">{t("colLocales")}</th>
                <th className="px-5 py-4 text-[13px] font-bold text-slate-500 uppercase tracking-wider text-right">{t("colActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B4D91]" />
                  </td>
                </tr>
              ) : parents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                    {t("empty")}
                  </td>
                </tr>
              ) : (
                parents.map((parent) => {
                  const children = childrenMap[parent.id] ?? []
                  const isOpen = expanded.has(parent.id)
                  return (
                    <>
                      {/* Parent row */}
                      <tr key={parent.id} className="hover:bg-slate-50/50 transition-colors group bg-white">
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => children.length > 0 && toggleExpand(parent.id)}
                              className={`flex items-center justify-center w-6 h-6 rounded-md transition-colors ${children.length > 0 ? "hover:bg-slate-100 cursor-pointer" : "cursor-default"}`}
                            >
                              {children.length > 0 ? (
                                isOpen
                                  ? <FolderOpen className="size-4 text-[#1B4D91]" />
                                  : <Folder className="size-4 text-slate-400" />
                              ) : (
                                <span className="w-4 h-px bg-slate-200 mx-auto block" />
                              )}
                            </button>
                            <span className="font-bold text-[#1a1a1a] text-[14px]">{parent.name}</span>
                            {children.length > 0 && (
                              <span className="text-[11px] font-bold text-white bg-[#1B4D91] rounded-full px-1.5 py-0.5 leading-none">{children.length}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <code className="bg-slate-100 text-[#1B4D91] px-2 py-1 rounded text-xs font-mono">{parent.code}</code>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {parent.slug ? (
                            <code className="bg-slate-50 text-slate-500 px-2 py-1 rounded text-xs font-mono border border-slate-100">{parent.slug}</code>
                          ) : <span className="text-slate-300 text-xs">—</span>}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex flex-col gap-0.5">
                            {parent.nameEn && <span className="text-[12px] text-slate-500"><span className="text-[10px] font-black text-slate-300 mr-1">EN</span>{parent.nameEn}</span>}
                            {parent.nameUz && <span className="text-[12px] text-slate-500"><span className="text-[10px] font-black text-slate-300 mr-1">UZ</span>{parent.nameUz}</span>}
                            {!parent.nameEn && !parent.nameUz && <span className="text-slate-300 text-xs">—</span>}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenModal(undefined, parent.id)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title={t("tooltipAddSub")}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenModal(parent)}
                              className="p-1.5 text-slate-400 hover:text-[#1B4D91] hover:bg-[#1B4D91]/10 rounded-lg transition-colors"
                              title={t("tooltipEdit")}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(parent)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title={t("tooltipDelete")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Children rows */}
                      {isOpen && children.map((child) => (
                        <tr key={child.id} className="hover:bg-blue-50/30 transition-colors group bg-slate-50/40">
                          <td className="px-5 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2 pl-8">
                              <ChevronRight className="size-3.5 text-slate-300 shrink-0" />
                              <span className="font-semibold text-slate-700 text-[13px]">{child.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <code className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-xs font-mono">{child.code}</code>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            {child.slug ? (
                              <code className="bg-slate-50 text-slate-400 px-2 py-0.5 rounded text-xs font-mono border border-slate-100">{child.slug}</code>
                            ) : <span className="text-slate-300 text-xs">—</span>}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <div className="flex flex-col gap-0.5">
                              {child.nameEn && <span className="text-[12px] text-slate-400"><span className="text-[10px] font-black text-slate-300 mr-1">EN</span>{child.nameEn}</span>}
                              {child.nameUz && <span className="text-[12px] text-slate-400"><span className="text-[10px] font-black text-slate-300 mr-1">UZ</span>{child.nameUz}</span>}
                              {!child.nameEn && !child.nameUz && <span className="text-slate-300 text-xs">—</span>}
                            </div>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleOpenModal(child)}
                                className="p-1.5 text-slate-400 hover:text-[#1B4D91] hover:bg-[#1B4D91]/10 rounded-lg transition-colors"
                                title={t("tooltipEdit")}
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(child)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title={t("tooltipDelete")}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {editingCategory ? t("modalEditTitle") : t("modalNewTitle")}
                </h2>
                {formData.parentId && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {t("modalSubOf")} <span className="font-bold text-[#1B4D91]">{parentOptions.find(p => p.id === formData.parentId)?.name}</span>
                  </p>
                )}
              </div>
              <button onClick={handleClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              {/* Parent category select */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">{t("fieldParent")}</label>
                <select
                  value={formData.parentId ?? ""}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value || null })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1B4D91]/20 focus:border-[#1B4D91] transition-all"
                >
                  <option value="">{t("fieldParentEmpty")}</option>
                  {parentOptions
                    .filter((p) => p.id !== editingCategory?.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">{t("fieldParentHint")}</p>
              </div>

              {/* Name RU */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  {t("fieldNameRu")} <span className="text-red-500">*</span>
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

              {/* Name EN + UZ side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">{t("fieldNameEn")}</label>
                  <input
                    type="text"
                    value={formData.nameEn ?? ""}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1B4D91]/20 focus:border-[#1B4D91] transition-all"
                    placeholder="Building materials"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">{t("fieldNameUz")}</label>
                  <input
                    type="text"
                    value={formData.nameUz ?? ""}
                    onChange={(e) => setFormData({ ...formData, nameUz: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1B4D91]/20 focus:border-[#1B4D91] transition-all"
                    placeholder="Qurilish materiallari"
                  />
                </div>
              </div>

              {/* Code + Slug side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    {t("fieldCode")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1B4D91]/20 focus:border-[#1B4D91] transition-all font-mono text-sm uppercase"
                    placeholder="BUILD_MAT"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">{t("fieldSlug")}</label>
                  <input
                    type="text"
                    value={formData.slug ?? ""}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1B4D91]/20 focus:border-[#1B4D91] transition-all font-mono text-sm"
                    placeholder="building-materials"
                  />
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  {t("btnCancel")}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#1B4D91] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#123668] transition-colors shadow-sm shadow-[#1B4D91]/20 disabled:opacity-60"
                >
                  {saving ? t("saving") : editingCategory ? t("btnSave") : t("btnAdd")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
