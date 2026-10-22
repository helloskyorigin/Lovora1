import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { BirthDraft } from "./birth";

export const BIRTH_COOKIE = "lovora_birth_draft";
export const BIRTH_TTL_SECONDS = 60 * 60 * 24;

function key(): Buffer {
  const secret = process.env.BIRTH_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("BIRTH_SESSION_SECRET must be configured with at least 32 characters.");
  }
  return createHash("sha256").update(secret).digest();
}

export function sealBirthDraft(draft: BirthDraft): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(draft), "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64url")).join(".");
}

export function readBirthDraft(token: string | undefined): BirthDraft | null {
  if (!token || token.length > 3600) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [iv, tag, encrypted] = parts.map((part) => Buffer.from(part, "base64url"));
    if (iv.length !== 12 || tag.length !== 16) return null;
    const decipher = createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    const json = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
    const draft = JSON.parse(json) as BirthDraft;
    if (typeof draft.savedAt !== "number" || Date.now() - draft.savedAt > BIRTH_TTL_SECONDS * 1000 || draft.savedAt > Date.now() + 60000) return null;
    return draft;
  } catch {
    return null;
  }
}
