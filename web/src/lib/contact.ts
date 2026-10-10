export const SERVICES = ['Construction & Remodeling', 'Pool Construction & Renovation', 'Impact Windows & Doors', 'Kitchen & Bathroom Remodeling', 'Roofing & Exterior Improvements', 'Outdoor Living Spaces', 'Other'] as const;
export const LIMITS = { fullName: 100, email: 254, phone: 30, city: 100, message: 3000, turnstileToken: 2048, bodyBytes: 16384 } as const;
export interface ContactInput { fullName: string; email: string; phone: string; service: string; city: string; message: string; consent: boolean; turnstileToken: string }
export type FieldErrors = Partial<Record<keyof ContactInput, string>>;
export type FormState = 'IDLE' | 'VALIDATING' | 'SUBMITTING' | 'SUCCESS' | 'ERROR';
const controls = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
export function validateContact(raw: unknown, requireToken = true): { value: ContactInput; errors: FieldErrors } {
  const input = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  const value: ContactInput = { fullName: '', email: '', phone: '', service: '', city: '', message: '', consent: input.consent === true, turnstileToken: '' };
  const errors: FieldErrors = {};
  for (const key of ['fullName', 'email', 'phone', 'service', 'city', 'message', 'turnstileToken'] as const) {
    value[key] = typeof input[key] === 'string' ? (input[key] as string).normalize('NFC').trim() : '';
    if (!value[key] && (key !== 'turnstileToken' || requireToken)) errors[key] = key === 'turnstileToken' ? 'Please complete the security check.' : 'This field is required.';
    const max = key === 'service' ? 100 : LIMITS[key];
    if (value[key].length > max) errors[key] = `Use ${max} characters or fewer.`;
    if (controls.test(value[key]) || (key !== 'message' && /[\r\n]/.test(value[key]))) errors[key] = 'Please remove unsupported characters.';
  }
  if (value.fullName && value.fullName.length < 2) errors.fullName = 'Enter your full name.';
  if (value.email && !/^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(value.email)) errors.email = 'Enter a valid email address.';
  const digits = value.phone.replace(/\D/g, '');
  if (value.phone && (!/^\+?[\d\s().-]+$/.test(value.phone) || digits.length < 10 || digits.length > 15)) errors.phone = 'Enter a phone number with 10–15 digits.';
  if (value.service && !(SERVICES as readonly string[]).includes(value.service)) errors.service = 'Select an available service.';
  if (value.message && value.message.length < 20) errors.message = 'Describe your project in at least 20 characters.';
  if (!value.consent) errors.consent = 'Your consent is required.';
  return { value, errors };
}
