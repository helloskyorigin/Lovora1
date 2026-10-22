import {isSameOriginRequest} from "@/lib/request-origin";
import {createHash} from "node:crypto";
import {NextRequest,NextResponse} from "next/server";
import {BIRTH_COOKIE,BIRTH_TTL_SECONDS,readBirthDraftFromRequest,sealBirthDraft} from "@/lib/birth-session";
import {calculateFreeInsight} from "@/lib/prokerala";
import {allowPublicCost} from "@/lib/traffic-guard";
import type {JourneyDraft} from "@/lib/context";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store"};
/** No pretend planetary reading if Prokerala or rate-limit storage is unavailable. */
const guide=(reason:string)=>NextResponse.json({ok:true,mode:"guide",reason},{headers});

export async function POST(request:NextRequest){
 if(!isSameOriginRequest(request))return NextResponse.json({ok:false,error:"Invalid request origin."},{status:403,headers});
 const saved=readBirthDraftFromRequest(request) as JourneyDraft|null;
 if(!saved)return guide("SESSION_UNAVAILABLE");
 const draft:JourneyDraft={...saved,relationship:saved.relationship||{status:"private",interest:"path"}};
 if(!draft.birthTime||!draft.timeKnown)return guide("BIRTH_TIME_REQUIRED");
 if(draft.preview?.marriagePath?.available)return NextResponse.json({ok:true,mode:"verified",insight:draft.preview},{headers});
 try{
  if(!await allowPublicCost(request,"insight"))return guide("RATE_LIMIT");
 }catch(e){
  console.warn("LOVORA free chart limiter unavailable:",e instanceof Error?e.message:"unknown");
  return guide("SERVICE_BUSY");
 }
 const cacheKey=createHash("sha256").update(JSON.stringify([
  draft.dateOfBirth,draft.birthTime,draft.place.id,draft.place.latitude,draft.place.longitude,draft.place.timezone
 ])).digest("hex");
 try{
  const insight=await calculateFreeInsight(draft,cacheKey);
  const updated:JourneyDraft={...draft,preview:insight};
  const token=sealBirthDraft(updated);
  const result=NextResponse.json({ok:true,mode:"verified",insight,sessionToken:token},{headers});
  result.cookies.set(BIRTH_COOKIE,token,{
    httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",
    maxAge:Math.max(1,Math.floor((draft.savedAt+BIRTH_TTL_SECONDS*1000-Date.now())/1000))
  });
  return result;
 }catch(error){
  const code=error instanceof Error?error.message:"UNKNOWN";
  console.warn("LOVORA chart unavailable:",code);
  return guide(code==="PROKERALA_NOT_CONFIGURED"?"PROVIDER_NOT_CONFIGURED":"ASTROLOGY_UNAVAILABLE");
 }
}
