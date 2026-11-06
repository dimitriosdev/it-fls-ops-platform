export const ALLOWED_EMAIL_DOMAIN = "digitecgalaxus.ch";

export function isAllowedEmailDomain(email: string): boolean {
  return email.trim().toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`);
}
