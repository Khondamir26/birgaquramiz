"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { getSellerProfile, updateSellerProfile, type SellerProfile } from "@/lib/api/seller";
import {
  Store, Hash, Calendar, Phone, User, CheckCircle,
  Clock, XCircle, RefreshCw, Save, Pencil,
} from "lucide-react";

const STATUS_CONFIG = {
  APPROVED: { label: "Approved",  icon: CheckCircle, color: "#10b981", bg: "#d1fae5" },
  PENDING:  { label: "Pending",   icon: Clock,       color: "#f59e0b", bg: "#fef3c7" },
  REJECTED: { label: "Rejected",  icon: XCircle,     color: "#ef4444", bg: "#fee2e2" },
} as const;

export default function SellerProfilePage() {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [company, setCompany] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) { router.replace("/login?from=/seller/profile"); return; }
    if (user?.role !== "SELLER" && user?.role !== "ADMIN") { router.replace("/"); return; }
  }, [isInitialized, isAuthenticated, user, router]);

  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return;
    if (user?.role !== "SELLER" && user?.role !== "ADMIN") return;
    void (async () => {
      try {
        const data = await getSellerProfile();
        setProfile(data);
        setCompany(data.company);
      } catch {
        // profile not found — shouldn't happen if role is SELLER
      } finally {
        setLoading(false);
      }
    })();
  }, [isInitialized, isAuthenticated, user]);

  async function handleSave() {
    if (!company.trim()) return;
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    try {
      const updated = await updateSellerProfile({ company: company.trim() });
      setProfile((prev) => prev ? { ...prev, company: updated.company } : prev);
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setCompany(profile?.company ?? "");
    setEditing(false);
    setSaveError("");
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (!isInitialized || loading) {
    return (
      <div className="flex flex-col flex-1 pb-12">
        <div className="mx-auto w-full max-w-[860px] px-4 pt-6 md:px-7 md:pt-7 flex flex-col gap-4">
          <div className="h-8 w-40 animate-pulse rounded-xl bg-white" />
          <div className="h-40 animate-pulse rounded-2xl bg-white" />
          <div className="h-56 animate-pulse rounded-2xl bg-white" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col flex-1 pb-12">
        <div className="mx-auto w-full max-w-[860px] px-4 pt-6 md:px-7 md:pt-7">
          <div className="rounded-2xl bg-red-50 border border-red-100 p-6 text-[13px] font-semibold text-red-600">
            Seller profile not found. Contact admin.
          </div>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[profile.status] ?? STATUS_CONFIG.PENDING;
  const StatusIcon = statusCfg.icon;

  return (
    <div className="flex flex-col flex-1 pb-12">
      <div className="mx-auto w-full max-w-[860px] px-4 pt-6 md:px-7 md:pt-7 flex flex-col gap-5">

        {/* Header */}
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Store</p>
          <h1 className="text-[22px] font-black text-slate-900 leading-tight">My Store</h1>
        </div>

        {/* Success toast */}
        {saveSuccess && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-[13px] font-semibold text-emerald-700">
            <CheckCircle className="size-4 shrink-0" />
            Store name updated successfully
          </div>
        )}

        {/* Status + article banner */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-[#1B4D91]/8">
              <Store className="size-6 text-[#1B4D91]" />
            </div>
            <div>
              <p className="text-[18px] font-black text-slate-900">{profile.company}</p>
              <p className="text-[12px] text-slate-400 font-medium mt-0.5">
                Article #{profile.articleNumber}
              </p>
            </div>
          </div>
          <div
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-black"
            style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
          >
            <StatusIcon className="size-3.5" />
            {statusCfg.label}
          </div>
        </div>

        {/* Edit company name */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
            <p className="text-[13px] font-black text-slate-900">Store Settings</p>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-bold text-[#1B4D91] hover:bg-[#1B4D91]/8 transition-colors"
              >
                <Pencil className="size-3.5" />
                Edit
              </button>
            )}
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 block">
                Store / Company Name
              </label>
              {editing ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="h-11 w-full rounded-xl border-2 border-[#1B4D91] bg-white px-4 text-[14px] font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#1B4D91]/10"
                    placeholder="Your store name"
                    autoFocus
                  />
                  {saveError && (
                    <p className="text-[12px] font-semibold text-red-500">{saveError}</p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleSave}
                      disabled={saving || !company.trim()}
                      className="flex items-center gap-1.5 rounded-xl bg-[#1B4D91] px-4 py-2 text-[12px] font-black text-white hover:bg-[#163d73] disabled:opacity-50 transition-colors"
                    >
                      {saving ? <RefreshCw className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-[12px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-[15px] font-semibold text-slate-800">{profile.company}</p>
              )}
            </div>
          </div>
        </div>

        {/* Account info — read-only */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50">
            <p className="text-[13px] font-black text-slate-900">Account Info</p>
          </div>
          <div className="divide-y divide-slate-50">
            {[
              { icon: User,     label: "Name",        value: profile.user.name },
              { icon: Phone,    label: "Phone",       value: profile.user.phone },
              { icon: Hash,     label: "Article #",   value: String(profile.articleNumber) },
              { icon: Calendar, label: "Member since", value: new Date(profile.user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 px-5 py-3.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                  <Icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                  <p className="text-[13px] font-semibold text-slate-700 mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending notice */}
        {profile.status === "PENDING" && (
          <div className="rounded-2xl bg-amber-50 border border-amber-100 p-5 flex items-start gap-3">
            <Clock className="size-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-black text-amber-800">Awaiting Approval</p>
              <p className="text-[12px] text-amber-700 mt-1 leading-relaxed">
                Your seller account is pending admin review. You can add products but they won&apos;t be visible until your account is approved.
              </p>
            </div>
          </div>
        )}

        {profile.status === "REJECTED" && (
          <div className="rounded-2xl bg-red-50 border border-red-100 p-5 flex items-start gap-3">
            <XCircle className="size-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-black text-red-800">Account Rejected</p>
              <p className="text-[12px] text-red-700 mt-1 leading-relaxed">
                Your seller account was rejected. Please contact support at info@birga-quramiz.uz.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
