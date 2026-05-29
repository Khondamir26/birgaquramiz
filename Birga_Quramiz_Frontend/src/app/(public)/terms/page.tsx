import type { Metadata } from "next";
import {
  Shield, Store, UserCheck, Package, ShoppingCart,
  CreditCard, Ban, AlertCircle, Copyright, RefreshCw, Scale, Mail,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Условия использования",
  description: "Условия использования маркетплейса Birga Quramiz",
};

const SECTIONS = [
  {
    id: "general",
    icon: Shield,
    title: "Общие положения",
    body: [
      "Настоящие Условия использования (далее — «Условия») регулируют доступ и использование платформы Birga Quramiz (далее — «Платформа»), включая все связанные сервисы, функции и контент.",
      "Используя Платформу, вы подтверждаете, что ознакомились с настоящими Условиями, понимаете их и соглашаетесь с ними. Если вы не согласны с Условиями, воздержитесь от использования Платформы.",
    ],
  },
  {
    id: "service",
    icon: Store,
    title: "Описание сервиса",
    body: [
      "Birga Quramiz — это онлайн-маркетплейс строительных материалов, соединяющий продавцов (поставщиков) и покупателей на территории Республики Узбекистан. Платформа предоставляет инструменты для размещения товаров, оформления заказов и проведения платежей.",
      "Мы выступаем в роли посредника и не несём ответственности за качество товаров, размещённых продавцами.",
    ],
  },
  {
    id: "account",
    icon: UserCheck,
    title: "Регистрация и аккаунт",
    body: [
      "Для полного доступа к функциям Платформы необходима регистрация. При регистрации вы обязуетесь:",
    ],
    bullets: [
      "Предоставить достоверную и актуальную информацию",
      "Сохранять конфиденциальность данных для входа в аккаунт",
      "Незамедлительно уведомлять нас о несанкционированном использовании вашего аккаунта",
    ],
    footer: "Вы несёте полную ответственность за все действия, совершённые через ваш аккаунт.",
  },
  {
    id: "sellers",
    icon: Package,
    title: "Правила для продавцов",
    body: [
      "Продавцы, размещающие товары на Платформе, обязуются:",
    ],
    bullets: [
      "Предоставлять достоверную информацию о товарах, включая описание, характеристики и цену",
      "Иметь право на продажу размещаемых товаров",
      "Соблюдать законодательство Республики Узбекистан в части торговли и защиты прав потребителей",
      "Своевременно обрабатывать заказы и уведомлять покупателей об их статусе",
    ],
    footer: "Платформа оставляет за собой право отклонять или удалять товары, не соответствующие требованиям модерации.",
  },
  {
    id: "buyers",
    icon: ShoppingCart,
    title: "Правила для покупателей",
    body: [
      "Покупатели обязуются:",
    ],
    bullets: [
      "Использовать Платформу только в законных целях",
      "Предоставлять корректные данные при оформлении заказов",
      "Не злоупотреблять процессом оформления заказов и не создавать ложных заявок",
    ],
    footer: "Покупатель несёт ответственность за точность указанных контактных данных и адреса доставки.",
  },
  {
    id: "payments",
    icon: CreditCard,
    title: "Платежи и возвраты",
    body: [
      "Оплата заказов осуществляется через платёжные системы Payme и Click, а также наличными при получении. Платформа не хранит данные банковских карт пользователей.",
      "Условия возврата товаров определяются продавцом в соответствии с законодательством о защите прав потребителей Республики Узбекистан. В спорных ситуациях покупатель вправе обратиться в службу поддержки Платформы.",
    ],
  },
  {
    id: "prohibited",
    icon: Ban,
    title: "Запрещённый контент",
    body: [
      "На Платформе запрещено размещать:",
    ],
    bullets: [
      "Товары, оборот которых ограничен или запрещён законодательством",
      "Недостоверную, вводящую в заблуждение информацию о товарах",
      "Контент, нарушающий права интеллектуальной собственности третьих лиц",
      "Материалы оскорбительного, дискриминационного или незаконного характера",
    ],
    footer: "Нарушение данных правил влечёт блокировку аккаунта.",
  },
  {
    id: "liability",
    icon: AlertCircle,
    title: "Ограничение ответственности",
    body: [
      "Платформа предоставляется «как есть». Мы не гарантируем бесперебойную работу сервиса и не несём ответственности за:",
    ],
    bullets: [
      "Убытки, возникшие в результате использования или невозможности использования Платформы",
      "Действия или бездействие продавцов или покупателей",
      "Ущерб, причинённый вследствие несанкционированного доступа к аккаунту пользователя",
    ],
  },
  {
    id: "ip",
    icon: Copyright,
    title: "Интеллектуальная собственность",
    body: [
      "Все материалы Платформы, включая дизайн, логотипы, тексты и программный код, являются собственностью Birga Quramiz или используются на законных основаниях.",
      "Копирование и использование материалов без письменного разрешения запрещено.",
    ],
  },
  {
    id: "changes",
    icon: RefreshCw,
    title: "Изменение условий",
    body: [
      "Мы вправе изменять настоящие Условия в любое время. Об изменениях мы уведомляем пользователей путём публикации обновлённой версии на данной странице.",
      "Продолжение использования Платформы после публикации изменений означает ваше согласие с новыми Условиями.",
    ],
  },
  {
    id: "law",
    icon: Scale,
    title: "Применимое право",
    body: [
      "Настоящие Условия регулируются законодательством Республики Узбекистан. Все споры, возникающие в связи с использованием Платформы, подлежат разрешению в судах Республики Узбекистан.",
    ],
  },
  {
    id: "contact",
    icon: Mail,
    title: "Контактная информация",
    body: [
      "По вопросам, связанным с настоящими Условиями, обращайтесь:",
    ],
    bullets: [
      "Email: info@birga-quramiz.uz",
      "Сайт: birga-quramiz.uz",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-20 pt-6 md:pt-10">
      <div className="max-w-[1488px] mx-auto px-4 md:px-10 flex flex-col gap-6">

        {/* ── Hero ── */}
        <div className="rounded-3xl bg-[#1B4D91] px-7 py-10 md:px-14 md:py-16 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 size-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="absolute -left-8 -bottom-12 size-48 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1.5">
              <Scale className="size-3.5 text-white/70" />
              <span className="text-[11px] font-black uppercase tracking-[0.16em] text-white/70">Birga Quramiz</span>
            </div>
            <h1 className="text-[24px] md:text-[32px] font-black text-white leading-tight mb-3">
              Условия использования
            </h1>
            <p className="text-[14px] md:text-[15px] text-white/60 leading-relaxed font-medium">
              Ознакомьтесь с правилами и условиями использования платформы Birga Quramiz для покупателей и продавцов.
            </p>
            <p className="mt-4 text-[12px] text-white/40 font-medium">
              Последнее обновление: апрель 2026 г.
            </p>
          </div>
        </div>

        {/* ── Content + TOC ── */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── Sticky TOC (desktop) ── */}
          <aside className="hidden lg:block w-[240px] shrink-0 sticky top-[88px]">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-3 px-1">
                Содержание
              </p>
              <nav className="flex flex-col gap-0.5">
                {SECTIONS.map((s, i) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[12.5px] font-semibold text-slate-500 transition hover:bg-[#1B4D91]/6 hover:text-[#1B4D91] group"
                  >
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-black text-slate-400 group-hover:bg-[#1B4D91]/10 group-hover:text-[#1B4D91] transition-colors">
                      {i + 1}
                    </span>
                    <span className="leading-tight">{s.title}</span>
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0 bg-white rounded-3xl border border-slate-100 shadow-sm divide-y divide-slate-100">
            {SECTIONS.map((section, i) => {
              const Icon = section.icon;
              return (
                <div key={section.id} id={section.id} className="px-7 py-8 md:px-10 md:py-9 scroll-mt-28">
                  {/* Section header */}
                  <div className="flex items-start gap-4 mb-5">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1B4D91]/8">
                      <Icon className="size-5 text-[#1B4D91]" />
                    </div>
                    <div className="pt-0.5">
                      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1B4D91]/50">
                        Раздел {i + 1}
                      </span>
                      <h2 className="text-[17px] md:text-[18px] font-black text-slate-800 leading-snug mt-0.5">
                        {section.title}
                      </h2>
                    </div>
                  </div>

                  {/* Body paragraphs */}
                  <div className="flex flex-col gap-3 pl-14">
                    {section.body.map((para, j) => (
                      <p key={j} className="text-[14px] text-slate-600 leading-[1.75] font-medium">
                        {para}
                      </p>
                    ))}

                    {/* Bullet list */}
                    {"bullets" in section && section.bullets && (
                      <ul className="flex flex-col gap-2 mt-1">
                        {section.bullets.map((item) => (
                          <li key={item} className="flex items-start gap-2.5">
                            <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-[#1B4D91]/40" />
                            <span className="text-[14px] text-slate-600 leading-[1.75] font-medium">{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Footer note */}
                    {"footer" in section && section.footer && (
                      <p className="mt-2 text-[13px] font-semibold text-[#1B4D91] bg-[#1B4D91]/5 rounded-xl px-4 py-3 border border-[#1B4D91]/10">
                        {section.footer}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
