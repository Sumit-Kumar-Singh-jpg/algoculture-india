export function cleanIndianPhoneDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }
  return digits;
}

export function isValidIndianPhone(raw: string): boolean {
  const digits = cleanIndianPhoneDigits(raw);
  return /^[6-9]\d{9}$/.test(digits);
}

export function formatE164IndianPhone(raw: string): string {
  const digits = cleanIndianPhoneDigits(raw);
  return `+91${digits}`;
}

export function phoneToAuthEmail(raw: string): string {
  const digits = cleanIndianPhoneDigits(raw);
  return `p91${digits}@phone.algoculture.in`;
}

export function isPhoneAuthEmail(email?: string): boolean {
  return Boolean(email && email.endsWith("@phone.algoculture.in"));
}

export function extractPhoneFromAuthEmail(email?: string): string | null {
  if (!email || !isPhoneAuthEmail(email)) return null;
  const match = email.match(/^p91(\d{10})@phone\.algoculture\.in$/);
  return match ? `+91 ${match[1].slice(0, 5)} ${match[1].slice(5)}` : null;
}
