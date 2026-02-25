"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { registerSeller } from "@/lib/api/seller";

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const t = useTranslations("Profile");

  const [company, setCompany] = useState("");
  const [showSellerForm, setShowSellerForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const roleLabel: Record<string, string> = {
    USER: t("roles.USER"),
    SELLER: t("roles.SELLER"),
    ADMIN: t("roles.ADMIN"),
  };

  if (!isAuthenticated) {
    return (
      <div className="page-shell max-w-xl">
        <div className="surface-card space-y-4 p-8 text-center">
          <p className="text-muted-foreground">{t("notAuthenticated")}</p>
          <Button onClick={() => router.push("/login")}>{t("signIn")}</Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-shell max-w-xl">
        <div className="surface-card h-40 animate-pulse" />
      </div>
    );
  }

  const handleBecomeSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await registerSeller({ company });
      setSuccess(t("seller.success"));
      setShowSellerForm(false);
      setCompany("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("seller.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell max-w-4xl space-y-6">
      <h1 className="section-title text-primary">{t("title")}</h1>

      <section className="surface-card space-y-3 p-6">
        <div className="flex justify-between border-b border-border/60 pb-2 text-sm">
          <span className="text-muted-foreground">{t("name")}</span>
          <span className="font-semibold text-primary">{user.name}</span>
        </div>
        <div className="flex justify-between border-b border-border/60 pb-2 text-sm">
          <span className="text-muted-foreground">{t("phone")}</span>
          <span className="font-semibold text-primary">{user.phone}</span>
        </div>
        <div className="flex justify-between border-b border-border/60 pb-2 text-sm">
          <span className="text-muted-foreground">{t("role")}</span>
          <span className="font-semibold text-primary">{roleLabel[user.role]}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("created")}</span>
          <span className="font-semibold text-primary">{new Date(user.createdAt).toLocaleDateString()}</span>
        </div>
      </section>

      {user.role === "USER" && (
        <section className="surface-card space-y-4 p-6">
          <h2 className="text-lg font-bold text-primary">{t("seller.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("seller.subtitle")}</p>

          {success && <p className="text-sm font-medium text-green-700">{success}</p>}
          {error && <p className="text-sm font-medium text-destructive">{error}</p>}

          {!showSellerForm ? (
            <Button variant="outline" onClick={() => setShowSellerForm(true)}>
              {t("seller.start")}
            </Button>
          ) : (
            <form onSubmit={handleBecomeSeller} className="space-y-3">
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder={t("seller.company")}
                required
                className="h-10 w-full rounded-lg border border-border/80 bg-white px-3 text-sm"
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? t("seller.submitting") : t("seller.submit")}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowSellerForm(false)}>
                  {t("seller.cancel")}
                </Button>
              </div>
            </form>
          )}
        </section>
      )}

      {user.role === "SELLER" && (
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => router.push("/seller/dashboard")}>{t("seller.openPanel")}</Button>
          <Button variant="outline" onClick={() => router.push("/seller/products")}>{t("seller.manageProducts")}</Button>
        </div>
      )}
    </div>
  );
}
