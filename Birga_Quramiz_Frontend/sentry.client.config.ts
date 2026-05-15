import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn:         process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  enabled:     !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Traces: 5 % in production to keep quota low
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 0,

  // Session replay — only capture replays on errors in production
  replaysSessionSampleRate:  0,
  replaysOnErrorSampleRate:  process.env.NODE_ENV === 'production' ? 1.0 : 0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText:   true,   // mask text to protect PII
      blockAllMedia: false,
    }),
  ],

  beforeSend(event) {
    // Drop 4xx client errors — not actionable
    if (event.exception?.values?.[0]?.value?.includes('404')) return null
    return event
  },
})
