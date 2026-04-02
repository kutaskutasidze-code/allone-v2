/**
 * Georgian phone number normalization and validation.
 * Georgian numbers: +995 (country code)
 *   Mobile: +995 5XX XXX XXX (9 digits after country code)
 *   Tbilisi landline: +995 32 XXX XX XX (9 digits)
 *   Other landlines: +995 3XX XX XX XX (9 digits)
 */

export function normalizeGeorgianPhone(raw: string): string | null {
  // Strip everything except digits and leading +
  let digits = raw.replace(/[^0-9+]/g, '');

  // Remove leading + for easier processing, we'll add it back
  const hasPlus = digits.startsWith('+');
  if (hasPlus) digits = digits.slice(1);

  // Handle various formats
  if (digits.startsWith('995') && digits.length >= 12) {
    // Already has country code: 995XXXXXXXXX
    digits = digits.slice(0, 12); // trim extra digits
  } else if (digits.startsWith('0') && digits.length >= 9) {
    // Local format: 0XXXXXXXXX -> 995XXXXXXXXX
    digits = '995' + digits.slice(1);
  } else if (digits.startsWith('5') && digits.length === 9) {
    // Mobile without prefix: 5XXXXXXXX -> 9955XXXXXXXX
    digits = '995' + digits;
  } else if (digits.startsWith('32') && digits.length === 9) {
    // Tbilisi landline without prefix: 32XXXXXXX -> 99532XXXXXXX
    digits = '995' + digits;
  } else if (digits.startsWith('3') && digits.length === 9) {
    // Other landline without prefix
    digits = '995' + digits;
  } else {
    return null; // not a valid Georgian number
  }

  // Validate: must be exactly 12 digits (995 + 9 digits)
  if (digits.length !== 12) return null;

  // Validate prefix after 995: must start with 5 (mobile) or 3 (landline)
  const localPart = digits.slice(3);
  if (!localPart.startsWith('5') && !localPart.startsWith('3')) return null;

  return '+' + digits;
}

export function isGeorgianMobile(phone: string): boolean {
  const normalized = phone.replace(/[^0-9+]/g, '');
  return /^\+?9955\d{8}$/.test(normalized);
}
