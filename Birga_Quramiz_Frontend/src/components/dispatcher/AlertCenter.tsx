"use client";

import { useRef, useEffect } from "react";
import { useTrackingStore } from "@/store/trackingStore";
import type { ExtendedDriver, AlertType } from "@/store/trackingStore";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow } from "date-fns";
import {
  X,
  AlertTriangle,
  Radio,
  Clock,
  MessageCircleWarning,
  Phone,
  MapPin,
  Shield,
  BellOff,
} from "lucide-react";

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

// ─── Config ───────────────────────────────────────────────────────────────────

const SEVERITY_ORDER: AlertType[] = ["stuck", "signal_lost", "delayed", "issue"];

const ALERT_CFG: Record<AlertType, {
  label:    string;
  icon:     React.ReactNode;
  severity: "critical" | "high" | "medium" | "info";
  rowCls:   string;
  iconCls:  string;
  badgeCls: string;
}> = {
  stuck: {
    label:    "Driver stuck",
    severity: "critical",
    icon:     <AlertTriangle className="size-3.5" />,
    rowCls:   "border-red-100   bg-red-50/60",
    iconCls:  "bg-red-100    text-red-600",
    badgeCls: "bg-red-100 text-red-700",
  },
  signal_lost: {
    label:    "Signal lost",
    severity: "high",
    icon:     <Radio className="size-3.5" />,
    rowCls:   "border-amber-100 bg-amber-50/50",
    iconCls:  "bg-amber-100  text-amber-600",
    badgeCls: "bg-amber-100 text-amber-700",
  },
  delayed: {
    label:    "Delivery late",
    severity: "medium",
    icon:     <Clock className="size-3.5" />,
    rowCls:   "border-orange-100 bg-orange-50/40",
    iconCls:  "bg-orange-100 text-orange-600",
    badgeCls: "bg-orange-100 text-orange-700",
  },
  issue: {
    label:    "Driver issue",
    severity: "info",
    icon:     <MessageCircleWarning className="size-3.5" />,
    rowCls:   "border-purple-100 bg-purple-50/40",
    iconCls:  "bg-purple-100 text-purple-600",
    badgeCls: "bg-purple-100 text-purple-700",
  },
};

const SEVERITY_LABEL: Record<string, { label: string; headerCls: string }> = {
  critical: { label: "Critical",  headerCls: "text-red-600 bg-red-50/80 border-red-100" },
  high:     { label: "High",      headerCls: "text-amber-600 bg-amber-50/80 border-amber-100" },
  medium:   { label: "Medium",    headerCls: "text-orange-600 bg-orange-50/80 border-orange-100" },
  info:     { label: "Info",      headerCls: "text-purple-600 bg-purple-50/80 border-purple-100" },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface FlatAlert {
  driver:  ExtendedDriver;
  type:    AlertType;
  message: string;
  since:   number;
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  onClose:       () => void;
  onFocusDriver: (id: string) => void;
}

export default function AlertCenter({ onClose, onFocusDriver }: Props) {
  const { drivers, clearAlert } = useTrackingStore();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Flatten + sort alerts by severity order
  const flat: FlatAlert[] = [];
  for (const driver of Object.values(drivers)) {
    for (const alert of driver.alerts) {
      flat.push({ driver, type: alert.type, message: alert.message, since: alert.since });
    }
  }
  flat.sort((a, b) => SEVERITY_ORDER.indexOf(a.type) - SEVERITY_ORDER.indexOf(b.type));

  // Group by severity
  const grouped = new Map<string, FlatAlert[]>();
  for (const item of flat) {
    const sev = ALERT_CFG[item.type].severity;
    if (!grouped.has(sev)) grouped.set(sev, []);
    grouped.get(sev)!.push(item);
  }

  const dismissAll = () => {
    for (const item of flat) {
      clearAlert(item.driver.id, item.type);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal
        aria-label="Alert Center"
        className="fixed left-1/2 top-16 z-50 flex max-h-[calc(100vh-5rem)] w-full max-w-md -translate-x-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-red-50">
              <Shield className="size-3.5 text-red-500" />
            </div>
            <div>
              <h2 className="text-[13px] font-black text-slate-800">Alert Center</h2>
              <p className="text-[10px] text-slate-400">
                {flat.length === 0
                  ? "No active alerts"
                  : `${flat.length} active alert${flat.length !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {flat.length > 0 && (
              <button
                onClick={dismissAll}
                className="rounded-lg px-2.5 py-1 text-[10px] font-bold text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                Dismiss all
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close alert center"
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {flat.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BellOff className="mb-3 size-10 text-slate-200" />
              <p className="text-[13px] font-bold text-slate-400">All clear</p>
              <p className="text-[11px] text-slate-300">No active alerts right now</p>
            </div>
          ) : (
            <>
              {(["critical", "high", "medium", "info"] as const)
                .filter((sev) => grouped.has(sev))
                .map((sev) => {
                  const items = grouped.get(sev)!;
                  const hdr   = SEVERITY_LABEL[sev];
                  return (
                    <div key={sev}>
                      <div
                        className={cn(
                          "sticky top-0 z-10 flex items-center justify-between border-b px-5 py-1.5 text-[9px] font-black uppercase tracking-widest backdrop-blur-sm",
                          hdr.headerCls
                        )}
                      >
                        <span>{hdr.label}</span>
                        <span className="rounded-full bg-white/60 px-1.5 py-0.5 text-[8px] font-black">
                          {items.length}
                        </span>
                      </div>
                      {items.map((item) => (
                        <AlertRow
                          key={`${item.driver.id}-${item.type}`}
                          item={item}
                          onDismiss={() => clearAlert(item.driver.id, item.type)}
                          onFocus={() => { onFocusDriver(item.driver.id); onClose(); }}
                        />
                      ))}
                    </div>
                  );
                })}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Alert row ────────────────────────────────────────────────────────────────

function AlertRow({
  item,
  onDismiss,
  onFocus,
}: {
  item:      FlatAlert;
  onDismiss: () => void;
  onFocus:   () => void;
}) {
  const cfg   = ALERT_CFG[item.type];
  const abbr  = initials(item.driver.name);

  return (
    <div className={cn("flex items-start gap-3 border-b px-5 py-3.5 transition-colors hover:brightness-95", cfg.rowCls)}>
      {/* Severity icon */}
      <div className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full", cfg.iconCls)}>
        {cfg.icon}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {/* Driver avatar */}
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[8px] font-black text-slate-600">
                {abbr}
              </span>
              <span className="truncate text-[12px] font-bold text-slate-800">
                {item.driver.name}
              </span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold", cfg.badgeCls)}>
                {cfg.label}
              </span>
              {item.message !== cfg.label && (
                <span className="truncate text-[10px] text-slate-500">{item.message}</span>
              )}
            </div>
          </div>
          <span className="shrink-0 text-[9px] text-slate-400">
            {formatDistanceToNow(item.since, { addSuffix: true })}
          </span>
        </div>

        {/* Action row */}
        <div className="mt-2 flex items-center gap-1.5">
          <button
            onClick={onFocus}
            className="flex items-center gap-1 rounded-lg bg-[#1B4D91] px-2.5 py-1 text-[9px] font-bold text-white transition hover:bg-[#163d73]"
          >
            <MapPin className="size-2.5" />
            Focus
          </button>
          <a
            href={`tel:${item.driver.phone}`}
            className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[9px] font-bold text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-100"
          >
            <Phone className="size-2.5" />
            Call
          </a>
          <button
            onClick={onDismiss}
            className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-[9px] font-semibold text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="size-2.5" />
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
