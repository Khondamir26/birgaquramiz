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
  const setAuth = useAuthStore((s) => s.setAuth)
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
      const { token } = await login({ phone, password })
      localStorage.setItem('token', token)
      const { getProfile } = await import('@/lib/api/auth')
      const user = await getProfile()
      setAuth(token, user)

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
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">{t('loginTitle')}</h1>
                <p className="text-muted-foreground text-sm">
                  {t('noAccount')}{' '}
                  <a href="/signup" className="underline">
                    {t('createAccount')}
                  </a>
                </p>
                <a href="/admin/login" className="text-xs text-muted-foreground underline">
                  {t('adminSignIn')}
                </a>
              </div>

              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}

              <Field>
                <FieldLabel>{t('phone')}</FieldLabel>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998901234567"
                  required
                />
              </Field>

              <Field>
                <FieldLabel>{t('password')}</FieldLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t('signingIn') : t('signIn')}
                </Button>
              </Field>
            </FieldGroup>
          </form>

          <div className="bg-muted relative hidden md:flex md:items-center md:justify-center p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Birga Quramiz</h2>
              <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
