import "server-only";
import { createCipheriv,createDecipheriv,createHash,randomBytes } from "node:crypto";

export const REPORT_COOKIE="lovora_premium";
export const ACCESS_TTL=60*60*24*180;
export type ReportAccess={reportId:string;orderId:string;isDev:boolean;exp:number};

function accessKey(){
  const secret=process.env.REPORT_ENCRYPTION_SECRET||process.env.BIRTH_SESSION_SECRET;
  if(!secret||secret.length<32)throw new Error("REPORT_SECRET_MISSING");
  return createHash("sha256").update("lovora report access:"+secret).digest();
}
export function sealAccess(input:Omit<ReportAccess,"exp">):string{
  const claims:ReportAccess={...input,exp:Date.now()+ACCESS_TTL*1000};
  const iv=randomBytes(12),cipher=createCipheriv("aes-256-gcm",accessKey(),iv);
  const encrypted=Buffer.concat([cipher.update(JSON.stringify(claims),"utf8"),cipher.final()]);
  return [iv,cipher.getAuthTag(),encrypted].map(x=>x.toString("base64url")).join(".");
}
export function verifyAccess(token:string|undefined):ReportAccess|null{
  if(!token||token.length>1500)return null;
  try{
    const parts=token.split(".");if(parts.length!==3)return null;
    const [iv,tag,encrypted]=parts.map(x=>Buffer.from(x,"base64url"));
    if(iv.length!==12||tag.length!==16)return null;
    const decipher=createDecipheriv("aes-256-gcm",accessKey(),iv);decipher.setAuthTag(tag);
    const payload=Buffer.concat([decipher.update(encrypted),decipher.final()]).toString("utf8");
    const claims=JSON.parse(payload) as ReportAccess;
    if(typeof claims.reportId!=="string"||typeof claims.orderId!=="string"||
       typeof claims.exp!=="number"||Date.now()>claims.exp||
       typeof claims.isDev!=="boolean")return null;
    // Development entitlements are never accepted on a production deployment.
    if(claims.isDev&&process.env.NODE_ENV==="production")return null;
    return claims;
  }catch{return null;}
}
