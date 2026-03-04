'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { login } from '@/lib/api/auth'
import { useAuthStore } from '@/store/authStore'

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const setInitialized = useAuthStore((s) => s.setInitialized)
  const t = useTranslations('Auth')

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { user } = await login({ phone, password })
      setUser(user)
      setInitialized(true)

      if (user.role === 'ADMIN') {
        router.push('/admin')
        return
      }

      if (user.role === 'SELLER') {
        router.push('/seller/dashboard')
        return
      }

      router.push('/catalog')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('loginFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="overflow-hidden p-0 shadow-2xl border-[#1B4D91]/10 rounded-3xl">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-black text-[#1B4D91]">{t('loginTitle')}</h1>
                <p className="text-muted-foreground text-sm">
                  {t('noAccount')}{' '}
                  <a href="/signup" className="underline font-bold text-[#1B4D91]">
                    {t('createAccount')}
                  </a>
                </p>
                <a href="/admin/login" className="text-xs text-muted-foreground underline hover:text-[#1B4D91] transition-colors">
                  {t('adminSignIn')}
                </a>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-2xl text-xs font-bold text-center border border-red-100 italic">
                  {error}
                </div>
              )}

              <Field>
                <FieldLabel className="text-[#1B4D91]/70">{t('phone')}</FieldLabel>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998901234567"
                  required
                  className="rounded-2xl border-slate-200 focus:ring-[#1B4D91]"
                />
              </Field>

              <Field>
                <FieldLabel className="text-[#1B4D91]/70">{t('password')}</FieldLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="rounded-2xl border-slate-200 focus:ring-[#1B4D91]"
                />
              </Field>

              <Field>
                <Button
                  type="submit"
                  className="w-full bg-[#1B4D91] hover:bg-[#163d73] text-white rounded-2xl h-12 font-black transition-all shadow-lg shadow-[#1B4D91]/20 hover:scale-[1.02] active:scale-95"
                  disabled={loading}
                >
                  {loading ? t('signingIn') : t('signIn')}
                </Button>
              </Field>
            </FieldGroup>
          </form>

          <div className="bg-gradient-to-br from-[#1B4D91] to-[#163d73] relative hidden md:flex md:items-center md:justify-center p-8 text-white overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#E31E24]/10 rounded-full -ml-32 -mb-32 blur-3xl" />

            <div className="text-center relative z-10">
              <h2 className="text-3xl font-black mb-4">Birga Quramiz</h2>
              <div className="h-1 w-12 bg-[#E31E24] mx-auto mb-6 rounded-full" />
              <p className="text-white/80 font-medium leading-relaxed max-w-[280px]">
                {t('subtitle')}
              </p>
              <div className="mt-8 flex flex-col gap-4 text-xs font-bold text-white/60">
                <div className="flex items-center justify-center gap-2">
                  <div className="size-1.5 rounded-full bg-emerald-400" />
                  {t('securePayments')}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="size-1.5 rounded-full bg-emerald-400" />
                  {t('wideCatalog')}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="size-1.5 rounded-full bg-emerald-400" />
                  {t('aiConsultant')}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
