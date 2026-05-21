'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Phone, ArrowRight, Loader2, ChevronLeft, User as UserIcon } from 'lucide-react'
import { sendOtp, verifyOtp, updateProfile, telegramWidgetLogin } from '@/lib/api/auth'
import { TelegramLoginButton } from '@/components/auth/TelegramLoginButton'
import type { TelegramWidgetUser } from '@/lib/api/auth'
import { useAuthStore } from '@/store/authStore'
import { formatPhone } from '@/lib/formatPhone'
import Link from 'next/link'
import { PageLoader } from '@/components/ui/FullPageLoader'
import type { User } from '@/types'

type Step = 'phone' | 'otp' | 'name'

const RESEND_DELAY = 60

export function LoginForm({ returnUrl }: { returnUrl?: string }) {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const setInitialized = useAuthStore((s) => s.setInitialized)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isInitialized = useAuthStore((s) => s.isInitialized)
  const user = useAuthStore((s) => s.user)
  const t = useTranslations('Auth')
  const safeReturn = returnUrl?.startsWith('/') ? returnUrl : '/'

  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [otpMethod, setOtpMethod] = useState<'telegram' | 'sms' | null>(null)
  const [pendingUser, setPendingUser] = useState<User | null>(null)
  const [pendingTelegramToken, setPendingTelegramToken] = useState<string | undefined>(undefined)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return
    if (user?.role === 'ADMIN') { router.replace('/admin'); return }
    if (user?.role === 'DISPATCHER') { router.replace('/dispatcher'); return }
    if (user?.role === 'SELLER') { router.replace('/seller/dashboard'); return }
    router.replace(safeReturn)
  }, [isInitialized, isAuthenticated, user, router, safeReturn])

  useEffect(() => {
    return () => { if (countdownRef.current) clearInterval(countdownRef.current) }
  }, [])

  if (isAuthenticated) return null
  if (!isInitialized) return <PageLoader />

  function startResendCountdown() {
    setResendCountdown(RESEND_DELAY)
    countdownRef.current = setInterval(() => {
      setResendCountdown((v) => {
        if (v <= 1) { clearInterval(countdownRef.current!); return 0 }
        return v - 1
      })
    }, 1000)
  }

  function redirectAfterLogin(u: User) {
    if (u.role === 'ADMIN') { router.push('/admin'); return }
    if (u.role === 'DISPATCHER') { router.push('/dispatcher'); return }
    if (u.role === 'SELLER') { router.push('/seller/dashboard'); return }
    router.push(safeReturn)
  }

  const handleTelegramWidgetAuth = async (tgUser: TelegramWidgetUser) => {
    setError('')
    setLoading(true)
    try {
      const result = await telegramWidgetLogin(tgUser)
      if (!result.requiresPhone) {
        setUser(result.user)
        setInitialized(true)
        redirectAfterLogin(result.user)
      } else {
        // Not linked yet — store pending token, let user continue with OTP
        setPendingTelegramToken(result.pendingToken)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('loginFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await sendOtp(phone.replace(/\s/g, ''))
      setOtpMethod(result.method)
      setStep('otp')
      startResendCountdown()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('loginFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCountdown > 0 || loading) return
    setError('')
    setLoading(true)
    try {
      const result = await sendOtp(phone.replace(/\s/g, ''))
      setOtpMethod(result.method)
      setCode('')
      startResendCountdown()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('loginFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await verifyOtp({ phone: phone.replace(/\s/g, ''), code, pendingTelegramToken })
      if (result.isNewUser && !result.user.name) {
        setPendingUser(result.user)
        setStep('name')
        return
      }
      setUser(result.user)
      setInitialized(true)
      redirectAfterLogin(result.user)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('loginFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const updated = await updateProfile({ name: name.trim() })
      setUser(updated)
      setInitialized(true)
      redirectAfterLogin(updated)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('loginFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleSkipName = () => {
    if (!pendingUser) return
    setUser(pendingUser)
    setInitialized(true)
    redirectAfterLogin(pendingUser)
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

          {/* Step: phone */}
          {step === 'phone' && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-[26px] font-black text-slate-900 mb-3">{t('loginTitle')}</h1>
              </div>

              {error && <ErrorBanner message={error} />}

              <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-slate-500 mb-1.5">{t('phone')}</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-300" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      placeholder="+998 90 123 45 67"
                      required
                      className="w-full h-12 pl-10 pr-4 rounded-2xl border border-slate-200 bg-[#f8f9fc] text-[14px] font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-[#0b3190] focus:ring-2 focus:ring-[#0b3190]/10 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-3 h-13 w-full rounded-full bg-navbar-gradient text-white font-black text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-[#0b3190]/25 hover:shadow-xl hover:shadow-[#0b3190]/30 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading
                    ? <Loader2 className="size-5 animate-spin" />
                    : <>{t('otpSend')}<ArrowRight className="size-4" /></>}
                </button>
              </form>

              {process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME && (
                <>
                  <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">or</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>
                  <TelegramLoginButton
                    botName={process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}
                    onAuth={handleTelegramWidgetAuth}
                  />
                </>
              )}
            </>
          )}

          {/* Step: otp */}
          {step === 'otp' && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-[26px] font-black text-slate-900 mb-2">{t('otpEnter')}</h1>
                <p className="text-[13px] text-slate-500">
                  {otpMethod === 'telegram' ? t('otpSentTelegram') : t('otpSent', { phone })}
                </p>
              </div>

              {error && <ErrorBanner message={error} />}

              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-slate-500 mb-1.5">{t('otpCode')}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    required
                    autoFocus
                    className="w-full h-14 px-4 rounded-2xl border border-slate-200 bg-[#f8f9fc] text-[22px] font-black text-center text-slate-800 tracking-[0.4em] placeholder:text-slate-300 placeholder:tracking-normal focus:outline-none focus:border-[#0b3190] focus:ring-2 focus:ring-[#0b3190]/10 focus:bg-white transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || code.length < 6}
                  className="mt-1 h-13 w-full rounded-full bg-navbar-gradient text-white font-black text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-[#0b3190]/25 hover:shadow-xl hover:shadow-[#0b3190]/30 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading
                    ? <Loader2 className="size-5 animate-spin" />
                    : <>{t('otpVerify')}<ArrowRight className="size-4" /></>}
                </button>
              </form>

              <div className="mt-5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setStep('phone'); setCode(''); setError('') }}
                  className="text-[12px] text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft className="size-3.5" />{t('backToPhone')}
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCountdown > 0 || loading}
                  className="text-[12px] font-semibold text-[#0b3190] disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                  {resendCountdown > 0
                    ? `${t('otpResend')} (${resendCountdown}s)`
                    : t('otpResend')}
                </button>
              </div>
            </>
          )}

          {/* Step: name */}
          {step === 'name' && (
            <>
              <div className="text-center mb-8">
                <div className="mx-auto mb-4 size-14 rounded-full bg-[#eef2ff] flex items-center justify-center">
                  <UserIcon className="size-6 text-[#0b3190]" />
                </div>
                <h1 className="text-[26px] font-black text-slate-900 mb-2">{t('nameStep')}</h1>
                <p className="text-[13px] text-slate-400">{t('nameStepSubtitle')}</p>
              </div>

              {error && <ErrorBanner message={error} />}

              <form onSubmit={handleSaveName} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-slate-500 mb-1.5">{t('name')}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('namePlaceholder')}
                    required
                    autoFocus
                    minLength={2}
                    className="w-full h-12 px-4 rounded-2xl border border-slate-200 bg-[#f8f9fc] text-[14px] font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-[#0b3190] focus:ring-2 focus:ring-[#0b3190]/10 focus:bg-white transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || name.trim().length < 2}
                  className="mt-1 h-13 w-full rounded-full bg-navbar-gradient text-white font-black text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-[#0b3190]/25 hover:shadow-xl hover:shadow-[#0b3190]/30 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading
                    ? <Loader2 className="size-5 animate-spin" />
                    : <>{t('nameSave')}<ArrowRight className="size-4" /></>}
                </button>

                <button
                  type="button"
                  onClick={handleSkipName}
                  className="text-center text-[12px] text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {t('nameSkip')}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  const isPending = message.toLowerCase().includes('pending')
  return (
    <div className={`mb-6 flex items-start gap-2.5 rounded-2xl border px-4 py-3 ${isPending ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'}`}>
      <div className={`mt-0.5 shrink-0 size-4 rounded-full flex items-center justify-center ${isPending ? 'bg-amber-400' : 'bg-red-400'}`}>
        <span className="text-white text-[9px] font-black">!</span>
      </div>
      <p className={`text-[12px] font-semibold ${isPending ? 'text-amber-700' : 'text-red-600'}`}>{message}</p>
    </div>
  )
}
