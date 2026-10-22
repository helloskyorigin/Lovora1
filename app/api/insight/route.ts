import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { BIRTH_COOKIE, BIRTH_TTL_SECONDS, readBirthDraft, sealBirthDraft } from "@/lib/birth-session";
import { calculateFreeInsight } from "@/lib/prokerala";
import { allowPublicCost } from "@/lib/traffic-guard";
import type { JourneyDraft } from "@/lib/context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ ok: false, error: "Invalid request origin." }, { status: 403, headers });
  }
  const draft = readBirthDraft(request.cookies.get(BIRTH_COOKIE)?.value) as JourneyDraft | null;
  if (!draft?.relationship) return NextResponse.json({ ok: false, code: "MISSING_CONTEXT", error: "Complete your birth details and relationship questions first." }, { status: 401, headers });
  if (!draft.birthTime || !draft.timeKnown) return NextResponse.json({
    ok: false, code: "TIME_REQUIRED",
    error: "An exact birth time is needed for the preview. We will not invent a birth time. Please add it to continue.",
  }, { status: 422, headers });
  if (draft.preview) return NextResponse.json({ ok: true, insight: draft.preview }, { headers });
  try {
    if (!await allowPublicCost(request,"insight"))return NextResponse.json({
      ok:false,code:"RATE_LIMIT",error:"Free astrology requests have reached their hourly or daily limit. Try later.",
    },{status:429,headers});
  }catch(error){
    console.error("LOVORA usage limiter unavailable:",error instanceof Error?error.message:"unknown");
    return NextResponse.json({ok:false,code:"LIMITER_UNAVAILABLE",error:"Our preview is temporarily unavailable. Please retry later."},{status:503,headers});
  }

  const cacheKey = createHash("sha256").update(JSON.stringify([
    draft.dateOfBirth, draft.birthTime, draft.place.id, draft.place.latitude,
    draft.place.longitude, draft.place.timezone,
  ])).digest("hex");

  try {
    const insight = await calculateFreeInsight(draft, cacheKey);
    const response = NextResponse.json({ ok: true, insight }, { headers });
    const updated: JourneyDraft = { ...draft, preview: insight };
    response.cookies.set(BIRTH_COOKIE, sealBirthDraft(updated), {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/",
      maxAge: Math.max(1, Math.floor((draft.savedAt + BIRTH_TTL_SECONDS * 1000 - Date.now()) / 1000)),
    });
    return response;
  } catch (error) {
    const code = error instanceof Error ? error.message : "ASTROLOGY_UNAVAILABLE";
    const status = code === "PROKERALA_NOT_CONFIGURED" ? 503 : code === "ASTROLOGY_RATE_LIMIT" ? 429 : code === "AMBIGUOUS_BIRTH_TIME" ? 422 : 502;
    const message = code === "PROKERALA_NOT_CONFIGURED"
      ? "Astrology provider keys aren't configured yet. The report is unavailable, not simulated."
      : code === "AMBIGUOUS_BIRTH_TIME" ? "This birth time could not be resolved accurately in your birthplace timezone."
      : code === "ASTROLOGY_RATE_LIMIT" ? "The astrology service is busy. Please try again."
      : "We couldn't verify your actual planetary positions. Please retry later; no reading has been fabricated.";
    console.error("Astrology free insight error:", code);
    return NextResponse.json({ ok: false, code, error: message }, { status, headers });
  }
}
