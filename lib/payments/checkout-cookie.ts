import "server-only";
import {createHash,createHmac,timingSafeEqual} from "node:crypto";
export const CHECKOUT_COOKIE="lovora_checkout_order";
function signingKey(){
 const secret=process.env.REPORT_ENCRYPTION_SECRET||process.env.BIRTH_SESSION_SECRET;
 if(!secret||secret.length<32)throw new Error("REPORT_SECRET_MISSING");
 return createHash("sha256").update("LOVORA checkout capability:"+secret).digest();
}
export function issueCheckoutOrder(id:string):string{
 return id+"."+createHmac("sha256",signingKey()).update(id).digest("base64url");
}
export function parseCheckoutOrder(value:string|undefined):string|null{
 if(!value||value.length>250)return null;
 const split=value.indexOf(".");if(split<=0)return null;
 const id=value.slice(0,split),sig=value.slice(split+1);
 if(!/^[a-f0-9-]{36}$/.test(id))return null;
 const actual=Buffer.from(sig);
 const expected=Buffer.from(createHmac("sha256",signingKey()).update(id).digest("base64url"));
 return actual.length===expected.length&&timingSafeEqual(actual,expected)?id:null;
}
