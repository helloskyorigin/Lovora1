import "server-only";
import {createHmac} from "node:crypto";
import type {NextRequest} from "next/server";
import {limitAttempts} from "./payments/order-store";

type PublicCost="insight"|"places"|"birth";
const limits:Record<PublicCost,{perIp:number;perDay:number;env:string}>={
 insight:{perIp:4,perDay:100,env:"LOVORA_FREE_CHARTS_PER_DAY"},
 places:{perIp:60,perDay:900,env:"LOVORA_PLACES_PER_DAY"},
 birth:{perIp:10,perDay:250,env:"LOVORA_BIRTH_VERIFICATIONS_PER_DAY"},
};
function dailyLimit(name:string,fallback:number):number{
 const raw=process.env[name];
 if(!raw)return fallback;
 const value=Number(raw);
 if(!Number.isSafeInteger(value)||value<1||value>5000)throw new Error("INVALID_DAILY_BUDGET");
 return value;
}
function fingerprint(request:NextRequest):string{
 const ip=request.headers.get("x-real-ip")||request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"unidentified";
 const secret=process.env.REPORT_ENCRYPTION_SECRET||process.env.BIRTH_SESSION_SECRET;
 if(!secret||secret.length<32)throw new Error("RATE_SECRET_MISSING");
 return createHmac("sha256",secret).update(ip.slice(0,100)).digest("hex").slice(0,32);
}
const previewBudgets=new Map<string,{count:number,expires:number}>();
function localPreviewLimit(key:string,max:number,seconds:number):boolean{
 const now=Date.now();
 if(previewBudgets.size>2000)previewBudgets.clear();
 const entry=previewBudgets.get(key);
 const next=entry&&entry.expires>now?{count:entry.count+1,expires:entry.expires}:{count:1,expires:now+seconds*1000};
 previewBudgets.set(key,next);
 return next.count<=max;
}
/** Production always fails closed on missing Redis, protecting provider credits. */
export async function allowPublicCost(request:NextRequest,kind:PublicCost):Promise<boolean>{
 const config=limits[kind];
 // AI Studio dev previews can run without Upstash; still cap chargeable calls.
 if(process.env.NODE_ENV!=="production"&&(!process.env.UPSTASH_REDIS_REST_URL||!process.env.UPSTASH_REDIS_REST_TOKEN)){
  const ip=request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"local";
  const day=new Date().toISOString().slice(0,10);
  return localPreviewLimit("dev:"+kind+":"+ip,Math.min(config.perIp,4),3600)&&
    localPreviewLimit("dev:day:"+kind+":"+day,Math.min(config.perDay,25),86400);
 }
 const key="public:"+kind+":"+fingerprint(request);
 if(!await limitAttempts(key,config.perIp,3600))return false;
 // A shared daily budget prevents proxy IP rotation from exhausting the paid APIs.
 const date=new Date().toISOString().slice(0,10);
 return limitAttempts("global:"+kind+":"+date,dailyLimit(config.env,config.perDay),86400);
}
