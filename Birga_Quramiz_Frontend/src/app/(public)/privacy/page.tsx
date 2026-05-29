import type { Metadata } from "next";
import { Shield, Lock, Eye, Database, Share2, UserCheck, Cookie, RefreshCw, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Политика конфиденциальности",
  description: "Политика конфиденциальности маркетплейса Birga Quramiz",
};

const SECTIONS = [
  {
    id: "general",
    icon: Shield,
    title: "Общие положения",
    body: [
      "Настоящая Политика конфиденциальности определяет порядок сбора, хранения, использования и защиты персональных данных пользователей платформы Birga Quramiz.",
      "Используя Платформу, вы соглашаетесь с условиями настоящей Политики. Если вы не согласны с данными условиями, пожалуйста, прекратите использование Платформы.",
    ],
  },
  {
    id: "data",
    icon: Database,
    title: "Какие данные мы собираем",
    body: [
      "Мы можем собирать следующие категории данных:",
    ],
    bullets: [
      "Идентификационные данные: имя, номер телефона, адрес электронной почты",
      "Данные аккаунта: роль пользователя (покупатель, продавец), история заказов и отзывов",
      "Данные об устройстве: IP-адрес, тип браузера, операционная система",
      "Данные о транзакциях: информация о заказах, способах оплаты и доставке",
      "Данные Telegram: при входе через Telegram — идентификатор, имя и фото профиля",
    ],
  },
  {
    id: "purpose",
    icon: Eye,
    title: "Цели обработки данных",
    body: [
      "Собранные данные используются исключительно для обеспечения работы сервиса:",
    ],
    bullets: [
      "Регистрации и идентификации пользователей на Платформе",
      "Обработки заказов и проведения платежей",
      "Связи с пользователями по вопросам заказов и поддержки",
      "Улучшения качества сервиса и функциональности Платформы",
      "Соблюдения требований законодательства Республики Узбекистан",
    ],
  },
  {
    id: "storage",
    icon: Lock,
    title: "Хранение и защита данных",
    body: [
      "Ваши данные хранятся на защищённых серверах. Мы применяем технические и организационные меры для предотвращения несанкционированного доступа, включая шифрование передаваемых данных (SSL/TLS) и ограничение доступа к базам данных.",
      "Данные хранятся в течение срока, необходимого для выполнения указанных целей, либо в течение срока, установленного применимым законодательством.",
    ],
  },
  {
    id: "sharing",
    icon: Share2,
    title: "Передача данных третьим лицам",
    body: [
      "Мы не продаём и не передаём ваши персональные данные третьим лицам, за исключением следующих случаев:",
    ],
    bullets: [
      "Обработка платежей через сервисы Payme и Click (в соответствии с их политиками конфиденциальности)",
      "Требование со стороны уполномоченных органов в соответствии с законодательством Республики Узбекистан",
      "Наличие вашего явного согласия на передачу данных",
    ],
  },
  {
    id: "rights",
    icon: UserCheck,
    title: "Права пользователей",
    body: [
      "В соответствии с применимым законодательством вы имеете право:",
    ],
    bullets: [
      "Запросить доступ к своим персональным данным",
      "Потребовать исправления неточных или устаревших данных",
      "Запросить удаление своих данных (с учётом законодательных ограничений)",
      "Отозвать согласие на обработку данных в любое время",
    ],
    footer: "Для реализации своих прав обратитесь к нам: info@birga-quramiz.uz",
  },
  {
    id: "cookies",
    icon: Cookie,
    title: "Файлы cookie",
    body: [
      "Платформа использует файлы cookie для обеспечения корректной работы сервиса, хранения сессий авторизации и сбора аналитических данных.",
      "Вы можете отключить cookie в настройках браузера, однако это может повлиять на работу некоторых функций Платформы.",
    ],
  },
  {
    id: "changes",
    icon: RefreshCw,
    title: "Изменения в Политике",
    body: [
      "Мы оставляем за собой право вносить изменения в настоящую Политику. Актуальная версия всегда доступна на данной странице.",
      "Продолжая пользоваться Платформой после внесения изменений, вы принимаете обновлённую Политику.",
    ],
  },
  {
    id: "contact",
    icon: Mail,
    title: "Контактная информация",
    body: [
      "По всем вопросам, связанным с обработкой персональных данных, обращайтесь:",
    ],
    bullets: [
      "Email: info@birga-quramiz.uz",
      "Сайт: birga-quramiz.uz",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-20 pt-6 md:pt-10">
      <div className="max-w-[1488px] mx-auto px-4 md:px-10 flex flex-col gap-6">

        {/* ── Hero ── */}
        <div className="rounded-3xl bg-[#1B4D91] px-7 py-10 md:px-14 md:py-16 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 size-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="absolute -left-8 -bottom-12 size-48 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1.5">
              <Shield className="size-3.5 text-white/70" />
              <span className="text-[11px] font-black uppercase tracking-[0.16em] text-white/70">Birga Quramiz</span>
            </div>
            <h1 className="text-[24px] md:text-[32px] font-black text-white leading-tight mb-3">
              Политика конфиденциальности
            </h1>
            <p className="text-[14px] md:text-[15px] text-white/60 leading-relaxed font-medium">
              Мы заботимся о защите ваших данных. В этом документе описано, какую информацию мы собираем и как её используем.
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
                    {section.bullets && (
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
                    {section.footer && (
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
