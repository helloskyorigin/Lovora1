import { NextRequest, NextResponse } from "next/server";
import { BIRTH_COOKIE, BIRTH_TTL_SECONDS, readBirthDraft, sealBirthDraft } from "@/lib/birth-session";
import { parseContext, type JourneyDraft } from "@/lib/context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const headers = { "Cache-Control": "no-store" };
  if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ ok: false, error: "Invalid request origin." }, { status: 403, headers });
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ ok: false, error: "Expected JSON." }, { status: 415, headers });
  }
  const draft = readBirthDraft(request.cookies.get(BIRTH_COOKIE)?.value) as JourneyDraft | null;
  if (!draft) return NextResponse.json({ ok: false, error: "Your birth session expired. Please re-enter your birth details." }, { status: 401, headers });
  let value: unknown;
  try {
    const body = await request.text();
    if (body.length > 500) throw new Error("Bad length");
    value = JSON.parse(body);
  } catch { return NextResponse.json({ ok: false, error: "Invalid response." }, { status: 400, headers }); }
  const context = parseContext(value);
  if (!context) return NextResponse.json({ ok: false, error: "Choose your relationship status and one topic." }, { status: 400, headers });
  const updated: JourneyDraft = { ...draft, relationship: context, preview: undefined };
  try {
    const response = NextResponse.json({ ok: true, next: "/insight" }, { headers });
    response.cookies.set(BIRTH_COOKIE, sealBirthDraft(updated), {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
      path: "/", maxAge: Math.max(1, Math.floor((draft.savedAt + BIRTH_TTL_SECONDS * 1000 - Date.now()) / 1000)),
    });
    return response;
  } catch {
    return NextResponse.json({ ok: false, error: "Could not save your choices. Please retry." }, { status: 503, headers });
  }
}
