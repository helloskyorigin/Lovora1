import { NextRequest, NextResponse } from "next/server";
import { validateBirthInput } from "@/lib/birth";
import { getVerifiedPlace } from "@/lib/geonames";
import { allowPublicCost } from "@/lib/traffic-guard";
import { BIRTH_COOKIE, BIRTH_TTL_SECONDS, readBirthDraft, sealBirthDraft } from "@/lib/birth-session";
import type { BirthDraft } from "@/lib/birth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest) {
  const draft = readBirthDraft(request.cookies.get(BIRTH_COOKIE)?.value);
  if (!draft) return NextResponse.json({ ok: false, error: "No saved birth details found." }, { status: 404, headers });
  return NextResponse.json({ ok: true, draft }, { headers });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
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
    if(!await allowPublicCost(request,"birth"))return NextResponse.json({ok:false,error:"Too many birthplace lookups. Please retry later."},{status:429,headers});
    const place = await getVerifiedPlace(validated.data.placeId);
    const draft: BirthDraft = {
      firstName: validated.data.firstName,
      dateOfBirth: validated.data.dateOfBirth,
      birthTime: validated.data.birthTime,
      timeKnown: validated.data.timeKnown,
      place,
      savedAt: Date.now(),
    };
    const token = sealBirthDraft(draft);
    const response = NextResponse.json({ ok: true, next: "/relationship" }, { headers });
    response.cookies.set(BIRTH_COOKIE, token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "lax", path: "/", maxAge: BIRTH_TTL_SECONDS,
    });
    return response;
  } catch (error) {
    console.error("Birth-details processing error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ ok: false, error: "Unable to save your details. Check service configuration or try again." }, { status: 503, headers });
  }
}

export async function DELETE(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ ok: false, error: "Invalid request origin." }, { status: 403, headers });
  }
  const response = NextResponse.json({ ok: true }, { headers });
  response.cookies.delete(BIRTH_COOKIE);
  return response;
}
