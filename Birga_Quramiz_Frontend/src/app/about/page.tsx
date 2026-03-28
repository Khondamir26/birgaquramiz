"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  Compass,
  Globe,
  BadgeCheck,
  Gauge,
  ScanSearch,
  Star,
  HeartHandshake,
  ArrowRight,
  Package,
  MapPin,
  CheckCircle2,
  Mail,
} from "lucide-react";

const STATS = [
  { value: "500+",    labelKey: "sellersLabel",  icon: Globe       },
  { value: "10 000+", labelKey: "productsLabel", icon: Package     },
  { value: "14",      labelKey: "regionsLabel",  icon: MapPin      },
  { value: "5 000+",  labelKey: "ordersLabel",   icon: CheckCircle2},
];

const FEATURES = [
  { icon: Compass,    titleKey: "mission",  descKey: "missionDesc"  },
  { icon: Globe,      titleKey: "everyone", descKey: "everyoneDesc" },
  { icon: BadgeCheck, titleKey: "quality",  descKey: "qualityDesc"  },
  { icon: Gauge,      titleKey: "speed",    descKey: "speedDesc"    },
];

const VALUES = [
  { icon: ScanSearch,    titleKey: "transparency", descKey: "transparencyDesc" },
  { icon: Star,          titleKey: "excellence",   descKey: "excellenceDesc"   },
  { icon: HeartHandshake,titleKey: "community",    descKey: "communityDesc"    },
];

export default function AboutPage() {
  const t = useTranslations("About");

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-20 pt-6 md:pt-10">
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 flex flex-col gap-6">

        {/* ── Hero ── */}
        <div className="rounded-3xl bg-[#1B4D91] px-7 py-10 md:px-14 md:py-16 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 size-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="absolute -left-8 -bottom-12 size-48 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-[22px] md:text-[28px] font-black text-white leading-tight mb-4 whitespace-nowrap">
              {t("hero.title")}
            </h1>
            <p className="text-[14px] md:text-[16px] text-white/65 leading-relaxed font-medium">
              {t("hero.subtitle")}
            </p>
          </div>
          {/* Decorative logo */}
          <Image
            src="/icons/icon-512x512.png"
            alt="Birga Quramiz"
            width={130}
            height={130}
            className="hidden md:block absolute right-10 top-1/2 -translate-y-1/2 object-contain opacity-85 pointer-events-none"
          />
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {STATS.map(({ value, labelKey, icon: Icon }) => (
            <div
              key={labelKey}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 md:p-6 flex flex-col gap-3"
            >
              <div className="size-10 rounded-xl bg-[#1B4D91]/8 flex items-center justify-center">
                <Icon className="size-5 text-[#1B4D91]" />
              </div>
              <div>
                <p className="text-[26px] md:text-[32px] font-black text-[#1B4D91] leading-none">{value}</p>
                <p className="text-[12px] text-slate-400 font-semibold mt-1">{t(`stats.${labelKey}`)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Who We Are + Features ── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7 md:p-10">
          {/* Header */}
          <div className="flex items-start gap-5 mb-6">
            <div className="size-12 rounded-2xl bg-[#1B4D91]/8 flex items-center justify-center shrink-0">
              <svg className="size-6" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0 C1.95948464 -0.00457438 3.91896769 -0.00988362 5.87844849 -0.0158844 C9.96476806 -0.02476499 14.05089168 -0.02245062 18.13720703 -0.01245117 C23.33021221 -0.00097121 28.52253634 -0.02118442 33.71545219 -0.05036831 C37.75652238 -0.068863 41.79743335 -0.06841159 45.83853531 -0.06273079 C47.75117065 -0.06257918 49.66381792 -0.0684885 51.5764122 -0.08102226 C66.38236937 -0.16440536 80.56153172 1.02151698 93.8828125 8.18359375 C101.63996428 12.31042585 106.6899754 16.00832115 111.5078125 20.43359375 C118.03574624 26.59548331 119.46185398 29.12740707 125.36036491 35.06316376 C132.11499023 35.18066406 143.19140625 35.01171875 164.75567627 34.73937988 C181.37004122 34.49989558 198.32798767 34.27325439 221.42066932 33.91281482 C241.02720855 39.93536713 258.16796875 56.07421875 272.7578125 76.12109375 C281.11258363 99.33015629 281.02929688 124.20410156 281.0546875 135.76171875 C280.86762966 163.62394128 274.35581937 177.56557336 262.5078125 189.43359375 C249.24244033 199.75513605 230.41408219 206.59119944 209.21484375 205.7265625 C185.7869873 205.6395874 157.13661588 205.54801677 134.5078125 205.43359375 C134.5078125 202.79359375 134.5078125 200.15359375 134.5078125 197.43359375 C118.66471751 197.95989903 115.99361654 199.24109945 111.5078125 202.43359375 C93.14693618 205.76381721 66.5078125 205.43359375 59.5078125 205.43359375 C59.5078125 202.79359375 59.5078125 200.15359375 59.5078125 197.43359375 C-10.4921875 205.43359375 -17.4921875 205.43359375 -32.26879883 205.65332031 C-58.50179271 206.16725228 -66.52172852 199.82983398 -72.6015625 197.921875 C-85.4921875 197.43359375 -85.4921875 200.07359375 -85.4921875 205.43359375 C-140.06860352 205.73535156 -156.79712868 205.81310272 -163.15369225 205.85651398 C-184.75663016 205.94168949 -195.4921875 201.43359375 -215.4921875 187.43359375 C-231.97319563 158.97404551 -231.890625 143.34765625 -231.90234375 120.30078125 C-231.8157163 98.41437987 -224.8046875 78.30859375 -178.4921875 37.43359375 C-157.67273594 34.13767548 -112.77880859 35.02319336 -91.57774734 35.39919853 C-71.59051514 32.2727356 -66.4921875 24.43359375 0 0 Z" fill="#1E81CE" transform="translate(231.4921875,306.56640625)"/>
                <path d="M0 0 C9.89352365 -0.09332315 29.68081665 -0.20724869 56.81176758 -0.37950897 C81.85234745 -0.67169543 99.8041097 3.42075881 114.81762695 17.54052734 C132.54199219 73.02001953 132.5078125 83.12890625 119.5 125.1875 C105.35221129 136 98 136 98 136 C98 105.31 98 74.62 98 43 C81 43 81 43 81 137 C55.59 137 30.18 137 4 137 C4 139.97 4 142.94 4 146 C-7.22 146 -13 146 -13 146 C-0.49683278 131.50294261 3.16113281 106.23193359 3.203125 93.8984375 C3.24570859 67.58090389 3.32357025 42.17903519 0.64471436 5.33169556 C0 3 0 3 0 0 Z" fill="#9AC8FE" transform="translate(363,358)"/>
                <path d="M0 0 C1.74629211 0.00052023 5.23887634 -0.00151062 18.68945312 0.0869751 C58.48051509 0.05815848 70.66739035 0.21599589 82.15234375 5.80078125 C116.95874023 61.29248047 117.0234375 73.66796875 117.07788086 94.14208984 C117.20360558 120.95220417 117.26915638 135.07954257 109.67763424 163.51659966 C95.38078511 171.36328125 82.65234375 171.36328125 82.65234375 52.36328125 C65.65234375 52.36328125 65.65234375 180.36328125 57.65234375 188.36328125 C34.55234375 188.36328125 -20.34765625 180.36328125 -20.34765625 52.36328125 C-37.34765625 52.36328125 -37.34765625 171.36328125 -55.8246437 171.36328125 C-71.79879931 151.06872435 -71.76757812 141.64282227 -71.91374969 91.42984104 C-72.12461163 50.21253079 -68.54289824 33.49922946 -53.625 17.61328125 C-27.5012468 -0.07099936 -13.92841779 -0.13472092 0 0 Z" fill="#9AC8FE" transform="translate(233.34765625,323.63671875)"/>
                <path d="M0 0 C1.72876615 0.00561072 18.68945312 0.0869751 59.5703125 0.29296875 C59.25837786 2.02223749 57.01298523 13.55596924 56.42504883 25.89746094 C56.38500977 58.90039062 56.35423756 76.69770432 56.31036377 108.88259888 C59.18047626 131.0694528 72.5703125 145.29296875 72.5703125 146.29296875 C55.5703125 146.29296875 55.5703125 137.29296875 -21.4296875 137.29296875 C-21.4296875 75.25296875 -38.4296875 43.29296875 -38.4296875 136.29296875 C-64.4296875 120.29296875 -72.77978516 79.78417969 -72.86181641 73.10546875 C-73.23555567 51.2660964 -54.84765625 17.61328125 -13 0 C-13.92841779 -0.13472092 0 0 0 0 Z" fill="#9AC8FE" transform="translate(89.4296875,357.70703125)"/>
                <path d="M0 0 C12.15106794 8.394642 23.8125 34.3125 13.25 76.8125 C-19.75 95.8125 -62 83.5 -80.0625 44.5 C-79.60787755 30.33093352 -64.9375 7.375 0 0 Z" fill="#1E81CE" transform="translate(283.75,203.1875)"/>
                <path d="M0 0 C9.26411755 5.45325479 22.71875 35.48046875 12.421875 51.359375 C-13.9609375 65.81640625 -49.9609375 35.046875 -39.21484375 5.8359375 C-28.30405799 -3.74185633 -13.33195126 -6.0246919 0 0 Z" fill="#9AC8FE" transform="translate(126.625,250.4375)"/>
                <path d="M0 0 C11.75671785 9.10927916 22.71875 35.48046875 12.9921875 74.59375 C-20 95 -64.40234375 82.109375 -80.88671875 49.9921875 C-81.49557136 33.91008058 -67.30859375 7.96875 0 0 Z" fill="#1E81CE" transform="translate(430,238)"/>
                <path d="M0 0 C11.82306027 9.04546342 21.53125 35.2265625 11.75 73.75 C-23.11499023 94.21923828 -64.6640625 81.70703125 -82.25 42.9375 C-82.04831663 28.07343598 -66.4140625 5.2890625 0 0 Z" fill="#1E81CE" transform="translate(141,239)"/>
                <path d="M0 0 C8.01716864 5.68513059 15.484375 21.76171875 7.421875 52.01171875 C-18.015625 64.13671875 -52.87109375 25.39453125 -46.765625 9.63671875 C-35.30596551 -5.00617949 -16.46137455 -9.75404652 0 0 Z" fill="#99C8FE" transform="translate(419.515625,252.23828125)"/>
                <path d="M0 0 C7.78161437 5.27700569 15.875 21.875 10.02734375 49.56640625 C-13.47265625 63.4453125 -52.4609375 32.578125 -41.5625 4.07421875 C-17.63694218 -6.58150278 -8.47779348 -4.78531703 0 0 Z" fill="#9AC8FE" transform="translate(274.125,218.125)"/>
                <path d="M0 0 C22.44 0 44.88 0 68 0 C68.495 8.415 69 17 -1 17 C-0.67 11.39 -0.34 5.78 0 0 Z" fill="#1E80CD" transform="translate(222,495)"/>
                <path d="M0 0 C0.84046875 0.72058594 25.96462261 22.65638219 43 82 C37.06 93 25 93 25 93 C20.87648041 58.36346079 9.45747444 31.19323781 -15.1875 11.75 C-37.15696041 -4.86547524 -92.23046875 -7.78125 -157.83984375 30.99609375 C-176.58953554 70.19329776 -179 93 -197 93 C-198.3502468 61.94432358 -165.5625 10.8125 -81.42578125 -27.9140625 C-22.22617553 -28.9574237 0 0 0 0 Z" fill="#1D81CE" transform="translate(333,138)"/>
              </svg>
            </div>
            <h2 className="text-[20px] md:text-[24px] font-black text-[#1B4D91] pt-2">{t("who.title")}</h2>
          </div>
          {/* Paragraph */}
          <p className="text-[14px] md:text-[15px] text-slate-600 font-medium leading-relaxed mb-8">
            {t("who.p1")} {t("who.p2")}
          </p>
          {/* Divider */}
          <div className="h-px bg-slate-100 mb-8" />
          {/* Features grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {FEATURES.map(({ icon: Icon, titleKey, descKey }) => (
              <div
                key={titleKey}
                className="group rounded-[16px] bg-[#F0F2F5] border border-slate-100 p-5 flex gap-4 transition-all hover:border-[#1B4D91]/20 hover:bg-white hover:shadow-sm"
              >
                <div className="size-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0 transition-colors group-hover:bg-[#1B4D91] group-hover:border-[#1B4D91]">
                  <Icon className="size-5 text-[#1B4D91] transition-colors group-hover:text-white" />
                </div>
                <div>
                  <h3 className="text-[14px] font-black text-slate-800 mb-1">{t(`features.${titleKey}`)}</h3>
                  <p className="text-[12px] text-slate-500 font-medium leading-relaxed">{t(`features.${descKey}`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Values ── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7 md:p-10">
          <div className="flex items-start gap-5 mb-8">
            <div className="size-12 rounded-2xl bg-[#1B4D91]/8 flex items-center justify-center shrink-0">
              <svg className="size-6" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0 C4.75814358 2.66873921 8.00029965 6.12589896 9.75 11.375 C10.88328419 18.99891179 9.59240455 23.87785202 5.1875 30.12109375 C4.37598218 31.20646422 3.56337085 32.29101748 2.75 33.375 C1.70695465 34.80237897 0.66540275 36.23084996 -0.375 37.66015625 C-2.75748653 40.9199189 -5.15638195 44.16679969 -7.56640625 47.40625 C-11.02140173 52.05515144 -14.42707015 56.73777529 -17.8125 61.4375 C-18.34512451 62.17629395 -18.87774902 62.91508789 -19.42651367 63.67626953 C-21.03513408 65.90861088 -22.64274814 68.14167316 -24.25 70.375 C-32.66033702 82.06142692 -41.12722924 93.70258702 -49.69873047 105.27148438 C-51.0821501 107.14739617 -52.45232286 109.0318865 -53.81640625 110.921875 C-65.38102148 126.77042596 -78.89250717 137.73438204 -98.65835571 140.92521667 C-104.55275063 141.61917076 -110.46512409 141.51941878 -116.39208984 141.5168457 C-128.79163742 141.53308237 -142.18496704 141.58500671 -159.492176 141.65553446 C-169.87444709 141.68862875 -180.25683594 141.70092773 -201.31502879 141.7702834 C-212.43577194 141.79744911 -224.84912109 141.8449707 -238.16522594 141.9305473 C-246.26997447 143.74916884 -253.375 150.625 -257.25 154.375 C-260.26947899 153.02180663 -264.69219971 149.17330933 -271.17141724 142.68151855 C-276.19493661 137.64104416 -283.93231201 129.87942505 -293.10192517 120.68252651 C-307.03842168 106.69431378 -320.90139772 92.79980823 -339.25 74.375 C-337.45691005 70.51489002 -332.125 65.0625 -322.52734375 56.17578125 C-316.41327998 50.8741719 -305.29101562 39.11328125 -289.72263149 23.23559147 C-272.45456339 17.34448804 -250.58984375 17.109375 -234.92773438 17.1015625 C-211.31927412 17.07990069 -201.0625 21.625 -193.43876648 25.82008362 C-184.96486046 32.11288655 -165.8125 31.07421875 -145.27990723 31.07568359 C-129.42472959 31.04721809 -113.23852539 31.0365448 -82.9453125 39.4453125 C-77.34350667 45.82156153 -76.875 60.03515625 -87.15234375 76.9296875 C-96.26121408 80.66670841 -116.85630798 80.72071838 -138.89770508 80.83129883 C-152.39498711 80.91606331 -164.71508789 80.97436523 -176.25 84.375 C-174.25 90.375 -166.96728516 90.55200195 -157.0390625 90.61328125 C-140.59912109 90.67016602 -126.39374733 90.75533772 -110.19813919 90.82848549 C-86.16602867 90.171905 -76.19140625 80.58984375 -67.30078125 60.984375 C-59.94873047 44.9909668 -49.4375 34.0625 -34.41113281 17.91992188 C-26.09375 8.828125 -20.65234375 2.66796875 0 0 Z" fill="#3D6EB5" transform="translate(440.25,291.625)"/>
                <path d="M0 0 C7.82504543 6.39144932 12.79187563 15.18761298 18.046875 23.671875 C26.86788607 8.02088998 35.17119879 -3.06772631 49.734375 -7.43359375 C63.421875 -8.640625 78.53192422 -8.37672899 98.390625 4.8671875 C112.00880509 29.3881422 111.42578125 44.125 71.046875 122.671875 C53.67819721 143.47413394 35.82856099 161.02844374 18.046875 178.671875 C6.54368819 168.31830079 -14.49609375 146.34716797 -30.953125 128.671875 C-54.18619101 101.50787813 -77.36984248 70.49809247 -76.234375 35.53515625 C-74.84116739 21.35152873 -57.953125 0.671875 0 0 Z" fill="#278ECD" transform="translate(280.953125,112.328125)"/>
                <path d="M0 0 C3.58592537 1.52199335 8.61907959 6.37857056 17.68336487 15.45542908 C29.45653627 27.26624767 47.07565104 44.91154509 72.51787519 70.41722798 C86.01824844 83.93850849 99.51146743 97.46690799 113 111 C99.46436891 125.82236677 84.5234375 141 78 147 C69.38092041 141.74168396 63.54003906 135.88061523 51.58415318 123.88833499 C36.6832796 108.95405626 18.610106 90.79264556 -35 37 C-29.74365234 29.51660156 -16.375 16.25 0 0 Z" fill="#4168B0" transform="translate(77,358)"/>
                <path d="M0 0 C4.37529008 4.83734168 15.95703125 24.90234375 18 37 C15.7582671 39.57384148 11.125 40.25 5.16796875 35.0234375 C-3.8125 20.375 -10 4 0 0 Z" fill="#18A1DB" transform="translate(207,32)"/>
                <path d="M0 0 C2.94645709 0.04760882 6.1875 1.9375 6.125 10.3125 C-8.12722443 19.57440401 -23.66689281 28.77781586 -32.875 24.3125 C-33.3125 18.3125 -22.390625 11.11328125 0 0 Z" fill="#0AB1E8" transform="translate(462.875,101.6875)"/>
                <path d="M0 0 C3.4375 0.75 5.4375 2.75 6.8984375 11.71875 C-11.08721326 38.25823775 -15.5625 39.75 -20.9375 38.75 C-22.5625 29.75 -5.59699556 -0.39277162 0 0 Z" fill="#04B8EC" transform="translate(394.5625,32.25)"/>
                <path d="M0 0 C7.70080039 -1.5072741 19.54711914 6.24389648 37.875 19.875 C38.05565151 22.94607567 35 27 31.29125977 28.24731445 C22.33984375 25.04296875 4 14 -2 9 C-2.25860135 4.94857881 0 0 0 0 Z" fill="#2C8AC9" transform="translate(130,102)"/>
                <path d="M0 0 C4.30087517 0.04474786 27.051857 0.75261864 30.46875 3.3984375 C30.46875 11.3984375 27.83689731 14.03029019 19.8125 13.6640625 C8.9799215 13.64848041 -10.30133166 13.62835584 -12.53125 11.3984375 C-13.16964286 3.3984375 -4.92165105 -0.0439303 0 0 Z" fill="#377ABE" transform="translate(142.53125,195.6015625)"/>
                <path d="M0 0 C3.88381608 0.29253863 21.53989226 1.40366179 24.37646484 4.24023438 C23.77646484 10.84023437 18.54280877 13.54420007 5.1550293 13.5559082 C-16.18138632 13.58483735 -20.01538637 7.37504411 -19.62353516 4.24023438 C-15.2814123 -1.75603052 -6.60813334 0.01737078 0 0 Z" fill="#1C9DD8" transform="translate(443.62353515625,195.759765625)"/>
                <path d="M0 0 C3.5 0.4375 6.9168396 10.12438965 6.84729327 39.90831594 C5.19384766 42.42773438 -3.5 43.4375 -6.9168396 10.12438965 C-6.87391388 7.00356608 -3.5 0.4375 0 0 Z" fill="#0AB1E8" transform="translate(298.5,6.5625)"/>
              </svg>
            </div>
            <h2 className="text-[20px] md:text-[24px] font-black text-[#1B4D91] pt-2">{t("values.title")}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {VALUES.map(({ icon: Icon, titleKey, descKey }) => (
              <div
                key={titleKey}
                className="rounded-[16px] bg-[#F0F2F5] border border-slate-100 p-5 flex flex-col gap-3"
              >
                <div className="size-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                  <Icon className="size-5 text-[#1B4D91]" />
                </div>
                <div>
                  <h3 className="text-[14px] font-black text-slate-800 mb-1">{t(`values.${titleKey}`)}</h3>
                  <p className="text-[12px] text-slate-500 font-medium leading-relaxed">{t(`values.${descKey}`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Company Details ── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7 md:p-10">
          <h2 className="text-[18px] font-black text-slate-800 mb-6">{t("details.title")}</h2>
          <div className="grid sm:grid-cols-2 gap-x-12 gap-y-5">
            {[
              { label: t("details.nameLabel"),    value: t("details.nameValue")    },
              { label: t("details.innLabel"),      value: "—"                       },
              { label: t("details.addressLabel"),  value: t("details.addressValue") },
              { label: t("details.emailLabel"),    value: "info@birgaquramiz.uz",   isEmail: true },
            ].map(({ label, value, isEmail }) => (
              <div key={label} className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
                {isEmail ? (
                  <a href={`mailto:${value}`} className="text-[14px] font-bold text-[#1B4D91] hover:underline flex items-center gap-1.5">
                    <Mail className="size-3.5" />{value}
                  </a>
                ) : (
                  <span className="text-[14px] font-bold text-slate-700">{value}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="rounded-3xl bg-[#1B4D91] px-8 py-10 md:px-14 md:py-12 relative overflow-hidden text-center">
          <div className="absolute -right-10 -top-10 size-52 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-[22px] md:text-[28px] font-black text-white mb-3">{t("cta.title")}</h2>
            <p className="text-[14px] text-white/60 font-medium mb-8 max-w-md mx-auto">{t("cta.subtitle")}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 h-12 px-8 rounded-full bg-white text-[#1B4D91] text-[14px] font-black shadow-lg hover:bg-slate-50 active:scale-95 transition-all group"
              >
                {t("cta.browse")}
                <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/seller-register"
                className="inline-flex items-center gap-2 h-12 px-8 rounded-full bg-white/10 border border-white/20 text-white text-[14px] font-black hover:bg-white/15 active:scale-95 transition-all"
              >
                {t("cta.becomeSeller")}
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
