"use client";

import { useState } from "react";
import {
  Star, WifiOff, Wifi, Truck, MapPin, Timer,
  User, Package, CheckCircle, Navigation,
  Phone, MessageCircle, Car, Award, ShieldCheck,
  Image as ImageIcon, Sparkles,
} from "lucide-react";
import {
  type DriverInfo, type MilestoneKey,
  VEHICLE_LABELS, fmtTime, initials,
} from "@/lib/tracking";

// ── StarRating ─────────────────────────────────────────────────────────────────
export function StarRating({ rating }: { rating: number }) {
  const rounded = Math.round(rating * 2) / 2;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`size-3 ${n <= rounded ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-200"}`} />
      ))}
      <span className="ml-1 text-[11px] font-bold text-slate-600">{rating.toFixed(1)}</span>
    </div>
  );
}

// ── LiveDot ────────────────────────────────────────────────────────────────────
export function LiveDot({ stale }: { stale: boolean }) {
  if (stale)
    return (
      <span className="flex items-center gap-1 text-amber-500 text-[11px] font-semibold">
        <WifiOff className="size-3" /> Нет обновлений
      </span>
    );
  return (
    <span className="flex items-center gap-1.5 text-emerald-600 text-[11px] font-semibold">
      <span className="relative flex size-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
      </span>
      В сети
    </span>
  );
}

// ── ArrivingSoonBanner ─────────────────────────────────────────────────────────
export function ArrivingSoonBanner() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 shadow-sm">
      <div className="relative flex shrink-0 size-4">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
        <span className="relative inline-flex size-4 rounded-full bg-amber-500 items-center justify-center">
          <Truck className="size-2.5 text-white" />
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-black text-amber-900">Курьер скоро прибудет!</p>
        <p className="text-[11px] text-amber-700">Будьте готовы принять заказ</p>
      </div>
    </div>
  );
}

// ── ApproachingBanner ──────────────────────────────────────────────────────────
export function ApproachingBanner({ distanceM }: { distanceM: number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-4 shadow-sm">
      <div className="relative flex shrink-0 size-4">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex size-4 rounded-full bg-emerald-500 items-center justify-center">
          <MapPin className="size-2.5 text-white" />
        </span>
      </div>
      <div>
        <p className="text-[14px] font-black text-emerald-900">Курьер рядом!</p>
        <p className="text-[11px] text-emerald-700">До вас около {Math.round(distanceM)} м</p>
      </div>
    </div>
  );
}

// ── EtaChip ────────────────────────────────────────────────────────────────────
export function EtaChip({ minutes, approaching }: { minutes: number | null; approaching: boolean }) {
  if (minutes === null) return null;
  return (
    <div className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 transition-all duration-500 ${
      approaching ? "border-emerald-200 bg-emerald-50 shadow-md shadow-emerald-100" : "border-white/20 bg-white/10"
    }`}>
      <Timer className={`size-4 ${approaching ? "text-emerald-600" : "text-white/80"}`} />
      <div>
        <p className={`text-[10px] font-bold uppercase tracking-wider ${approaching ? "text-emerald-600/70" : "text-white/60"}`}>
          Прибудет через
        </p>
        <p className={`text-[18px] font-black leading-none ${approaching ? "text-emerald-700" : "text-white"}`}>
          {minutes} мин
        </p>
      </div>
    </div>
  );
}

// ── ProgressStepper ────────────────────────────────────────────────────────────
const PROGRESS_STEPS = [
  { key: "ACCEPTED",  label: "Назначен",   icon: <User className="size-3.5" /> },
  { key: "PICKED_UP", label: "Забрал",     icon: <Package className="size-3.5" /> },
  { key: "DELIVERED", label: "Доставлено", icon: <CheckCircle className="size-3.5" /> },
];

export function ProgressStepper({ currentStatus }: { currentStatus: string }) {
  const currentIndex = PROGRESS_STEPS.findIndex((s) => s.key === currentStatus);
  return (
    <div className="rounded-3xl bg-white border border-slate-100 shadow-sm px-7 py-6">
      <div className="flex items-center">
        {PROGRESS_STEPS.map((step, i) => {
          const done   = i <= currentIndex;
          const active = i === currentIndex;
          return (
            <div key={step.key} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5 flex-none">
                <div className={`flex size-10 items-center justify-center rounded-full transition-all duration-500 ${
                  active ? "bg-[#1B4D91] shadow-[0_0_0_5px_rgba(27,77,145,0.15)] scale-110" : done ? "bg-[#1B4D91]" : "bg-slate-100"
                }`}>
                  <span className={done ? "text-white" : "text-slate-300"}>{step.icon}</span>
                </div>
              </div>
              {i < PROGRESS_STEPS.length - 1 && (
                <div className="mx-1 h-0.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${done ? "w-full bg-[#1B4D91]" : "w-0"}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex">
        {PROGRESS_STEPS.map((step, i) => {
          const done = i <= currentIndex;
          return (
            <div key={step.key} className="flex-1 text-center">
              <span className={`text-[10px] font-bold ${done ? "text-[#1B4D91]" : "text-slate-300"}`}>{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── MilestonesTimeline ─────────────────────────────────────────────────────────
const MILESTONE_CFG: Record<MilestoneKey, { label: string; icon: React.ReactNode }> = {
  ACCEPTED:  { label: "Курьер назначен",  icon: <User className="size-3.5" /> },
  PICKED_UP: { label: "Заказ забран",     icon: <Package className="size-3.5" /> },
  NEAR:      { label: "Курьер рядом",     icon: <Navigation className="size-3.5" /> },
  DELIVERED: { label: "Доставлено",       icon: <CheckCircle className="size-3.5" /> },
};

export function MilestonesTimeline({
  milestones, currentStatus, isNear,
}: {
  milestones: Partial<Record<MilestoneKey, number>>;
  currentStatus: string;
  isNear: boolean;
}) {
  const steps: MilestoneKey[] = ["ACCEPTED", "PICKED_UP", "NEAR", "DELIVERED"];
  const statusOrder = ["ACCEPTED", "PICKED_UP", "DELIVERED"];
  const currentIdx = statusOrder.indexOf(currentStatus);

  return (
    <div className="rounded-3xl bg-white border border-slate-100 shadow-sm px-7 py-5">
      <p className="mb-4 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">История доставки</p>
      <div className="flex flex-col gap-0">
        {steps.map((key, i) => {
          const cfg    = MILESTONE_CFG[key];
          const ts     = milestones[key];
          const isLast = i === steps.length - 1;

          let done = false;
          if (key === "DELIVERED")     done = currentStatus === "DELIVERED";
          else if (key === "NEAR")     done = isNear || currentStatus === "DELIVERED";
          else                         done = currentIdx >= statusOrder.indexOf(key);

          const isActive = (() => {
            if (key === "DELIVERED") return currentStatus === "DELIVERED";
            if (key === "NEAR")      return isNear && currentStatus !== "DELIVERED";
            if (key === "PICKED_UP") return currentStatus === "PICKED_UP" && !isNear;
            if (key === "ACCEPTED")  return currentStatus === "ACCEPTED";
            return false;
          })();

          return (
            <div key={key} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-all duration-500 ${
                  isActive ? "bg-[#1B4D91] shadow-[0_0_0_4px_rgba(27,77,145,0.12)] scale-110" : done ? "bg-[#1B4D91]" : "bg-slate-100"
                }`}>
                  <span className={done ? "text-white" : "text-slate-300"}>{cfg.icon}</span>
                </div>
                {!isLast && (
                  <div className={`mt-0.5 w-0.5 flex-1 rounded-full transition-colors duration-700 ${done ? "bg-[#1B4D91]" : "bg-slate-100"}`}
                    style={{ minHeight: 28 }} />
                )}
              </div>
              <div className={`flex flex-1 items-start justify-between pb-5 ${isLast ? "pb-0" : ""}`}>
                <p className={`text-[13px] font-semibold ${isActive ? "text-[#1B4D91]" : done ? "text-slate-700" : "text-slate-300"}`}>
                  {cfg.label}
                </p>
                {ts ? (
                  <span className="shrink-0 text-[11px] text-slate-400 tabular-nums">{fmtTime(ts)}</span>
                ) : done ? (
                  <span className="shrink-0 text-[11px] text-slate-300">сегодня</span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── DriverCard ─────────────────────────────────────────────────────────────────
export function DriverCard({ driver, isConnected }: { driver: DriverInfo; isConnected: boolean }) {
  const telegramHref = driver.telegramUsername
    ? `https://t.me/${driver.telegramUsername.replace("@", "")}`
    : driver.phone
    ? `tg://resolve?phone=${driver.phone.replace(/\D/g, "")}`
    : null;

  return (
    <div className="rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-50 bg-slate-50/70 px-7 py-3">
        <ShieldCheck className="size-3.5 text-[#1B4D91]" />
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1B4D91]">Проверенный курьер</p>
      </div>
      <div className="px-7 py-5">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <div className="flex size-14 items-center justify-center rounded-full bg-[#1B4D91]/8 text-[17px] font-black text-[#1B4D91]">
              {initials(driver.name)}
            </div>
            {isConnected && (
              <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full border-2 border-white bg-emerald-500">
                <Wifi className="size-2 text-white" />
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-black text-slate-800 leading-tight">{driver.name}</p>
            {driver.rating != null && <div className="mt-1"><StarRating rating={driver.rating} /></div>}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {driver.vehicleType && (
                <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                  <Car className="size-3" /> {VEHICLE_LABELS[driver.vehicleType] ?? driver.vehicleType}
                </span>
              )}
              {driver.vehiclePlate && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {driver.vehiclePlate}
                </span>
              )}
              {driver.deliveriesCompleted != null && driver.deliveriesCompleted >= 10 && (
                <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                  <Award className="size-3 text-amber-500" /> {driver.deliveriesCompleted}+ доставок
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-5 flex gap-2.5">
          <a href={`tel:${driver.phone}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1B4D91] py-3 text-[13px] font-bold text-white transition hover:bg-[#163b92] active:scale-[0.97]">
            <Phone className="size-4" /> Позвонить
          </a>
          {telegramHref && (
            <a href={telegramHref}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#229ED9] py-3 text-[13px] font-bold text-white transition hover:bg-[#1a8fca] active:scale-[0.97]">
              <MessageCircle className="size-4" /> Telegram
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── PodPhoto ───────────────────────────────────────────────────────────────────
export function PodPhoto({ url }: { url: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-3xl bg-white border border-emerald-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-7 py-4 border-b border-emerald-50">
        <ImageIcon className="size-4 text-emerald-600" />
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-600">Фото подтверждения</p>
      </div>
      <button onClick={() => setExpanded((v) => !v)} className="block w-full text-left"
        aria-label={expanded ? "Свернуть" : "Развернуть"}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="Подтверждение доставки"
          className={`w-full object-cover transition-all duration-300 ${expanded ? "max-h-[500px]" : "max-h-52"}`} />
      </button>
      <p className="px-7 py-3 text-[11px] text-slate-400">
        Нажмите на фото, чтобы {expanded ? "свернуть" : "развернуть"}
      </p>
    </div>
  );
}

// ── DeliveredCelebration ───────────────────────────────────────────────────────
export function DeliveredCelebration({
  driverName, podPhotoUrl, deliveredAt,
}: {
  driverName: string;
  podPhotoUrl?: string;
  deliveredAt: number | null;
}) {
  return (
    <>
      <div className="rounded-3xl bg-gradient-to-b from-emerald-500 to-emerald-600 px-7 py-10 text-center relative overflow-hidden shadow-lg shadow-emerald-200">
        <div className="pointer-events-none absolute -left-12 -top-12 size-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -right-8 -bottom-8 size-32 rounded-full bg-white/10" />
        <div className="relative mx-auto mb-5 flex size-20 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/30" />
          <div className="relative flex size-20 items-center justify-center rounded-full bg-white shadow-lg">
            <CheckCircle className="size-10 text-emerald-500" />
          </div>
        </div>
        <p className="text-[28px] font-black text-white leading-tight">Доставлено!</p>
        <p className="mt-2 text-[14px] text-white/80">{driverName} доставил ваш заказ</p>
        {deliveredAt && <p className="mt-1 text-[12px] text-white/60">в {fmtTime(deliveredAt)}</p>}
        <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-4 py-2.5">
          <Sparkles className="size-4 text-white/80" />
          <p className="text-[13px] font-semibold text-white">Спасибо, что выбрали нас!</p>
        </div>
      </div>
      {podPhotoUrl && <PodPhoto url={podPhotoUrl} />}
      <div className="flex items-center gap-4 rounded-3xl bg-white border border-slate-100 shadow-sm px-7 py-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle className="size-5 text-emerald-500" />
        </div>
        <div>
          <p className="text-[14px] font-bold text-slate-800">Заказ выполнен</p>
          <p className="text-[12px] text-slate-500">
            Курьер: {driverName}{deliveredAt ? ` · ${fmtTime(deliveredAt)}` : ""}
          </p>
        </div>
      </div>
    </>
  );
}
