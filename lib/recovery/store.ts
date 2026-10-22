import "server-only";
import {redis,readOrder,type PaidOrder} from "@/lib/payments/order-store";
import {RECOVERY_TTL_SECONDS,emailIndexKey,tokenKey,createRecoveryToken} from "./token";

const INDEX_TTL=60*60*24*365;
// Index contains ONLY order IDs. The key is an HMAC of the normalized email.
export async function indexPurchasedReport(order:PaidOrder):Promise<void>{
 if(order.status!=="ready"||!order.reportId||!order.paymentId)return;
 const key=emailIndexKey(order.email);
 await redis(["SADD",key,order.id]);
 await redis(["EXPIRE",key,INDEX_TTL]);
 // Sorted index ensures a repeat buyer's most recent report is recoverable.
 // The legacy set is retained for purchases created before this upgrade.
 const score=Date.parse(order.createdAt);
 if(Number.isFinite(score)){
  await redis(["ZADD",key+":newest",score,order.id]);
  await redis(["EXPIRE",key+":newest",INDEX_TTL]);
 }
}
export async function newestRecoverableOrder(email:string):Promise<PaidOrder|null>{
 const key=emailIndexKey(email);
 const newest=await redis(["ZREVRANGE",key+":newest",0,29]);
 // Existing set-only orders still work without any destructive migration.
 const entries=Array.isArray(newest)&&newest.length?newest:await redis(["SMEMBERS",key]);
 if(!Array.isArray(entries))return null;
 const candidates:PaidOrder[]=[];
 for(const id of entries.slice(0,30)){
  if(typeof id!=="string")continue;
  const order=await readOrder(id);
  if(order&&order.email===email&&order.status==="ready"&&order.paymentId&&order.reportId)candidates.push(order);
 }
 candidates.sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt));
 return candidates[0]||null;
}
export async function issueOneTimeToken(orderId:string):Promise<string>{
 const token=createRecoveryToken(),key=tokenKey(token);
 if(!key)throw new Error("INVALID_RECOVERY_TOKEN");
 const result=await redis(["SET",key,orderId,"EX",RECOVERY_TTL_SECONDS,"NX"]);
 if(result!=="OK")throw new Error("TOKEN_STORE_FAILED");
 return token;
}
export async function revokeOneTimeToken(token:string):Promise<void>{
 const key=tokenKey(token);if(key)await redis(["DEL",key]);
}
export async function redeemOneTimeToken(token:string):Promise<PaidOrder|null>{
 const key=tokenKey(token);if(!key)return null;
 // GETDEL makes the token single-use, even across concurrent server instances.
 const id=await redis(["GETDEL",key]);
 if(typeof id!=="string")return null;
 const order=await readOrder(id);
 if(!order||order.status!=="ready"||!order.paymentId||!order.reportId)return null;
 return order;
}
