import { NextRequest, NextResponse } from "next/server";
import { searchCities } from "@/lib/city-directory";
import { allowPublicCost } from "@/lib/traffic-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const term = (request.nextUrl.searchParams.get("q") || "").trim();
  if (term.length < 3 || term.length > 60 || /[<>\u0000-\u001F]/.test(term)) {
    return NextResponse.json({ results: [], error: "Enter at least 3 letters of your birth city." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  try {
    if(!await allowPublicCost(request,"places"))return NextResponse.json({results:[],error:"Birth city searches have reached their temporary limit. Try again later."},{status:429,headers:{"Cache-Control":"no-store"}});
    const results = await searchCities(term);
    return NextResponse.json({ results, attribution: "Offline community cities database" }, { headers: { "Cache-Control": "private, max-age=0" } });
  } catch (error) {
    console.error("Offline city lookup failed:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ results: [], error: "City search is unavailable. Please try again." }, { status: 503 });
  }
}
