'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Eye, EyeOff, Phone, Lock, ArrowRight, Loader2 } from 'lucide-react'
import { login } from '@/lib/api/auth'
import { useAuthStore } from '@/store/authStore'
import { formatPhone } from '@/lib/formatPhone'
import Link from 'next/link'

export function LoginForm({ returnUrl }: { returnUrl?: string }) {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const setInitialized = useAuthStore((s) => s.setInitialized)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isInitialized = useAuthStore((s) => s.isInitialized)
  const user = useAuthStore((s) => s.user)
  const t = useTranslations('Auth')
  const safeReturn = returnUrl?.startsWith('/') ? returnUrl : '/'

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect already-logged-in users — must be after all hooks
  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return
    if (user?.role === 'ADMIN') { router.replace('/admin'); return }
    if (user?.role === 'DISPATCHER') { router.replace('/dispatcher'); return }
    if (user?.role === 'SELLER') { router.replace('/seller/dashboard'); return }
    router.replace(safeReturn)
  }, [isInitialized, isAuthenticated, user, router, safeReturn])

  // Render nothing until auth is known or while redirecting
  if (!isInitialized || isAuthenticated) return null

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { user } = await login({ phone: phone.replace(/\s/g, ''), password })
      setUser(user)
      setInitialized(true)
      if (user.role === 'ADMIN') { router.push('/admin'); return }
      if (user.role === 'DISPATCHER') { router.push('/dispatcher'); return }
      if (user.role === 'SELLER') { router.push('/seller/dashboard'); return }
      router.push(safeReturn)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('loginFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[400px]">

        {/* Logo */}
        <div className="mb-10 text-center">
          <Link href="/">
            <span className="text-[38px] font-black lowercase leading-none tracking-[-0.07em] text-[#0b3190]">
              birga quramiz
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-lg shadow-slate-200 border border-slate-100 px-8 py-9">

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-[26px] font-black text-slate-900 mb-3">{t('loginTitle')}</h1>
            <p className="text-[13px] text-slate-400">{t('noAccount')}</p>
            <Link href="/signup" className="inline-block mt-1 text-[13px] font-bold text-[#0b3190] hover:underline">
              {t('createAccount')}
            </Link>
          </div>

          {error && (
            <div className={`mb-6 flex items-start gap-2.5 rounded-2xl border px-4 py-3 ${error.toLowerCase().includes('pending') ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'}`}>
              <div className={`mt-0.5 shrink-0 size-4 rounded-full flex items-center justify-center ${error.toLowerCase().includes('pending') ? 'bg-amber-400' : 'bg-red-400'}`}>
                <span className="text-white text-[9px] font-black">!</span>
              </div>
              <p className={`text-[12px] font-semibold ${error.toLowerCase().includes('pending') ? 'text-amber-700' : 'text-red-600'}`}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Phone */}
            <div>
              <label className="block text-[12px] font-bold text-slate-500 mb-1.5">{t('phone')}</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-300" />
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="+998 90 123 45 67"
                  required
                  className="w-full h-12 pl-10 pr-4 rounded-2xl border border-slate-200 bg-[#f8f9fc] text-[14px] font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-[#0b3190] focus:ring-2 focus:ring-[#0b3190]/10 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[12px] font-bold text-slate-500 mb-1.5">{t('password')}</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-300" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-12 pl-10 pr-11 rounded-2xl border border-slate-200 bg-[#f8f9fc] text-[14px] font-medium text-slate-800 focus:outline-none focus:border-[#0b3190] focus:ring-2 focus:ring-[#0b3190]/10 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-3 h-13 w-full rounded-full bg-navbar-gradient text-white font-black text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-[#0b3190]/25 hover:shadow-xl hover:shadow-[#0b3190]/30 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <>
                  {t('signIn')}
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
