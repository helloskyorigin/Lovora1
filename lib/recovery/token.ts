import {createHash,createHmac,randomBytes} from "node:crypto";

export const RECOVERY_TTL_SECONDS=15*60;
export function normalizeEmail(value:unknown):string|null{
 if(typeof value!=="string")return null;
 const email=value.trim().toLowerCase();
 if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return null;
 return email;
}
function privateKey():string{
 const secret=process.env.REPORT_ENCRYPTION_SECRET||process.env.BIRTH_SESSION_SECRET;
 if(!secret||secret.length<32)throw new Error("REPORT_SECRET_MISSING");
 return secret;
}
export function emailIndexKey(email:string):string{
 const digest=createHmac("sha256",privateKey()).update(email).digest("hex");
 return "lovora:recover:email:"+digest;
}
export function createRecoveryToken():string{return randomBytes(32).toString("base64url");}
export function tokenKey(token:string):string|null{
 if(!/^[A-Za-z0-9_-]{43}$/.test(token))return null;
 return "lovora:recover:token:"+createHash("sha256").update(token).digest("hex");
}
export function recoveryLink(token:string):string{
 const base=process.env.LOVORA_BASE_URL||"";
 const url=new URL(base);
 if(url.username||url.password||url.search||url.hash||url.pathname!=="/")throw new Error("RECOVERY_ORIGIN_INVALID");
 if(url.protocol!=="https:"&&!(process.env.NODE_ENV!=="production"&&url.origin==="http://localhost:3000"))
  throw new Error("RECOVERY_ORIGIN_INVALID");
 return url.origin+"/recover/verify?token="+encodeURIComponent(token);
}
