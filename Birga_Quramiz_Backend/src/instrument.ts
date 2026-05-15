import * as Sentry from '@sentry/nestjs';

/**
 * Sentry must be initialised before any other imports.
 * Import this file as the very first line of main.ts.
 * Safe to call with no DSN — Sentry is a no-op when disabled.
 */
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV ?? 'development',
  enabled: !!process.env.SENTRY_DSN,

  // Capture 10 % of traces in production, 100 % elsewhere
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Strip sensitive fields before sending to Sentry
  beforeSend(event) {
    if (event.request?.headers) {
      delete (event.request.headers as Record<string, unknown>)[
        'authorization'
      ];
      delete (event.request.headers as Record<string, unknown>)['cookie'];
      delete (event.request.headers as Record<string, unknown>)[
        'x-refresh-token'
      ];
    }
    if (event.request?.data && typeof event.request.data === 'object') {
      const data = event.request.data as Record<string, unknown>;
      for (const key of [
        'password',
        'token',
        'refreshToken',
        'code',
        'otp',
        'phone',
      ]) {
        if (key in data) data[key] = '[Filtered]';
      }
    }
    return event;
  },
});
