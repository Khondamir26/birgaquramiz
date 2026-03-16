'use client'

import { useTranslations } from 'next-intl'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useParams, useRouter } from 'next/navigation'
import {
    CreditCard,
    Truck,
    ShieldCheck,
    RotateCcw,
    Banknote,
    HelpCircle,
    ChevronRight,
    Sparkles,
    Info
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Translator = ReturnType<typeof useTranslations>

export default function HelpPage() {
    const t = useTranslations('Help')
    const params = useParams()
    const router = useRouter()

    const slug = params?.slug?.[0]

    const slugToTab: Record<string, string> = {
        'payment': 'payment',
        'delivery': 'delivery',
        'gauranties': 'guarantee',
        'return': 'returns',
        'credit': 'credit',
        'faq': 'faq'
    }

    const activeTab = slugToTab[slug || ''] || ''

    const handleTabChange = (value: string) => {
        if (!value) {
            router.push('/help', { scroll: false })
            return
        }

        const targetSlug = Object.keys(slugToTab).find(key => slugToTab[key] === value)
        if (targetSlug === 'payment') {
            router.push('/help/payment', { scroll: false })
        } else if (targetSlug) {
            router.push(`/help/${targetSlug}`, { scroll: false })
        }
    }

    const tabs = [
        { id: 'payment', icon: CreditCard },
        { id: 'delivery', icon: Truck },
        { id: 'guarantee', icon: ShieldCheck },
        { id: 'returns', icon: RotateCcw },
        { id: 'credit', icon: Banknote },
        { id: 'faq', icon: HelpCircle }
    ]

    return (
        <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-44 md:pb-12">
            <div className="mx-auto w-full md:max-w-[1440px]">
                <div className="mx-auto flex flex-col gap-6 px-4 md:px-6 pt-4 md:pt-6">

                    {/* Hero Banner - Standard Platform Style */}
                    <div className="rounded-3xl bg-[#1B4D91] px-6 py-9 md:px-10 flex items-start justify-between relative overflow-hidden">
                        {/* Decorative background element */}
                        <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-white/5 blur-3xl invisible md:visible" />

                        <div className="relative z-10">
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">
                                Birga Quramiz
                            </p>
                            <h1 className="text-2xl font-black text-white md:text-3xl">
                                {t('title')}
                            </h1>
                            <p className="mt-2 max-w-xl text-[13px] text-white/70 md:text-[14px]">
                                {t('subtitle')}
                            </p>
                        </div>
                        <div className="hidden md:flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                            <HelpCircle className="size-8 text-white" />
                        </div>
                    </div>

                    {/* Desktop Layout - Standard Platform Structure */}
                    <div className="hidden md:flex flex-row gap-6 items-start">
                        {/* Sidebar - Aside Style like AI Chat */}
                        <aside className="w-64 shrink-0">
                            <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 px-2">
                                    {t('title')}
                                </p>

                                <Tabs
                                    value={activeTab || 'payment'}
                                    onValueChange={handleTabChange}
                                    orientation="vertical"
                                    className="w-full"
                                >
                                    <TabsList className="flex flex-col h-auto bg-transparent border-none gap-1 p-0 w-full">
                                        {tabs.map((tab) => (
                                            <TabsTrigger
                                                key={tab.id}
                                                value={tab.id}
                                                className={cn(
                                                    "w-full justify-start items-center gap-3 px-3.5 py-3 h-auto transition-all duration-200 border-none group rounded-2xl",
                                                    "data-[state=active]:bg-[#1B4D91]/8 data-[state=active]:text-[#1B4D91] hover:bg-slate-50",
                                                    "text-slate-600 font-bold text-[13px]"
                                                )}
                                            >
                                                <tab.icon className="w-4 h-4 shrink-0 opacity-70 group-data-[state=active]:opacity-100" />
                                                <span className="truncate flex-1 text-left">{t(`tabs.${tab.id}`)}</span>
                                                <ChevronRight className="ml-auto w-3.5 h-3.5 opacity-0 -translate-x-1 group-data-[state=active]:opacity-100 group-data-[state=active]:translate-x-0 transition-all shrink-0" />
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                </Tabs>

                                <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#E31E24]/5 border border-[#E31E24]/10 p-4">
                                    <div className="size-5 rounded-lg bg-[#E31E24]/10 flex items-center justify-center shrink-0 mt-0.5">
                                        <Info className="size-3 text-[#E31E24]" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-[11px] font-black uppercase tracking-wider text-[#E31E24]">
                                            Support
                                        </p>
                                        <p className="text-[11px] font-bold text-[#E31E24]/80 leading-snug">
                                            Need expert assistance? Our support team is here to help.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* Content Area - Rounded 3xl bg-white like fleet articles */}
                        <div className="flex-1 min-w-0">
                            <Tabs value={activeTab || 'payment'} className="w-full focus:outline-none">
                                {tabs.map((tab) => (
                                    <TabsContent key={tab.id} value={tab.id} className="mt-0 focus-visible:outline-none border-none outline-none">
                                        <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-8 flex flex-col">
                                            <div className="flex items-start gap-6 mb-10">
                                                <div className="w-16 h-16 rounded-2xl bg-[#1B4D91]/8 flex items-center justify-center text-[#1B4D91] shrink-0">
                                                    <tab.icon className="w-7 h-7" />
                                                </div>
                                                <div className="pt-1">
                                                    <h2 className="text-2xl font-black text-[#1B4D91] tracking-tight mb-2 uppercase text-[20px]">{t(`${tab.id}.title`)}</h2>
                                                    <p className="text-[15px] text-slate-500 font-bold max-w-2xl leading-relaxed">{t(`${tab.id}.description`)}</p>
                                                </div>
                                            </div>

                                            <div className="flex-1">
                                                {renderContent(tab.id, t, false)}
                                            </div>
                                        </div>
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </div>
                    </div>

                    {/* Mobile View - Preserved Accordion */}
                    <div className="md:hidden">
                        <div className="rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden">
                            <Accordion
                                type="single"
                                collapsible
                                value={activeTab}
                                onValueChange={handleTabChange}
                                className="w-full"
                            >
                                {tabs.map((tab) => (
                                    <AccordionItem
                                        key={tab.id}
                                        value={tab.id}
                                        className="border-b last:border-0 border-slate-100"
                                    >
                                        <AccordionTrigger className="px-5 py-5 hover:no-underline [&[data-state=open]_.icon-box]:bg-[#1B4D91] [&[data-state=open]_.icon-box]:text-white">
                                            <div className="flex items-center gap-4 text-left">
                                                <div className="icon-box w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 bg-slate-50 text-slate-400">
                                                    <tab.icon className="w-4 h-4" />
                                                </div>
                                                <span className="font-bold text-[15px] text-[#1B4D91]">
                                                    {t(`tabs.${tab.id}`)}
                                                </span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="px-5 pb-8 bg-[#f4f6fa]/30">
                                            <div className="pt-4">
                                                {renderContent(tab.id, t, true)}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

function renderContent(id: string, t: Translator, isMobile: boolean) {
    if (id === 'faq') {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className={cn(
                        "rounded-2xl border border-slate-100 transition-all duration-300 bg-[#f4f6fa]/20",
                        !isMobile ? "p-6" : "p-4"
                    )}>
                        <h4 className="font-black text-[#1B4D91] mb-2 flex gap-3 text-[14px] md:text-base leading-snug">
                            <span className="text-[#1B4D91]/30">Q:</span> {t(`faq.q${i}`)}
                        </h4>
                        <p className="text-slate-500 font-semibold text-[12px] md:text-[13px] leading-relaxed md:pl-8">{t(`faq.a${i}`)}</p>
                    </div>
                ))}
            </div>
        )
    }

    const keysMap: Record<string, string[]> = {
        payment: ['online', 'delivery'],
        delivery: ['tashkent', 'regions', 'pickup'],
        guarantee: ['verified', 'quality'],
        returns: ['conditions', 'process'],
        credit: ['installment', 'scoring']
    }

    return (
        <div className={cn("grid gap-6", !isMobile ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1")}>
            {keysMap[id]?.map((key) => (
                <div key={key} className={cn(
                    "rounded-2xl bg-[#f4f6fa]/30 border border-slate-100 p-6 flex flex-col group transition-all duration-300 hover:border-[#1B4D91]/20 hover:bg-white hover:shadow-md",
                )}>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-[#1B4D91]/5 flex items-center justify-center text-[#1B4D91] transition-colors group-hover:bg-[#1B4D91] group-hover:text-white">
                            <Sparkles className="size-4" />
                        </div>
                        <h3 className="font-black text-[#1B4D91] text-[15px] tracking-tight">{t(`${id}.${key}Title`)}</h3>
                    </div>
                    <p className="text-slate-500 font-bold text-[13px] leading-relaxed group-hover:text-slate-600 transition-colors">{t(`${id}.${key}Description`)}</p>
                </div>
            ))}
        </div>
    )
}
