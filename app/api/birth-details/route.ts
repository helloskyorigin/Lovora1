import { isSameOriginRequest } from "@/lib/request-origin";
import { NextRequest, NextResponse } from "next/server";
import { validateBirthInput } from "@/lib/birth";
import { getVerifiedPlace } from "@/lib/city-directory";
import { BIRTH_COOKIE, BIRTH_TTL_SECONDS, readBirthDraftFromRequest, sealBirthDraft } from "@/lib/birth-session";
import type { JourneyDraft } from "@/lib/context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest) {
  const draft = readBirthDraftFromRequest(request);
  if (!draft) return NextResponse.json({ ok: false, error: "No saved birth details found." }, { status: 404, headers });
  return NextResponse.json({ ok: true, draft }, { headers });
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, error: "Invalid request origin." }, { status: 403, headers });
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ ok: false, error: "Expected JSON form submission." }, { status: 415, headers });
  }
  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 2048) return NextResponse.json({ ok: false, error: "Form data is too large." }, { status: 413, headers });
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON data." }, { status: 400, headers });
  }
  const validated = validateBirthInput(body);
  if (!validated.ok) return NextResponse.json({ ok: false, error: validated.error }, { status: 400, headers });
  try {
    const place = await getVerifiedPlace(validated.data.placeId);
    const draft: JourneyDraft = {
      firstName: validated.data.firstName,
      dateOfBirth: validated.data.dateOfBirth,
      birthTime: validated.data.birthTime,
      timeKnown: validated.data.timeKnown,
      guardianConsent: validated.data.guardianConsent,
      place,
      savedAt: Date.now(),
      relationship: {status:"private",interest:"path"},
    };
    const token = sealBirthDraft(draft);
    const response = NextResponse.json({ ok: true, next: "/insight", sessionToken: token }, { headers });
    response.cookies.set(BIRTH_COOKIE, token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "lax", path: "/", maxAge: BIRTH_TTL_SECONDS,
    });
    return response;
  } catch (error) {
    const cause = error instanceof Error ? error.message : "UNKNOWN";
    console.error("Birth-details processing error:", cause);
    if (cause.includes("BIRTH_SESSION_SECRET")) {
      return NextResponse.json({ ok: false, code: "SESSION_SECRET_MISSING",
        error: "Secure session is not configured. Add BIRTH_SESSION_SECRET (at least 32 characters) to your app server secrets, then restart the preview."
      }, { status: 503, headers });
    }
    if (cause === "CITY_NOT_FOUND_IN_DIRECTORY" || cause === "INVALID_CITY_ID") {
      return NextResponse.json({ ok: false, code: "CITY_SELECTION_EXPIRED",
        error: "The selected birthplace is no longer valid. Search and select your city again."
      }, { status: 400, headers });
    }
    return NextResponse.json({ ok: false, code: "BIRTH_SAVE_UNAVAILABLE",
      error: "Unable to save your birth details right now. Please retry or check the app server logs."
    }, { status: 503, headers });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, error: "Invalid request origin." }, { status: 403, headers });
  }
  const response = NextResponse.json({ ok: true }, { headers });
  response.cookies.delete(BIRTH_COOKIE);
  return response;
}
