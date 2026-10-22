import "server-only";
import { createCipheriv,createDecipheriv,createHash,randomBytes } from "node:crypto";
import type { MarriageStoryReport } from "./types";

const redisUrl=()=>process.env.UPSTASH_REDIS_REST_URL?.replace(/\/+$/,"");
const redisToken=()=>process.env.UPSTASH_REDIS_REST_TOKEN;
const PREFIX="lovora:report:v1:";
const TTL_SECONDS=60*60*24*365;
// For local development without Redis only. Never used in production.
const localReports=new Map<string,{encrypted:string;expires:number}>();

function secretKey(){
  const secret=process.env.REPORT_ENCRYPTION_SECRET || process.env.BIRTH_SESSION_SECRET;
  if(!secret||secret.length<32)throw new Error("REPORT_SECRET_MISSING");
  return createHash("sha256").update(secret).digest();
}
export function encryptReport(report:MarriageStoryReport):string{
  const iv=randomBytes(12);
  const cipher=createCipheriv("aes-256-gcm",secretKey(),iv);
  const data=Buffer.concat([cipher.update(JSON.stringify(report),"utf8"),cipher.final()]);
  return [iv,cipher.getAuthTag(),data].map(x=>x.toString("base64url")).join(".");
}
function decryptReport(payload:string):MarriageStoryReport|null{
  try{
    const parts=payload.split("."); if(parts.length!==3)return null;
    const [iv,tag,data]=parts.map(x=>Buffer.from(x,"base64url"));
    if(iv.length!==12||tag.length!==16)return null;
    const decipher=createDecipheriv("aes-256-gcm",secretKey(),iv);
    decipher.setAuthTag(tag);
    const raw=Buffer.concat([decipher.update(data),decipher.final()]).toString("utf8");
    const report=JSON.parse(raw) as MarriageStoryReport;
    if(report.version!==1||!Array.isArray(report.chapters)||report.chapters.length!==7)return null;
    return report;
  }catch{return null;}
}
async function redis(args:(string|number)[]):Promise<unknown>{
  const url=redisUrl(),token=redisToken();
  if(!url||!token)throw new Error("REPORT_STORAGE_NOT_CONFIGURED");
  const response=await fetch(url,{
    method:"POST",cache:"no-store",signal:AbortSignal.timeout(13000),
    headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},
    body:JSON.stringify(args),
  });
  if(!response.ok)throw new Error("REPORT_STORAGE_UNAVAILABLE");
  const obj=await response.json() as {result?:unknown;error?:string};
  if(obj.error)throw new Error("REPORT_STORAGE_UNAVAILABLE");
  return obj.result;
}
export async function saveReport(report:MarriageStoryReport):Promise<void>{
  const encrypted=encryptReport(report);
  if(!redisUrl()||!redisToken()){
    if(process.env.NODE_ENV==="production")throw new Error("REPORT_STORAGE_NOT_CONFIGURED");
    if(localReports.size>40)localReports.clear();
    localReports.set(report.id,{encrypted,expires:Date.now()+TTL_SECONDS*1000});
    return;
  }
  const result=await redis(["SET",PREFIX+report.id,encrypted,"EX",TTL_SECONDS]);
  if(result!=="OK")throw new Error("REPORT_STORAGE_UNAVAILABLE");
}
export async function getReport(id:string):Promise<MarriageStoryReport|null>{
  if(!/^[a-f0-9-]{36}$/.test(id))return null;
  let value:unknown;
  if(!redisUrl()||!redisToken()){
    if(process.env.NODE_ENV==="production")return null;
    const item=localReports.get(id);
    value=item&&item.expires>Date.now()?item.encrypted:null;
  }else value=await redis(["GET",PREFIX+id]);
  return typeof value==="string"?decryptReport(value):null;
}
