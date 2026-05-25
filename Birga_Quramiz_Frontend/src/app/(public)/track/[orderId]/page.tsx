"use client";

import { useEffect, useState, useRef, memo, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  MapPin,
  Clock,
  Package,
  Truck,
  AlertCircle,
  Wifi,
  WifiOff,
  RefreshCcw,
  KeyRound,
  Camera,
  Phone,
  MessageSquare,
  Bell,
  Star,
  Send,
  ShieldCheck,
  Lock,
  TriangleAlert,
} from "lucide-react";
import { useOrderTracking } from "@/hooks/use-order-tracking";
import type { AssignmentStatus } from "@/hooks/use-order-tracking";
import { trackingApi } from "@/services/trackingApi";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";
const API_URL  = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

// ─── Stage definitions (P4-2 — delivery timeline) ────────────────────────────

interface Stage {
  id:           string;
  label:        string;
  sublabel?:    string;
  milestoneKey: string | null;
  /** Statuses for which this stage is already complete */
  completedFor: AssignmentStatus[];
  /** Statuses for which this stage is currently active (pulsing) */
  activeFor:    AssignmentStatus[];
}

const STAGES: Stage[] = [
  {
    id:           "confirmed",
    label:        "Заказ подтверждён",
    milestoneKey: null,
    completedFor: ["ACCEPTED", "PICKED_UP", "DELIVERED"],
    activeFor:    [],
  },
  {
    id:           "assigned",
    label:        "Курьер назначен",
    milestoneKey: null,
    completedFor: ["ACCEPTED", "PICKED_UP", "DELIVERED"],
    activeFor:    [],
  },
  {
    id:           "accepted",
    label:        "Курьер едет за заказом",
    sublabel:     "Курьер принял задание",
    milestoneKey: "ACCEPTED",
    completedFor: ["PICKED_UP", "DELIVERED"],
    activeFor:    ["ACCEPTED"],
  },
  {
    id:           "picked_up",
    label:        "Товар получен",
    sublabel:     "Курьер везёт ваш заказ",
    milestoneKey: "PICKED_UP",
    completedFor: ["DELIVERED"],
    activeFor:    ["PICKED_UP"],
  },
  {
    id:           "delivered",
    label:        "Доставлено!",
    milestoneKey: "DELIVERED",
    completedFor: ["DELIVERED"],
    activeFor:    [],
  },
];

// ─── Static map ───────────────────────────────────────────────────────────────

function staticMapUrl(
  driver: { lat: number; lng: number },
  dest: { lat: number; lng: number } | null,
): string {
  const markers = [
    `color:blue|label:В|${driver.lat},${driver.lng}`,
    dest ? `color:red|label:Д|${dest.lat},${dest.lng}` : null,
  ]
    .filter(Boolean)
    .map((m) => `markers=${encodeURIComponent(m!)}`)
    .join("&");

  const center = dest
    ? `${((driver.lat + dest.lat) / 2).toFixed(5)},${((driver.lng + dest.lng) / 2).toFixed(5)}`
    : `${driver.lat},${driver.lng}`;

  return (
    `https://maps.googleapis.com/maps/api/staticmap?` +
    `center=${center}&zoom=13&size=600x260&scale=2&maptype=roadmap&` +
    `style=feature:poi|visibility:off&` +
    `${markers}&key=${MAPS_KEY}`
  );
}

// ─── Map with cross-fade on location update ───────────────────────────────────

function LiveMap({
  driverLocation,
  destinationCoords,
}: {
  driverLocation:    { lat: number; lng: number } | null;
  destinationCoords: { lat: number; lng: number } | null;
}) {
  const [visibleUrl, setVisibleUrl] = useState<string>("");
  const [nextUrl,    setNextUrl]    = useState<string>("");
  const [fading,     setFading]     = useState(false);

  useEffect(() => {
    if (!driverLocation || !MAPS_KEY) return;
    const url = staticMapUrl(driverLocation, destinationCoords);
    if (!visibleUrl) {
      setVisibleUrl(url);
      return;
    }
    if (url === visibleUrl) return;
    setNextUrl(url);
    setFading(true);
    const t = setTimeout(() => {
      setVisibleUrl(url);
      setNextUrl("");
      setFading(false);
    }, 600);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverLocation?.lat, driverLocation?.lng, destinationCoords]);

  if (!driverLocation || !MAPS_KEY) return null;

  return (
    <div className="relative mb-4 overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
      {/* Current visible map */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={visibleUrl}
        alt="Driver location"
        className={`w-full object-cover transition-opacity duration-500 ${fading ? "opacity-0" : "opacity-100"}`}
        width={600}
        height={260}
      />
      {/* Next map (fades in as current fades out) */}
      {fading && nextUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={nextUrl}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full object-cover opacity-100"
          width={600}
          height={260}
        />
      )}
    </div>
  );
}

// ─── ETA countdown ────────────────────────────────────────────────────────────

function ETACard({
  eta,
  lastUpdated,
}: {
  eta:         { etaMinutes: number; fallback: boolean };
  lastUpdated: number;
}) {
  const [elapsedSec, setElapsedSec] = useState(0);
  useEffect(() => {
    const update = () => setElapsedSec((Date.now() - lastUpdated) / 1_000);
    update();
    const id = setInterval(update, 1_000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  const remainingSec  = Math.max(0, eta.etaMinutes * 60 - elapsedSec);
  const remainingMin  = Math.floor(remainingSec / 60);
  const remainingSecs = Math.floor(remainingSec % 60);

  let etaText: string;
  if (remainingSec <= 0) {
    etaText = "Скоро прибудет!";
  } else if (remainingMin >= 10) {
    etaText = `~${remainingMin} мин`;
  } else if (remainingMin >= 1) {
    etaText = `${remainingMin} мин ${String(remainingSecs).padStart(2, "0")} сек`;
  } else {
    etaText = `${remainingSecs} сек`;
  }

  const arrivalTime = new Date(lastUpdated + eta.etaMinutes * 60 * 1_000);

  return (
    <div className="mb-4 flex items-center gap-3 rounded-2xl bg-[#1B4D91] px-5 py-4 text-white shadow-md">
      <Clock className="size-5 shrink-0 opacity-80" />
      <div className="flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider opacity-70">
          Ожидаемое время
        </p>
        <p className="text-2xl font-black leading-tight">
          {etaText}
          {eta.fallback && (
            <span className="ml-2 text-sm font-medium opacity-50">(прибл.)</span>
          )}
        </p>
        {remainingSec > 30 && (
          <p className="text-[11px] opacity-60">
            Прибытие около {format(arrivalTime, "HH:mm", { locale: ru })}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Delivery timeline (P4-2) ─────────────────────────────────────────────────

const DeliveryTimeline = memo(function DeliveryTimeline({
  status,
  stageMilestones,
}: {
  status:          AssignmentStatus;
  stageMilestones: Partial<Record<string, string>>;
}) {
  const stageState = useMemo(
    () =>
      STAGES.map((stage) => ({
        ...stage,
        isComplete: stage.completedFor.includes(status),
        isActive:   stage.activeFor.includes(status),
        ts:         stage.milestoneKey ? stageMilestones[stage.milestoneKey] : null,
      })),
    [status, stageMilestones],
  );

  return (
    <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <p className="mb-4 text-[11px] font-black uppercase tracking-widest text-slate-400">
        Статус доставки
      </p>
      <div className="relative flex flex-col gap-0">
        {/* Vertical connector */}
        <div className="absolute left-[13px] top-4 bottom-4 w-0.5 bg-slate-100" />
        {stageState.map((stage, i) => {
          const { isComplete, isActive, ts } = stage;

          return (
            <div key={stage.id} className={`relative flex items-start gap-3 ${i < STAGES.length - 1 ? "pb-5" : ""}`}>
              {/* Dot */}
              <div
                className={`relative z-10 mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full transition-all ${
                  isComplete
                    ? "bg-[#1B4D91] text-white"
                    : isActive
                    ? "bg-[#1B4D91]/10 ring-2 ring-[#1B4D91]"
                    : "bg-slate-100"
                }`}
              >
                {isComplete ? (
                  <CheckCircle2 className="size-3.5 text-white" />
                ) : isActive ? (
                  <div className="size-2.5 animate-pulse rounded-full bg-[#1B4D91]" />
                ) : (
                  <div className="size-2.5 rounded-full bg-slate-300" />
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 pt-0.5">
                <p
                  className={`text-[13px] font-bold ${
                    isComplete || isActive ? "text-slate-800" : "text-slate-400"
                  }`}
                >
                  {stage.label}
                </p>
                {isActive && stage.sublabel && (
                  <p className="text-[11px] text-[#1B4D91]">{stage.sublabel}</p>
                )}
                {ts && (
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {format(new Date(ts), "HH:mm", { locale: ru })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ─── Driver card ──────────────────────────────────────────────────────────────

function DriverCard({
  initials,
  firstName,
  lastUpdated,
  isLive,
}: {
  initials:    string;
  firstName:   string;
  lastUpdated: number;
  isLive:      boolean;
}) {
  const [staleSec, setStaleSec] = useState(0);
  useEffect(() => {
    const update = () => setStaleSec(Math.floor((Date.now() - lastUpdated) / 1_000));
    update();
    const id = setInterval(update, 5_000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  const staleLabel  =
    staleSec < 10  ? "обновлено только что" :
    staleSec < 60  ? `${staleSec}с назад` :
    staleSec < 120 ? "1 мин назад" :
                     `${Math.floor(staleSec / 60)} мин назад`;
  const isStale     = staleSec > 60;
  const isVeryStale = staleSec > 120;

  return (
    <div className="mb-4 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center gap-3 p-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="flex size-12 items-center justify-center rounded-full bg-[#1B4D91]/10 text-[14px] font-black text-[#1B4D91]">
            {initials || <Truck className="size-5" />}
          </div>
          {/* Verified badge on avatar */}
          <div className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-white ring-1 ring-slate-100">
            <ShieldCheck className="size-3.5 text-[#1B4D91]" />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Курьер</p>
          <p className="truncate text-[14px] font-bold text-slate-800">
            {firstName || "Доставляет ваш заказ"}
          </p>
          <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-[#1B4D91]/70">
            <ShieldCheck className="size-2.5" /> Верифицирован диспетчером
          </span>
        </div>

        {/* Live / stale indicator */}
        <div className="flex flex-col items-end gap-1">
          {isLive ? (
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-600 ring-1 ring-emerald-100">
              <Wifi className="size-2.5" /> Live
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[9px] font-medium text-slate-400 ring-1 ring-slate-100">
              <WifiOff className="size-2.5" /> Polling
            </span>
          )}
          {lastUpdated > 0 && (
            <p className={`text-[9px] ${isStale ? "text-amber-500" : "text-slate-400"}`}>
              {staleLabel}
            </p>
          )}
        </div>
      </div>

      {/* Very stale warning strip */}
      {isVeryStale && (
        <div className="flex items-center gap-2 rounded-b-2xl bg-amber-50 px-4 py-2 text-amber-700">
          <TriangleAlert className="size-3 shrink-0" />
          <p className="text-[10px] font-semibold">
            Данные о местоположении устарели — курьер может быть вне зоны сети
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Delivered celebration ────────────────────────────────────────────────────

function DeliveredScreen({
  orderId,
  address,
  stageMilestones,
  podPhotoUrl,
  hasRating,
}: {
  orderId:         string;
  address:         string;
  stageMilestones: Partial<Record<string, string>>;
  podPhotoUrl:     string | null;
  hasRating:       boolean;
}) {
  const deliveredAt = stageMilestones["DELIVERED"];
  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-emerald-50 to-white px-4 pt-16 pb-20">
      {/* Celebration */}
      <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-emerald-100 ring-4 ring-emerald-200">
        <CheckCircle2 className="size-10 text-emerald-500" />
      </div>
      <h1 className="mb-1 text-2xl font-black text-emerald-800">Заказ доставлен!</h1>
      <p className="mb-1 text-sm text-emerald-600">Спасибо за покупку в Birga Quramiz</p>
      {deliveredAt && (
        <p className="mb-6 text-[11px] text-emerald-500">
          {format(new Date(deliveredAt), "d MMMM, HH:mm", { locale: ru })}
        </p>
      )}

      {/* POD photo */}
      {podPhotoUrl && (
        <div className="mb-4 w-full max-w-sm">
          <PodPhoto url={podPhotoUrl} />
        </div>
      )}

      {/* Address */}
      {address && (
        <div className="mb-6 flex w-full max-w-sm items-start gap-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <MapPin className="mt-0.5 size-4 shrink-0 text-slate-400" />
          <p className="text-[13px] text-slate-600">{address}</p>
        </div>
      )}

      {/* Rating card */}
      <div className="mb-4 w-full max-w-sm">
        <RatingCard orderId={orderId} alreadyRated={hasRating} />
      </div>

      {/* Mini timeline summary */}
      <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
          Маршрут доставки
        </p>
        {["ACCEPTED", "PICKED_UP", "DELIVERED"].map((key) => {
          const ts = stageMilestones[key];
          const labels: Record<string, string> = {
            ACCEPTED:  "Курьер принял задание",
            PICKED_UP: "Товар получен",
            DELIVERED: "Доставлено",
          };
          return ts ? (
            <div key={key} className="mb-2 flex items-center justify-between">
              <span className="text-[12px] text-slate-600">{labels[key]}</span>
              <span className="text-[11px] font-semibold text-slate-800">
                {format(new Date(ts), "HH:mm", { locale: ru })}
              </span>
            </div>
          ) : null;
        })}
      </div>
    </div>
  );
}

// ─── Customer rating card ─────────────────────────────────────────────────────

const RATING_TAGS = [
  "Быстро",
  "Вежливо",
  "Аккуратно",
  "Профессионально",
  "Вовремя",
  "Опоздал",
  "Грубо",
];

function RatingCard({
  orderId,
  alreadyRated,
}: {
  orderId:      string;
  alreadyRated: boolean;
}) {
  const [stars,    setStars]    = useState(0);
  const [hovered,  setHovered]  = useState(0);
  const [tags,     setTags]     = useState<string[]>([]);
  const [comment,  setComment]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [submitted, setSubmitted] = useState(alreadyRated);
  const [error,    setError]    = useState<string | null>(null);

  const toggleTag = useCallback((tag: string) =>
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]),
  []);

  const submit = useCallback(async () => {
    if (!stars) { setError("Выберите оценку"); return; }
    setLoading(true);
    setError(null);
    try {
      await trackingApi.submitRating(orderId, { rating: stars, comment: comment || undefined, tags });
      setSubmitted(true);
    } catch {
      setError("Не удалось отправить оценку. Попробуйте позже.");
    } finally {
      setLoading(false);
    }
  }, [orderId, stars, comment, tags]);

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-100">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className="size-5 fill-emerald-400 text-emerald-400" />
          ))}
        </div>
        <p className="text-[13px] font-bold text-emerald-700">Спасибо за вашу оценку!</p>
        <p className="text-[11px] text-emerald-500 text-center">Ваш отзыв поможет улучшить сервис</p>
      </div>
    );
  }

  const display = hovered || stars;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <p className="mb-4 text-[11px] font-black uppercase tracking-widest text-slate-400">
        Оцените доставку
      </p>

      {/* Star selector */}
      <div className="mb-4 flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            onClick={() => setStars(s)}
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            aria-label={`${s} звезды`}
          >
            <Star
              className={`size-9 transition-colors ${
                s <= display
                  ? "fill-amber-400 text-amber-400"
                  : "text-slate-200"
              }`}
            />
          </button>
        ))}
      </div>

      {/* Tags */}
      {stars > 0 && (
        <>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {RATING_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`rounded-full border px-3 py-1 text-[11px] font-medium transition ${
                  tags.includes(tag)
                    ? "border-[#1B4D91] bg-[#1B4D91]/10 text-[#1B4D91]"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Comment */}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Оставьте комментарий (необязательно)"
            rows={2}
            maxLength={300}
            className="mb-3 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-[12px] text-slate-700 placeholder:text-slate-300 focus:border-[#1B4D91] focus:outline-none"
          />
        </>
      )}

      {error && <p className="mb-2 text-[11px] text-red-500">{error}</p>}

      <button
        onClick={submit}
        disabled={loading || !stars}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B4D91] py-2.5 text-[13px] font-bold text-white transition hover:bg-[#163d73] disabled:opacity-40"
      >
        <Send className="size-4" />
        {loading ? "Отправка…" : "Отправить оценку"}
      </button>
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B4D91]/5 to-white">
      <div className="mx-auto max-w-lg animate-pulse px-4 pt-8">
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="size-16 rounded-full bg-slate-200" />
          <div className="h-6 w-44 rounded-xl bg-slate-200" />
          <div className="h-4 w-56 rounded-lg bg-slate-200" />
        </div>
        <div className="mb-4 h-52 rounded-2xl bg-slate-200" />
        <div className="mb-4 h-20 rounded-2xl bg-slate-200" />
        <div className="mb-4 h-56 rounded-2xl bg-slate-200" />
        <div className="h-16 rounded-2xl bg-slate-200" />
      </div>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#1B4D91]/5 to-white px-4">
      <Package className="mb-3 size-14 text-slate-200" />
      <p className="text-lg font-bold text-slate-600">Заказ не найден</p>
      <p className="mt-1 text-center text-sm text-slate-400">
        Отслеживание недоступно или заказ уже завершён
      </p>
    </div>
  );
}

function PendingState({ address }: { address: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#1B4D91]/5 to-white px-4">
      <div className="mb-5 flex size-20 items-center justify-center rounded-full bg-[#1B4D91]/10">
        <Truck className="size-10 text-[#1B4D91] animate-pulse" />
      </div>
      <h1 className="mb-1 text-xl font-black text-slate-800">Курьер назначен</h1>
      <p className="mb-6 text-center text-sm text-slate-500">
        Курьер принимает заказ — страница обновится автоматически
      </p>
      {address && (
        <div className="flex w-full max-w-sm items-start gap-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <MapPin className="mt-0.5 size-4 shrink-0 text-[#1B4D91]" />
          <p className="text-[13px] text-slate-600">{address}</p>
        </div>
      )}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#1B4D91]/5 to-white px-4">
      <AlertCircle className="mb-3 size-12 text-slate-300" />
      <p className="mb-4 text-center font-semibold text-slate-600">{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 rounded-xl bg-[#1B4D91] px-5 py-2.5 text-sm font-bold text-white"
      >
        <RefreshCcw className="size-4" />
        Попробовать снова
      </button>
    </div>
  );
}

// ─── Driver arriving banner ───────────────────────────────────────────────────

const ArrivingBanner = memo(function ArrivingBanner() {
  return (
    <div className="mb-4 flex items-center gap-3 rounded-2xl bg-emerald-500 px-4 py-3.5 text-white shadow-md">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/20">
        <Bell className="size-4" />
      </div>
      <div>
        <p className="text-[14px] font-black">Курьер прибывает!</p>
        <p className="text-[11px] opacity-80">Приготовьтесь принять заказ</p>
      </div>
    </div>
  );
});

// ─── Contact driver section ───────────────────────────────────────────────────

const SMS_TEMPLATES = [
  "Я дома, звоните",
  "Подождите 5 минут",
  "Я у входа",
  "Оставьте у двери",
];

function ContactSection({ orderId }: { orderId: string }) {
  const [phone,   setPhone]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const reveal = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/tracking/public/${orderId}/driver-contact`);
      if (res.ok) {
        const data = await res.json() as { phone: string };
        setPhone(data.phone);
      } else {
        setError("Не удалось получить номер");
      }
    } catch {
      setError("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
        Связь с курьером
      </p>

      {!phone ? (
        <button
          onClick={reveal}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-[13px] font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <Phone className="size-4" />
          {loading ? "Загрузка…" : "Показать номер курьера"}
        </button>
      ) : (
        <>
          <a
            href={`tel:${phone}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B4D91] py-2.5 text-[13px] font-bold text-white transition hover:bg-[#163d73]"
          >
            <Phone className="size-4" />
            Позвонить курьеру
          </a>

          <div className="mt-3">
            <p className="mb-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <MessageSquare className="size-3" /> Быстрые сообщения
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SMS_TEMPLATES.map((tpl) => (
                <a
                  key={tpl}
                  href={`sms:${phone}?body=${encodeURIComponent(tpl)}`}
                  className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-600 transition hover:border-[#1B4D91] hover:text-[#1B4D91]"
                >
                  {tpl}
                </a>
              ))}
            </div>
          </div>
        </>
      )}

      {error && <p className="mt-2 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

// ─── OTP info + resend (shown when driver has picked up) ─────────────────────

function OtpSection({ orderId }: { orderId: string }) {
  const [cooldown, setCooldown] = useState(0);
  const [sending,  setSending]  = useState(false);
  const [sent,     setSent]     = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1_000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const resend = async () => {
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/tracking/public/${orderId}/otp/resend`, {
        method: "POST",
      });
      if (res.ok) {
        setSent(true);
        setCooldown(60);
      } else {
        const body = await res.json().catch(() => ({}));
        setError((body as { message?: string }).message ?? "Попробуйте позже");
      }
    } catch {
      setError("Ошибка соединения. Попробуйте позже.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mb-4 rounded-2xl bg-violet-50 p-4 ring-1 ring-violet-100">
      {/* OTP protection badge */}
      <div className="mb-3 flex items-center gap-1.5">
        <Lock className="size-3 text-violet-500" />
        <span className="text-[9px] font-black uppercase tracking-widest text-violet-500">
          Защита OTP активна
        </span>
      </div>
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-100">
          <KeyRound className="size-4 text-violet-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-violet-800">Код подтверждения</p>
          <p className="mt-0.5 text-[11px] text-violet-600 leading-snug">
            Когда курьер прибудет, назовите ему код из SMS
          </p>
          {sent && (
            <p className="mt-1.5 text-[11px] font-semibold text-emerald-600">
              ✓ Код отправлен повторно на ваш номер
            </p>
          )}
          {error && (
            <p className="mt-1.5 text-[11px] text-red-500">{error}</p>
          )}
          <button
            onClick={resend}
            disabled={sending || cooldown > 0}
            className="mt-2 text-[11px] font-bold text-violet-600 underline-offset-2 hover:underline disabled:opacity-40 disabled:no-underline"
          >
            {sending
              ? "Отправка…"
              : cooldown > 0
              ? `Повторить через ${cooldown}с`
              : "Не получили код? Отправить повторно"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── POD photo (proof of delivery) ───────────────────────────────────────────

const PodPhoto = memo(function PodPhoto({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="mb-4 w-full">
      <div className="mb-2 flex items-center gap-1.5">
        <Camera className="size-3.5 text-emerald-500" />
        <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600">
          Фото доставки
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-emerald-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt="Proof of delivery"
          onLoad={() => setLoaded(true)}
          className={`w-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      </div>
    </div>
  );
});

// ─── Trust bar ────────────────────────────────────────────────────────────────

const TrustBar = memo(function TrustBar() {
  return (
    <div className="mb-4 flex items-center justify-center gap-4 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
      <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
        <ShieldCheck className="size-3.5 text-[#1B4D91]" />
        Курьер верифицирован
      </span>
      <span className="h-3 w-px bg-slate-200" />
      <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
        <Lock className="size-3.5 text-violet-500" />
        Защита OTP
      </span>
      <span className="h-3 w-px bg-slate-200" />
      <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
        <CheckCircle2 className="size-3.5 text-emerald-500" />
        Фото при сдаче
      </span>
    </div>
  );
});

// ─── Address footer ───────────────────────────────────────────────────────────

const AddressCard = memo(function AddressCard({ address }: { address: string }) {
  if (!address) return null;
  return (
    <div className="flex items-start gap-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <MapPin className="mt-0.5 size-4 shrink-0 text-[#1B4D91]" />
      <div>
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
          Адрес доставки
        </p>
        <p className="text-[13px] text-slate-700">{address}</p>
      </div>
    </div>
  );
});

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TrackOrderPage() {
  const { orderId }   = useParams<{ orderId: string }>();
  const tracking      = useOrderTracking(orderId);
  const retryCountRef = useRef(0);
  const [, forceRetry] = useState(0);

  const handleRetry = useCallback(() => {
    retryCountRef.current += 1;
    forceRetry((n) => n + 1);
  }, []);

  if (tracking.isLoading) return <LoadingSkeleton />;
  if (tracking.notFound)  return <NotFoundState />;
  if (tracking.error && !tracking.status) {
    return <ErrorState message={tracking.error} onRetry={handleRetry} />;
  }
  if (!tracking.status)   return <LoadingSkeleton />;

  if (tracking.status === "PENDING") {
    return <PendingState address={tracking.deliveryAddress} />;
  }

  if (tracking.status === "DELIVERED") {
    return (
      <DeliveredScreen
        orderId={orderId}
        address={tracking.deliveryAddress}
        stageMilestones={tracking.stageMilestones}
        podPhotoUrl={tracking.podPhotoUrl}
        hasRating={tracking.hasRating}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B4D91]/5 to-white">
      <div className="mx-auto max-w-lg px-4 pt-8 pb-20">

        {/* Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex size-16 items-center justify-center rounded-full bg-[#1B4D91]">
            <Truck className="size-8 text-white" />
          </div>
          <h1 className="text-xl font-black text-slate-800">Ваш заказ в пути</h1>
          {tracking.deliveryAddress && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
              <MapPin className="size-3.5 shrink-0" />
              <span className="line-clamp-1">{tracking.deliveryAddress}</span>
            </p>
          )}
        </div>

        {/* Trust bar */}
        <TrustBar />

        {/* Driver arriving alert */}
        {tracking.isDriverArriving && <ArrivingBanner />}

        {/* Live map */}
        <LiveMap
          driverLocation={tracking.driverLocation}
          destinationCoords={tracking.destinationCoords}
        />

        {/* ETA */}
        {tracking.eta && tracking.lastUpdated > 0 && (
          <ETACard
            eta={tracking.eta}
            lastUpdated={tracking.lastUpdated}
          />
        )}

        {/* Delivery timeline */}
        <DeliveryTimeline
          status={tracking.status}
          stageMilestones={tracking.stageMilestones}
        />

        {/* Contact driver */}
        <ContactSection orderId={orderId} />

        {/* OTP info — shown when driver has picked up the goods */}
        {tracking.status === "PICKED_UP" && (
          <OtpSection orderId={orderId} />
        )}

        {/* Driver info */}
        {tracking.lastUpdated > 0 && (
          <DriverCard
            initials={tracking.driverInitials}
            firstName={tracking.driverFirstName}
            lastUpdated={tracking.lastUpdated}
            isLive={tracking.isLive}
          />
        )}

        {/* Delivery address */}
        <AddressCard address={tracking.deliveryAddress} />
      </div>
    </div>
  );
}
