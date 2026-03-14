"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
    Building2,
    ArrowRight,
    Sparkles,
    InfoIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
    const t = useTranslations("About");

    return (
        <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-44 md:pb-12">
            <div className="mx-auto w-full md:max-w-7xl">
                <div className="mx-auto flex flex-col gap-6 px-4 md:px-6 pt-4 md:pt-6">

                    {/* Hero Banner - Standard Platform Style */}
                    <div className="rounded-3xl bg-[#1B4D91] px-6 py-9 md:px-10 flex items-start justify-between relative overflow-hidden">
                        <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-white/5 blur-3xl invisible md:visible" />

                        <div className="relative z-10">
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">
                                Birga Quramiz
                            </p>
                            <h1 className="text-2xl font-black text-white md:text-3xl">
                                О компании
                            </h1>
                            <p className="mt-2 max-w-xl text-[13px] text-white/70 md:text-[14px]">
                                {t('hero.subtitle')}
                            </p>
                        </div>
                        <div className="hidden md:flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                            <InfoIcon className="size-8 text-white" />
                        </div>
                    </div>

                    {/* Desktop Layout - Standard Platform Structure */}
                    <div className="hidden md:flex flex-row gap-6 items-start">
                        {/* Sidebar - Aside Style */}
                        <aside className="w-64 shrink-0">
                            <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 px-2">
                                    Навигация
                                </p>

                                <div className="space-y-1">
                                    <button className="w-full text-left px-3.5 py-3 rounded-2xl bg-[#1B4D91]/8 text-[#1B4D91] font-bold text-[13px] flex items-center gap-3">
                                        <InfoIcon className="w-4 h-4" />
                                        О компании
                                    </button>
                                    <button className="w-full text-left px-3.5 py-3 rounded-2xl text-slate-600 hover:bg-slate-50 font-bold text-[13px] flex items-center gap-3 transition-colors">
                                        <Building2 className="w-4 h-4" />
                                        Реквизиты
                                    </button>
                                </div>

                                <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#1B4D91]/5 border border-[#1B4D91]/10 p-4">
                                    <div className="size-5 rounded-lg bg-[#1B4D91]/10 flex items-center justify-center shrink-0 mt-0.5">
                                        <Sparkles className="size-3 text-[#1B4D91]" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-[11px] font-black uppercase tracking-wider text-[#1B4D91]">
                                            Birga Quramiz
                                        </p>
                                        <p className="text-[11px] font-bold text-[#1B4D91]/80 leading-snug">
                                            Доступ в мир строительных материалов.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* Content Area */}
                        <div className="flex-1 min-w-0 space-y-6">
                            {/* Detailed Info Section */}
                            <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-10 flex flex-col gap-8">
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-black text-[#1B4D91] tracking-tight uppercase text-[20px] mb-8">
                                        О компании
                                    </h2>

                                    <div className="space-y-6 text-[15px] text-slate-600 font-medium leading-[1.8]">
                                        <p>
                                            <strong className="text-[#1B4D91]">Birga-Quramiz.uz</strong> — это современный строительный маркетплейс, объединяющий проверенных производителей, поставщиков и покупателей по всему Узбекистану. Мы создаём удобную и прозрачную платформу, где можно быстро найти качественные строительные материалы, товары для ремонта, наружной и внутренней отделки по конкурентным ценам с доставкой по Ташкенту и регионам страны.
                                        </p>

                                        <p>
                                            На платформе <strong className="text-[#1B4D91]">Birga Quramiz</strong> представлен широкий ассортимент продукции: общестроительные материалы, инструменты, крепёж, лакокрасочная продукция, сантехнические и электротехнические комплектующие, оборудование и многое другое. Мы сотрудничаем с надёжными поставщиками, чтобы гарантировать качество, прозрачность цен и актуальное наличие товаров.
                                        </p>

                                        <p>
                                            <strong className="text-[#1B4D91]">Birga Quramiz</strong> делает процесс закупки простым и удобным: вы можете оформить заказ онлайн, выбрать подходящий способ оплаты — наличный расчёт, банковскую карту или онлайн-платёж, а также воспользоваться возможностью покупки в рассрочку. Наша служба поддержки и AI-консультант помогут вам с выбором и ответят на все вопросы.
                                        </p>

                                        <p>
                                            <strong className="text-[#1B4D91]">Birga Quramiz</strong> — это современный подход к строительству, экономия вашего времени и надёжное партнёрство на каждом этапе вашего проекта.
                                        </p>
                                    </div>
                                </div>

                                <div className="h-px bg-slate-100 w-full" />

                                <div className="space-y-6">
                                    <h2 className="text-2xl font-black text-[#1B4D91] tracking-tight uppercase text-[20px] mb-6">
                                        Реквизиты компании
                                    </h2>

                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Наименование</span>
                                                <span className="text-[14px] font-bold text-slate-700 leading-relaxed"></span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">ИНН</span>
                                                <span className="text-[14px] font-bold text-slate-700"></span>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Адрес</span>
                                                <span className="text-[14px] font-bold text-slate-700 leading-relaxed">г. Ташкент</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Email</span>
                                                <span className="text-[14px] font-bold text-[#1B4D91] underline">info@birgaquramiz.uz</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* CTA */}
                            <div className="rounded-3xl bg-gradient-to-r from-[#1B4D91] to-[#1B4D91]/90 p-10 text-white text-center shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                                <div className="relative z-10">
                                    <h2 className="text-2xl font-black mb-4">Готовы начать строительство?</h2>
                                    <p className="text-white/70 font-bold text-[14px] mb-8 max-w-md mx-auto">Присоединяйтесь к тысячам довольных клиентов сегодня.</p>
                                    <Button size="lg" className="bg-white text-[#1B4D91] hover:bg-slate-50 px-8 h-12 rounded-xl font-black text-[14px] group" asChild>
                                        <Link href="/catalog">
                                            Перейти в каталог
                                            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden space-y-4">
                        <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-6">
                            <h2 className="text-lg font-black text-[#1B4D91] mb-6 uppercase">О компании</h2>
                            <div className="space-y-4 text-[13px] text-slate-500 font-bold leading-relaxed">
                                <p>Birga-Quramiz.uz — крупнейший маркетплейс строительных материалов в Узбекистане.</p>
                                <p>Заказывайте материалы с доставкой и экономьте свое время.</p>
                                <p>Оплачивайте удобным способом: наличные, карта или кредит.</p>
                            </div>
                        </div>

                        <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-6">
                            <h2 className="text-lg font-black text-[#1B4D91] mb-4 uppercase text-[15px]">Реквизиты</h2>
                            <div className="space-y-4 text-[12px] text-slate-500 font-bold leading-relaxed">
                                <p>Birga-Quramiz</p>
                                <p>ИНН: </p>
                                <p>info@birgaquramiz.uz</p>
                            </div>
                        </div>

                        <div className="rounded-3xl bg-[#1B4D91] p-8 text-white text-center">
                            <h2 className="text-xl font-black mb-3">Начать покупки</h2>
                            <Button className="w-full bg-white text-[#1B4D91] hover:bg-slate-50 h-12 rounded-xl font-black" asChild>
                                <Link href="/catalog">В каталог</Link>
                            </Button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
