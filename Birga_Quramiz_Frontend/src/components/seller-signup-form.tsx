'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Eye, EyeOff, Phone, Lock, User, Building2, ArrowRight, Loader2, TrendingUp, BarChart3, Store } from 'lucide-react'
import { registerSeller } from '@/lib/api/auth'
import { formatPhone } from '@/lib/formatPhone'
import Link from 'next/link'

function getPasswordStrength(pw: string): 0 | 1 | 2 | 3 {
  if (pw.length === 0) return 0
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw) || /[0-9]/.test(pw)) score++
  if (pw.length >= 12 || /[^A-Za-z0-9]/.test(pw)) score++
  return Math.min(score, 3) as 0 | 1 | 2 | 3
}

const STRENGTH_COLORS: Record<1 | 2 | 3, string> = {
  1: 'bg-red-400',
  2: 'bg-amber-400',
  3: 'bg-emerald-400',
}
const STRENGTH_LABELS: Record<1 | 2 | 3, string> = {
  1: 'Слабый', 2: 'Средний', 3: 'Сильный',
}

export function SellerSignupForm() {
  const t = useTranslations('Auth')
  const tProfile = useTranslations('Profile')

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [company, setCompany] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const strength = useMemo(() => getPasswordStrength(password), [password])

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await registerSeller({ name, phone: phone.replace(/\s/g, ''), password, company })
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('registrationFailed'))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px] bg-white rounded-3xl shadow-lg shadow-slate-200 border border-slate-100 px-8 py-10 text-center">
          <div className="inline-flex size-16 items-center justify-center rounded-full bg-amber-50 mb-5">
            <Store className="size-8 text-amber-500" />
          </div>
          <h2 className="text-[22px] font-black text-slate-900 mb-2">{t('sellerSignupTitle')}</h2>
          <p className="text-[13px] text-slate-500 leading-relaxed max-w-[300px] mx-auto">
            Ваша заявка отправлена. Мы свяжемся с вами после проверки администратором.
          </p>
          <Link
            href="/"
            className="mt-7 inline-flex items-center justify-center gap-2 h-12 w-full rounded-full bg-navbar-gradient text-white font-black text-[14px] shadow-lg shadow-[#0b3190]/25 active:scale-[0.98] transition-all"
          >
            На главную
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[420px]">

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-lg shadow-slate-200 border border-slate-100 px-7 py-7">

          {/* Header */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center gap-1.5 bg-[#0b3190]/8 text-[#0b3190] text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">
              <Store className="size-3" />
              {t('sellerSignupTitle')}
            </div>
            <h1 className="text-[22px] font-black text-slate-900 leading-tight">
              {tProfile('seller.title')}
            </h1>
            <p className="mt-1 text-[12px] text-slate-400">
              {tProfile('seller.subtitle')}
            </p>
          </div>

          {/* Benefits strip */}
          <div className="mb-5 grid grid-cols-3 gap-2">
            {[
              { icon: TrendingUp, label: t('factoryPrices') },
              { icon: BarChart3, label: t('comprehensiveAnalytics') },
              { icon: Store, label: t('quickSales') },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1 rounded-2xl bg-[#f8f9fc] px-2 py-2.5 text-center">
                <Icon className="size-4 text-[#0b3190]/60" />
                <span className="text-[10px] font-bold text-slate-500 leading-tight">{label}</span>
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-2xl bg-red-50 border border-red-100 px-4 py-3">
              <div className="mt-0.5 shrink-0 size-4 rounded-full bg-red-400 flex items-center justify-center">
                <span className="text-white text-[9px] font-black">!</span>
              </div>
              <p className="text-[12px] font-semibold text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">

            {/* Company */}
            <div>
              <label className="block text-[12px] font-bold text-slate-500 mb-1.5">{t('companyName')}</label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-300" />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder={t('companyNamePlaceholder')}
                  required
                  className="w-full h-12 pl-10 pr-4 rounded-2xl border border-slate-200 bg-[#f8f9fc] text-[14px] font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-[#0b3190] focus:ring-2 focus:ring-[#0b3190]/10 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-[12px] font-bold text-slate-500 mb-1.5">{t('name')}</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-300" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('namePlaceholder')}
                  required
                  className="w-full h-12 pl-10 pr-4 rounded-2xl border border-slate-200 bg-[#f8f9fc] text-[14px] font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-[#0b3190] focus:ring-2 focus:ring-[#0b3190]/10 focus:bg-white transition-all"
                />
              </div>
            </div>

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
                  minLength={6}
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

              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3].map((lvl) => (
                      <div
                        key={lvl}
                        className={`h-1 flex-1 rounded-full transition-all ${strength >= lvl ? STRENGTH_COLORS[strength as 1 | 2 | 3] : 'bg-slate-100'}`}
                      />
                    ))}
                  </div>
                  <p className={`text-[11px] font-bold ${strength === 1 ? 'text-red-400' : strength === 2 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {STRENGTH_LABELS[strength as 1 | 2 | 3]}
                  </p>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 h-12 w-full rounded-full bg-navbar-gradient text-white font-black text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-[#0b3190]/25 hover:shadow-xl hover:shadow-[#0b3190]/30 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <>
                  {t('registerAsSeller')}
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-[12px] text-slate-400">
            {t('alreadyAccount')}{' '}
            <Link href="/login" className="font-bold text-[#0b3190] hover:underline">
              {t('signIn')}
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}
