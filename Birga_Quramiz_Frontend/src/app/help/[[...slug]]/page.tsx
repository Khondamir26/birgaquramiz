'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import {
  CreditCard,
  Truck,
  ShieldCheck,
  RotateCcw,
  Banknote,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Smartphone,
  MapPin,
  Warehouse,
  BadgeCheck,
  FileText,
  RefreshCw,
  Calendar,
  Zap,
  Phone,
  Bot,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const NAV_ITEMS = [
  { id: 'payment',  slug: 'payment',    icon: CreditCard  },
  { id: 'delivery', slug: 'delivery',   icon: Truck       },
  { id: 'guarantee',slug: 'gauranties', icon: ShieldCheck },
  { id: 'returns',  slug: 'return',     icon: RotateCcw   },
  { id: 'credit',   slug: 'credit',     icon: Banknote    },
  { id: 'faq',      slug: 'faq',        icon: HelpCircle  },
]

const SLUG_TO_ID: Record<string, string> = {
  payment:    'payment',
  delivery:   'delivery',
  gauranties: 'guarantee',
  return:     'returns',
  credit:     'credit',
  faq:        'faq',
}

// Per-card icon overrides per section
const CARD_ICONS: Record<string, Record<string, typeof CreditCard>> = {
  payment:   { online: Smartphone, delivery: MapPin },
  delivery:  { tashkent: Zap, regions: Truck, pickup: Warehouse },
  guarantee: { verified: BadgeCheck, quality: ShieldCheck },
  returns:   { conditions: FileText, process: RefreshCw },
  credit:    { installment: Calendar, scoring: Zap },
}

const SECTION_KEYS: Record<string, string[]> = {
  payment:   ['online', 'delivery'],
  delivery:  ['tashkent', 'regions', 'pickup'],
  guarantee: ['verified', 'quality'],
  returns:   ['conditions', 'process'],
  credit:    ['installment', 'scoring'],
}

const FAQ_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6']

function CardsContent({ sectionId, t }: { sectionId: string; t: ReturnType<typeof useTranslations> }) {
  const keys = SECTION_KEYS[sectionId] ?? []
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {keys.map((key) => {
        const Icon = CARD_ICONS[sectionId]?.[key] ?? HelpCircle
        return (
          <div
            key={key}
            className="group rounded-2xl bg-[#F0F2F5] border border-slate-100 p-5 flex flex-col gap-3 transition-all hover:border-[#1B4D91]/20 hover:bg-white hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-[#1B4D91]/8 flex items-center justify-center text-[#1B4D91] transition-colors group-hover:bg-[#1B4D91] group-hover:text-white shrink-0">
              <Icon className="size-4" />
            </div>
            <div>
              <h3 className="font-black text-[#1B4D91] text-[14px] mb-1">{t(`${sectionId}.${key}Title`)}</h3>
              <p className="text-slate-500 text-[13px] font-medium leading-relaxed">{t(`${sectionId}.${key}Description`)}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function FaqContent({ t }: { t: ReturnType<typeof useTranslations> }) {
  const [open, setOpen] = useState<string | null>(null)
  return (
    <div className="flex flex-col gap-3">
      {FAQ_KEYS.map((key) => {
        const isOpen = open === key
        const answerKey = key.replace('q', 'a') as `a${string}`
        return (
          <div
            key={key}
            className={cn(
              'rounded-2xl border transition-all duration-200',
              isOpen
                ? 'border-[#1B4D91]/20 bg-white shadow-sm'
                : 'border-slate-100 bg-[#F0F2F5]'
            )}
          >
            <button
              className="w-full flex items-start justify-between gap-4 p-5 text-left"
              onClick={() => setOpen(isOpen ? null : key)}
            >
              <div className="flex items-start gap-3">
                <span className="text-[11px] font-black text-[#1B4D91]/40 mt-0.5 select-none">Q</span>
                <span className="font-bold text-[#1B4D91] text-[14px] leading-snug">{t(`faq.${key}`)}</span>
              </div>
              <ChevronDown
                className={cn(
                  'size-4 shrink-0 text-slate-400 mt-0.5 transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
              />
            </button>
            {isOpen && (
              <div className="px-5 pb-5 pl-[calc(1.25rem+1.5rem)]">
                <p className="text-slate-500 text-[13px] font-medium leading-relaxed">{t(`faq.${answerKey}`)}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function HelpPage() {
  const t = useTranslations('Help')
  const params = useParams()
  const router = useRouter()

  const slugParam = Array.isArray(params?.slug) ? params.slug[0] : (params?.slug ?? '')
  const initialId = SLUG_TO_ID[slugParam] ?? 'payment'
  const [activeId, setActiveId] = useState(initialId)

  const activeItem = NAV_ITEMS.find((n) => n.id === activeId) ?? NAV_ITEMS[0]
  const ActiveIcon = activeItem.icon

  const handleNav = (item: typeof NAV_ITEMS[number]) => {
    setActiveId(item.id)
    router.push(`/help/${item.slug}`, { scroll: false })
  }

  // Mobile: toggle open sections
  const [mobileOpen, setMobileOpen] = useState<string | null>(initialId)

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-20 md:pb-12">
      <div className="mx-auto w-full max-w-[1440px] px-4 md:px-6 pt-5 md:pt-8 flex flex-col gap-6">

        {/* Hero */}
        <div className="rounded-3xl bg-[#1B4D91] px-7 py-8 md:px-10 md:py-10 flex items-center justify-between relative overflow-hidden">
          <div className="absolute -right-10 -top-10 size-48 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Birga Quramiz</p>
            <h1 className="text-2xl md:text-[28px] font-black text-white">{t('title')}</h1>
            <p className="mt-1.5 max-w-lg text-[13px] text-white/60 leading-relaxed">{t('subtitle')}</p>
          </div>
          <div className="hidden md:flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 ml-6">
            <HelpCircle className="size-8 text-white" />
          </div>
        </div>

        {/* ── Desktop layout ── */}
        <div className="hidden md:grid grid-cols-[248px_1fr] gap-6 items-start">

          {/* Sidebar */}
          <aside className="sticky top-24">
            <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-2 pt-1">
                {t('title')}
              </p>
              <nav className="flex flex-col gap-0.5">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon
                  const isActive = activeId === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all',
                        isActive
                          ? 'bg-[#1B4D91]/8 text-[#1B4D91]'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                      )}
                    >
                      <Icon className={cn('size-4 shrink-0', isActive ? 'text-[#1B4D91]' : 'text-slate-400')} />
                      <span className={cn('flex-1 text-[13px] font-bold truncate', isActive ? 'text-[#1B4D91]' : '')}>{t(`tabs.${item.id}`)}</span>
                      {isActive && <ChevronRight className="size-3.5 text-[#1B4D91]/50 shrink-0" />}
                    </button>
                  )
                })}
              </nav>

              {/* Support card */}
              <div className="mt-4 rounded-2xl bg-[#E31E24]/5 border border-[#E31E24]/10 p-4">
                <p className="text-[11px] font-black uppercase tracking-wider text-[#E31E24] mb-1">{t('supportTitle')}</p>
                <p className="text-[11px] text-[#E31E24]/70 font-semibold leading-snug mb-3">{t('supportText')}</p>
                <div className="flex flex-col gap-2">
                  <a
                    href="tel:+998903212761"
                    className="flex items-center gap-2 text-[12px] font-bold text-[#1B4D91] hover:underline"
                  >
                    <Phone className="size-3.5" />
                    +998 90 321 27 61
                  </a>
                  <Link
                    href="/ai-chat"
                    className="flex items-center gap-2 text-[12px] font-bold text-[#E31E24] hover:underline"
                  >
                    <Bot className="size-3.5" />
                    {t('supportCta')}
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          {/* Content card */}
          <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-8">
            {/* Section header */}
            <div className="flex items-start gap-5 mb-8">
              <div className="size-14 rounded-2xl bg-[#1B4D91]/8 flex items-center justify-center text-[#1B4D91] shrink-0">
                <ActiveIcon className="size-6" />
              </div>
              <div>
                <h2 className="text-[20px] font-black text-[#1B4D91] mb-1">{t(`${activeId}.title`)}</h2>
                <p className="text-[13px] text-slate-500 font-medium leading-relaxed max-w-2xl">{t(`${activeId}.description`)}</p>
              </div>
            </div>

            {activeId === 'faq'
              ? <FaqContent t={t} />
              : <CardsContent sectionId={activeId} t={t} />
            }
          </div>
        </div>

        {/* ── Mobile layout ── */}
        <div className="md:hidden flex flex-col gap-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isOpen = mobileOpen === item.id
            return (
              <div
                key={item.id}
                className={cn(
                  'rounded-3xl overflow-hidden border transition-all',
                  isOpen ? 'bg-white border-slate-200 shadow-sm' : 'bg-white border-slate-100'
                )}
              >
                <button
                  className="w-full flex items-center gap-4 px-5 py-4 text-left"
                  onClick={() => {
                    setMobileOpen(isOpen ? null : item.id)
                    router.push(`/help/${item.slug}`, { scroll: false })
                  }}
                >
                  <div className={cn(
                    'size-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                    isOpen ? 'bg-[#1B4D91] text-white' : 'bg-[#F0F2F5] text-slate-400'
                  )}>
                    <Icon className="size-4" />
                  </div>
                  <span className={cn('flex-1 text-[15px] font-bold', isOpen ? 'text-[#1B4D91]' : 'text-slate-700')}>
                    {t(`tabs.${item.id}`)}
                  </span>
                  <ChevronDown className={cn('size-4 text-slate-400 transition-transform duration-200', isOpen && 'rotate-180')} />
                </button>

                {isOpen && (
                  <div className="px-5 pb-6 pt-1">
                    <p className="text-[13px] text-slate-500 font-medium mb-5 leading-relaxed">{t(`${item.id}.description`)}</p>
                    {item.id === 'faq'
                      ? <FaqContent t={t} />
                      : <CardsContent sectionId={item.id} t={t} />
                    }
                  </div>
                )}
              </div>
            )
          })}

          {/* Mobile support card */}
          <div className="rounded-3xl bg-white border border-slate-100 p-5 flex items-start gap-4">
            <div className="size-10 rounded-xl bg-[#E31E24]/8 flex items-center justify-center shrink-0">
              <Phone className="size-4 text-[#E31E24]" />
            </div>
            <div>
              <p className="text-[13px] font-black text-slate-800 mb-0.5">{t('supportTitle')}</p>
              <p className="text-[12px] text-slate-500 font-medium mb-3">{t('supportText')}</p>
              <div className="flex flex-wrap gap-3">
                <a href="tel:+998903212761" className="text-[13px] font-bold text-[#1B4D91] hover:underline flex items-center gap-1.5">
                  <Phone className="size-3.5" /> +998 90 321 27 61
                </a>
                <Link href="/ai-consultant" className="text-[13px] font-bold text-[#E31E24] hover:underline flex items-center gap-1.5">
                  <Bot className="size-3.5" /> {t('supportCta')}
                </Link>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
