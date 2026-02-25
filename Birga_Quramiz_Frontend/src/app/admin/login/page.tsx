"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { login, getProfile } from "@/lib/api/auth";
import { useAuthStore } from "@/store/authStore";
import { useAuth } from "@/hooks/useAuth";

export default function AdminLoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const logout = useAuthStore((s) => s.logout);
  const { user, isAuthenticated, isInitialized } = useAuth();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isInitialized) return;
    if (isAuthenticated && user?.role === "ADMIN") {
      router.push("/admin");
    }
  }, [isInitialized, isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { token } = await login({ phone, password });
      localStorage.setItem("token", token);
      const profile = await getProfile();

      if (profile.role !== "ADMIN") {
        logout();
        setError("This login is only for admin accounts.");
        return;
      }

      setAuth(token, profile);
      router.push("/admin");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-sm md:max-w-lg">
        <Card className="overflow-hidden p-0">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <div className="text-center">
                  <h1 className="text-2xl font-bold">Admin Login</h1>
                  <p className="mt-2 text-sm text-muted-foreground">Use administrator credentials only.</p>
                </div>

                {error && <p className="text-center text-sm text-red-500">{error}</p>}

                <Field>
                  <FieldLabel>Phone</FieldLabel>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998901234567" required />
                </Field>

                <Field>
                  <FieldLabel>Password</FieldLabel>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </Field>

                <Field>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign in as admin"}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}