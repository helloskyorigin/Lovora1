/** Authoritative advertised prices; country must come from a trusted deployment edge. */
export type RegionalPrice = Readonly<{country:string|null;currency:"INR"|"USD";amount:number;label:string}>;
export const GLOBAL_PRICE:RegionalPrice={country:null,currency:"USD",amount:500,label:"$5"};
export function priceForCountry(country:string|null):RegionalPrice {
 const code=/^[A-Z]{2}$/.test(country||"")?country:null;
 return code==="IN"
  ?{country:"IN",currency:"INR",amount:14900,label:"₹149"}
  :{...GLOBAL_PRICE,country:code};
}
export function trustedCountry(headers:Pick<Headers,"get">,platform:"vercel"|"cloudflare"|"none"):string|null {
 // Do NOT trust geo headers at an arbitrary origin or in self-hosted preview.
 const field=platform==="vercel"?"x-vercel-ip-country":platform==="cloudflare"?"cf-ipcountry":null;
 const code=field?headers.get(field):null;
 return code&&/^[A-Z]{2}$/.test(code)?code:null;
}
export function hostPlatform(): "vercel"|"cloudflare"|"none"{
 if(process.env.VERCEL==="1")return "vercel";
 if(process.env.CF_PAGES==="1")return "cloudflare";
 return "none";
}
export function priceForRequest(headers:Pick<Headers,"get">):RegionalPrice{
 return priceForCountry(trustedCountry(headers,hostPlatform()));
}
export function formatRegionalAmount(amount:number,currency:string):string {
 if(currency==="INR")return "₹"+(amount/100).toLocaleString("en-IN",{maximumFractionDigits:2});
 if(currency==="USD")return "$"+(amount/100).toLocaleString("en-US",{minimumFractionDigits:amount%100===0?0:2,maximumFractionDigits:2});
 return currency+" "+(amount/100).toFixed(2);
}
