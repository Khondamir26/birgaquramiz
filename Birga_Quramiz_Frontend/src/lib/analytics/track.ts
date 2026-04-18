const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.birga-quramiz.uz';

export function trackEvent(
  event: string,
  meta: Record<string, string | number | undefined> = {},
): void {
  // Fire-and-forget — never block the user
  void fetch(`${API}/analytics/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, ...meta }),
  }).catch(() => undefined);
}
