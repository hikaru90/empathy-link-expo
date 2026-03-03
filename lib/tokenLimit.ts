/**
 * Token limit (AI usage quota) handling for soft launch.
 * When the user hits the limit, we show a message with contact email instead of premium upsell.
 */

export const TOKEN_LIMIT_CONTACT_EMAIL = 'kontakt@empathy-link.de';

const TOKEN_LIMIT_MESSAGE =
  'Dein Token-Limit wurde erreicht. Schreib uns eine E-Mail an kontakt@empathy-link.de, wenn du mehr Tokens brauchst.';

export function getTokenLimitMessage(): string {
  return TOKEN_LIMIT_MESSAGE;
}

/** True if the error indicates the user has hit their AI token/quota limit. */
export function isTokenLimitError(err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  const status = (err as { status?: number })?.status;
  const message = (err as Error)?.message ?? '';

  if (code === 'TOKEN_LIMIT_REACHED' || code === 'token_limit_reached') return true;
  if (status === 429) return true;

  const lower = message.toLowerCase();
  if ((lower.includes('token') || lower.includes('quota') || lower.includes('limit')) && (lower.includes('limit') || lower.includes('reach') || lower.includes('exceed') || lower.includes('erschöpft'))) return true;

  return false;
}
