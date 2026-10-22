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
/** Fail closed if Redis is offline: public traffic must never drain paid provider quota. */
export async function allowPublicCost(request:NextRequest,kind:PublicCost):Promise<boolean>{
 const config=limits[kind];
 const key="public:"+kind+":"+fingerprint(request);
 if(!await limitAttempts(key,config.perIp,3600))return false;
 // A shared daily budget prevents proxy IP rotation from exhausting the paid APIs.
 const date=new Date().toISOString().slice(0,10);
 return limitAttempts("global:"+kind+":"+date,dailyLimit(config.env,config.perDay),86400);
}
