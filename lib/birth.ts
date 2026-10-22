export type BirthPlace = {
  id: number;
  name: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
};

export type BirthDraft = {
  firstName: string;
  dateOfBirth: string;
  birthTime: string | null;
  timeKnown: boolean;
  place: BirthPlace;
  savedAt: number;
  guardianConsent?: boolean;
};

export type BirthInput = {
  firstName?: unknown;
  dateOfBirth?: unknown;
  birthTime?: unknown;
  timeKnown?: unknown;
  placeId?: unknown;
  guardianConsent?: unknown;
};

export function isEligibleBirthDate(value: string, now = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) return false;
  const cutoff = new Date(Date.UTC(now.getUTCFullYear() - 14, now.getUTCMonth(), now.getUTCDate()));
  const oldest = new Date(Date.UTC(now.getUTCFullYear() - 110, now.getUTCMonth(), now.getUTCDate()));
  return parsed <= cutoff && parsed >= oldest;
}

export function isMinorBirthDate(value: string, now = new Date()): boolean {
  if (!isEligibleBirthDate(value, now)) return false;
  const adultCutoff = new Date(Date.UTC(now.getUTCFullYear() - 18, now.getUTCMonth(), now.getUTCDate()));
  return new Date(value + "T00:00:00Z") > adultCutoff;
}

export function validateBirthInput(value: unknown): { ok: true; data: { firstName: string; dateOfBirth: string; timeKnown: boolean; birthTime: string | null; placeId: number; guardianConsent: boolean } } | { ok: false; error: string } {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return { ok: false, error: "Invalid form submission." };
  const input = value as BirthInput;
  const firstName = typeof input.firstName === "string" ? input.firstName.trim() : "";
  if (firstName.length > 50 || /[<>\r\n\u0000-\u001F]/.test(firstName)) return { ok: false, error: "Enter a valid first name (maximum 50 characters)." };
  if (typeof input.dateOfBirth !== "string" || !isEligibleBirthDate(input.dateOfBirth)) return { ok: false, error: "Enter a valid birth date (ages 14–110)." };
  if (isMinorBirthDate(input.dateOfBirth) && input.guardianConsent !== true) return { ok: false, error: "A parent or guardian must approve this experience for someone under 18." };
  if (typeof input.timeKnown !== "boolean") return { ok: false, error: "Please select whether you know your birth time." };
  let birthTime: string | null = null;
  if (input.timeKnown) {
    if (typeof input.birthTime !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.birthTime)) {
      return { ok: false, error: "Enter your birth time in HH:MM format." };
    }
    birthTime = input.birthTime;
  }
  const placeId = input.placeId;
  if (typeof placeId !== "number" || !Number.isSafeInteger(placeId) || placeId < 1) return { ok: false, error: "Choose a birthplace from the city suggestions." };
  return { ok: true, data: { firstName, dateOfBirth: input.dateOfBirth, birthTime, timeKnown: input.timeKnown, placeId, guardianConsent: input.guardianConsent === true } };
}
