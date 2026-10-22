import "server-only";
export {PRICE_PAISE,CURRENCY,assertProduct,validPayment} from "./validation";
export type {DodoProduct,DodoPayment} from "./validation";
export function getDodoProductId():string {
 const id=process.env.DODO_LOVORA_PRODUCT_ID;
 if(!id || !/^pdt_[A-Za-z0-9]+$/.test(id)) throw new Error("DODO_PRODUCT_NOT_CONFIGURED");
 return id;
}
export function dodoBase():string {
 const mode=process.env.DODO_PAYMENTS_ENVIRONMENT;
 if(mode!=="test_mode" && mode!=="live_mode") throw new Error("DODO_MODE_NOT_CONFIGURED");
 return mode==="test_mode"?"https://test.dodopayments.com":"https://live.dodopayments.com";
}
export async function dodoGet<T>(route:string):Promise<T> {
 const key=process.env.DODO_PAYMENTS_API_KEY;
 if(!key) throw new Error("DODO_API_NOT_CONFIGURED");
 const response=await fetch(dodoBase()+route,{cache:"no-store",signal:AbortSignal.timeout(15000),headers:{"Authorization":"Bearer "+key}});
 if(!response.ok) throw new Error("DODO_PROVIDER_UNAVAILABLE");
 return await response.json() as T;
}
export async function dodoPost<T>(route:string,data:unknown):Promise<T>{
 const key=process.env.DODO_PAYMENTS_API_KEY;
 if(!key) throw new Error("DODO_API_NOT_CONFIGURED");
 const response=await fetch(dodoBase()+route,{method:"POST",cache:"no-store",signal:AbortSignal.timeout(15000),headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify(data)});
 if(!response.ok) throw new Error("DODO_PROVIDER_UNAVAILABLE");
 return await response.json() as T;
}
export function verifiedCheckoutURL(value:unknown):string {
 if(typeof value!=="string")throw new Error("DODO_CHECKOUT_MISSING");
 const url=new URL(value),host=process.env.DODO_PAYMENTS_ENVIRONMENT==="live_mode"?"checkout.dodopayments.com":"test.checkout.dodopayments.com";
 if(url.protocol!=="https:" || url.hostname!==host || !url.pathname.startsWith("/session/") || url.username || url.password)throw new Error("DODO_CHECKOUT_INVALID_URL");
 return url.toString();
}
