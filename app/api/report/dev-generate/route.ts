import { NextRequest,NextResponse } from "next/server";
import { createHash,timingSafeEqual } from "node:crypto";
import { BIRTH_COOKIE,readBirthDraft } from "@/lib/birth-session";
import type { JourneyDraft } from "@/lib/context";
import { generateAndStoreReport } from "@/lib/report/generate";
import { ACCESS_TTL,REPORT_COOKIE,sealAccess } from "@/lib/report/access";
import { allowDevReport } from "@/lib/dev-report-limit";

export const runtime="nodejs";
export const dynamic="force-dynamic";

function secretMatches(candidate:string):boolean{
  const expected=process.env.LOVORA_DEV_REPORT_SECRET||"";
  if(expected.length<32||candidate.length>200)return false;
  const a=createHash("sha256").update(candidate).digest();
  const b=createHash("sha256").update(expected).digest();
  return timingSafeEqual(a,b);
}
export async function POST(req:NextRequest){
  const noStore={"Cache-Control":"no-store"};
  if(process.env.NODE_ENV==="production")return NextResponse.json({error:"Not found"},{status:404,headers:noStore});
  const origin=req.headers.get("origin");
  if(origin&&origin!==new URL(req.url).origin)return NextResponse.json({error:"Forbidden"},{status:403,headers:noStore});
  const candidate=req.headers.get("x-lovora-dev-secret")||"";
  if(!secretMatches(candidate))return NextResponse.json({error:"Developer-only authorization failed."},{status:403,headers:noStore});
  const draft=readBirthDraft(req.cookies.get(BIRTH_COOKIE)?.value) as JourneyDraft|null;
  if(!draft?.relationship)return NextResponse.json({error:"Complete both onboarding steps first."},{status:401,headers:noStore});
  // Cost guard against accidental repeated provider calls.
  const ip=req.headers.get("x-forwarded-for")?.split(",")[0]||"local";
  if(!allowDevReport("paid-dev:"+ip))return NextResponse.json({error:"Too many development report attempts."},{status:429,headers:noStore});
  try{
    const report=await generateAndStoreReport(draft);
    const response=NextResponse.json({ok:true,next:"/report",id:report.id},{headers:noStore});
    response.cookies.set(REPORT_COOKIE,sealAccess({reportId:report.id,orderId:"DEV-ONLY",isDev:true}),{
      httpOnly:true,sameSite:"lax",secure:false,maxAge:ACCESS_TTL,path:"/",
    });
    return response;
  }catch(err){
    const code=err instanceof Error?err.message:"UNKNOWN";
    console.error("LOVORA dev report:",code);
    return NextResponse.json({ok:false,error:"Report unavailable; check Prokerala credentials, birth details and report storage. No mock output was generated."},{status:503,headers:noStore});
  }
}
