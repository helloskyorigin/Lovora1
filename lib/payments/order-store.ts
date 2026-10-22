import "server-only";
import {createCipheriv,createDecipheriv,createHash,randomBytes} from "node:crypto";
import type {JourneyDraft} from "../context";

export type OrderStatus="pending"|"paid"|"ready"|"failed"|"revoked";
export type PaidOrder={
 id:string;email:string;sessionId:string;paymentId:string;
 status:OrderStatus;reportId:string;encryptedDraft:string;createdAt:string;
 generationAttempts?:number;lastAttemptAt?:number;
};
const PREFIX="lovora:order:v1:";
const DURATION=60*60*24*365;
function orderKey(id:string){
 if(!/^[a-f0-9-]{36}$/.test(id))throw new Error("INVALID_ORDER_ID");
 return PREFIX+id;
}
export async function redis(args:(string|number)[]):Promise<unknown>{
 const host=process.env.UPSTASH_REDIS_REST_URL?.replace(/\/+$/,"");
 const token=process.env.UPSTASH_REDIS_REST_TOKEN;
 if(!host||!token)throw new Error("PAYMENT_STORAGE_NOT_CONFIGURED");
 const response=await fetch(host,{method:"POST",cache:"no-store",
  signal:AbortSignal.timeout(12500),headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify(args)});
 if(!response.ok)throw new Error("PAYMENT_STORAGE_UNAVAILABLE");
 const obj=await response.json() as {result?:unknown;error?:string};
 if(obj.error)throw new Error("PAYMENT_STORAGE_UNAVAILABLE");
 return obj.result;
}
export async function createOrder(order:PaidOrder){
 const entries=Object.entries(order).flatMap(([name,value])=>[name,value]);
 await redis(["EVAL","redis.call('HSET',KEYS[1],unpack(ARGV,2));redis.call('EXPIRE',KEYS[1],ARGV[1]);return 1",1,orderKey(order.id),DURATION,...entries]);
}
export async function readOrder(id:string):Promise<PaidOrder|null>{
 if(!/^[a-f0-9-]{36}$/.test(id))return null;
 const value=await redis(["HGETALL",orderKey(id)]);
 if(!Array.isArray(value)||value.length<4)return null;
 const out:Record<string,string>={};
 for(let i=0;i<value.length;i+=2)if(typeof value[i]==="string"&&typeof value[i+1]==="string")out[value[i]]=value[i+1];
 if(out.id!==id||!out.status)return null;
 return {id:out.id,email:out.email||"",sessionId:out.sessionId||"",paymentId:out.paymentId||"",
 status:out.status as OrderStatus,reportId:out.reportId||"",encryptedDraft:out.encryptedDraft||"",createdAt:out.createdAt||"",
 generationAttempts:Number(out.generationAttempts||0),lastAttemptAt:Number(out.lastAttemptAt||0)};
}
export async function patchOrder(id:string,updates:Partial<Omit<PaidOrder,"id">>){
 const entries=Object.entries(updates).flatMap(([name,value])=>[name,value]);
 if(entries.length)await redis(["EVAL","if redis.call('EXISTS',KEYS[1]) == 0 then return 0 end;redis.call('HSET',KEYS[1],unpack(ARGV));return 1",1,orderKey(id),...entries]);
}
export async function limitAttempts(key:string,max:number,windowSeconds:number){
 if(!Number.isSafeInteger(max)||max<1||!Number.isSafeInteger(windowSeconds)||windowSeconds<1)throw new Error("INVALID_RATE_POLICY");
 const number=Number(await redis(["EVAL",
  "local n=redis.call('INCR',KEYS[1]);if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end;return n",
  1,"lovora:payment:rate:"+key,windowSeconds]));
 return Number.isFinite(number)&&number<=max;
}
export async function lockFulfillment(orderId:string):Promise<string|null>{
 const token=randomBytes(16).toString("hex");
 const result=await redis(["SET",orderKey(orderId)+":lock",token,"EX",120,"NX"]);
 return result==="OK"?token:null;
}
export async function unlockFulfillment(orderId:string,token:string){
 await redis(["EVAL","if redis.call('get',KEYS[1]) == ARGV[1] then return redis.call('del',KEYS[1]) else return 0 end",1,orderKey(orderId)+":lock",token]);
}
function snapshotKey(){
 const secret=process.env.REPORT_ENCRYPTION_SECRET||process.env.BIRTH_SESSION_SECRET;
 if(!secret||secret.length<32)throw new Error("REPORT_SECRET_MISSING");
 return createHash("sha256").update("lovora-checkout:"+secret).digest();
}
export function encodeDraft(draft:JourneyDraft){
 const iv=randomBytes(12),cipher=createCipheriv("aes-256-gcm",snapshotKey(),iv);
 const data=Buffer.concat([cipher.update(JSON.stringify(draft),"utf8"),cipher.final()]);
 return [iv,cipher.getAuthTag(),data].map(x=>x.toString("base64url")).join(".");
}
export function decodeDraft(payload:string):JourneyDraft {
 const pieces=payload.split(".");
 if(pieces.length!==3)throw new Error("INVALID_ORDER_DATA");
 const [iv,tag,data]=pieces.map(x=>Buffer.from(x,"base64url"));
 if(iv.length!==12||tag.length!==16)throw new Error("INVALID_ORDER_DATA");
 const dec=createDecipheriv("aes-256-gcm",snapshotKey(),iv);dec.setAuthTag(tag);
 const draft=JSON.parse(Buffer.concat([dec.update(data),dec.final()]).toString("utf8")) as JourneyDraft;
 if(!draft.relationship||!draft.timeKnown||!draft.birthTime||!draft.place?.timezone)throw new Error("INVALID_ORDER_DATA");
 return draft;
}

/** All entitlement state transitions are atomic across webhook/return/refund workers. */
export async function markVerifiedPaid(id:string,paymentId:string):Promise<boolean>{
 const lua="local s=redis.call('HGET',KEYS[1],'status');if not s or s=='revoked' then return 0 end;local p=redis.call('HGET',KEYS[1],'paymentId') or '';if p~='' and p~=ARGV[1] then return 0 end;if s=='ready' then return 1 end;redis.call('HSET',KEYS[1],'status','paid','paymentId',ARGV[1]);return 1";
 return Number(await redis(["EVAL",lua,1,orderKey(id),paymentId]))===1;
}
export async function markReadyIfPaid(id:string,paymentId:string,reportId:string):Promise<boolean>{
 const lua="if redis.call('HGET',KEYS[1],'status')~='paid' or redis.call('HGET',KEYS[1],'paymentId')~=ARGV[1] then return 0 end;redis.call('HSET',KEYS[1],'status','ready','reportId',ARGV[2],'encryptedDraft','');return 1";
 return Number(await redis(["EVAL",lua,1,orderKey(id),paymentId,reportId]))===1;
}
export async function revokeMatchingPayment(id:string,paymentId:string):Promise<boolean>{
 const lua="local s=redis.call('HGET',KEYS[1],'status');local p=redis.call('HGET',KEYS[1],'paymentId') or '';if not s or (p~='' and p~=ARGV[1]) then return 0 end;redis.call('HSET',KEYS[1],'status','revoked','paymentId',ARGV[1],'encryptedDraft','');return 1";
 return Number(await redis(["EVAL",lua,1,orderKey(id),paymentId]))===1;
}
export async function failPendingOrder(id:string):Promise<void>{
 const lua="if redis.call('HGET',KEYS[1],'status')=='pending' then redis.call('HSET',KEYS[1],'status','failed') end;return 1";
 await redis(["EVAL",lua,1,orderKey(id)]);
}

/** Called only under the per-order fulfillment lock to bound provider retries. */
export async function recordGenerationAttempt(id:string,now:number):Promise<void>{
 const lua="if redis.call('HGET',KEYS[1],'status')~='paid' then return 0 end;redis.call('HINCRBY',KEYS[1],'generationAttempts',1);redis.call('HSET',KEYS[1],'lastAttemptAt',ARGV[1]);return 1";
 const result=await redis(["EVAL",lua,1,orderKey(id),now]);
 if(Number(result)!==1)throw new Error("PAID_ORDER_NOT_READY");
}
