/** LOVORA regional pricing, computed on the server only. No made-up FX rates. */
export type RegionalPrice = Readonly<{
 country:string|null;
 currency:string;
 amount:number; // smallest currency unit
 label:string;
 source:"fixed"|"dodo-preview"|"usd-base";
 notice:string;
}>;
export const GLOBAL_PRICE:RegionalPrice={
 country:null,currency:"USD",amount:500,label:"$5",source:"usd-base",
 notice:"Final local-currency amount is shown at Dodo checkout."
};
const INDIAN_PRICE:RegionalPrice={
 country:"IN",currency:"INR",amount:14900,label:"₹149",source:"fixed",
 notice:"Final billing country and total are confirmed at Dodo checkout."
};
const EUROZONE=new Set(["AT","BE","HR","CY","EE","FI","FR","DE","GR","IE","IT","LV","LT","LU","MT","NL","PT","SK","SI","ES","AD","MC","SM","ME"]);
const LOCAL_CURRENCIES:Record<string,string>={GB:"GBP",AU:"AUD",CA:"CAD",JP:"JPY",NZ:"NZD",CH:"CHF",SE:"SEK",NO:"NOK",DK:"DKK",SG:"SGD",AE:"AED",BR:"BRL",MX:"MXN",ZA:"ZAR",IN:"INR",US:"USD"};
export function nativeCurrencyForCountry(country:string|null):string|null{
 if(!country||!/^[A-Z]{2}$/.test(country))return null;
 return EUROZONE.has(country)?"EUR":LOCAL_CURRENCIES[country]||null;
}
export function minorUnits(currency:string):number{
 const f=new Intl.NumberFormat("en-US",{style:"currency",currency});
 return f.resolvedOptions().maximumFractionDigits;
}
export function formatRegionalAmount(amount:number,currency:string):string{
 if(!Number.isSafeInteger(amount)||amount<0||!/^[A-Z]{3}$/.test(currency))throw Error("INVALID_CURRENCY_AMOUNT");
 const units=minorUnits(currency);
 if(currency==="INR"&&amount===14900)return "₹149";
 if(currency==="USD"&&amount===500)return "$5";
 return new Intl.NumberFormat("en-US",{style:"currency",currency,currencyDisplay:"symbol",
  minimumFractionDigits:units,maximumFractionDigits:units}).format(amount/(10**units));
}
export function priceForCountry(country:string|null):RegionalPrice{
 const code=/^[A-Z]{2}$/.test(country||"")?country:null;
 return code==="IN"?INDIAN_PRICE:{...GLOBAL_PRICE,country:code};
}
export function priceFromDodoPreview(country:string,preview:unknown):RegionalPrice|null{
 if(country==="IN")return priceForCountry("IN");
 if(!preview||typeof preview!=="object")return null;
 const data=preview as Record<string,unknown>;
 if(data.billing_country!==country||typeof data.currency!=="string"||!/^[A-Z]{3}$/.test(data.currency))return null;
 const breakup=data.current_breakup;
 if(!breakup||typeof breakup!=="object")return null;
 const amount=(breakup as Record<string,unknown>).total_amount;
 if(typeof amount!=="number"||!Number.isSafeInteger(amount)||amount<1||amount>1_000_000)return null;
 // For known markets, Dodo may offer the native currency or the USD base.
 const currency=nativeCurrencyForCountry(country);
 if(currency&&data.currency!==currency&&data.currency!=="USD")return null;
 try{
  return {country,currency:data.currency,amount,label:formatRegionalAmount(amount,data.currency),
   source:"dodo-preview",notice:"Dodo price preview. Final amount may change if the billing country or currency changes at checkout."};
 }catch{return null;}
}
export function trustedCountry(headers:Pick<Headers,"get">,platform:"vercel"|"cloudflare"|"none"):string|null{
 // Never trust a proxy-country header outside its own infrastructure.
 const field=platform==="vercel"?"x-vercel-ip-country":platform==="cloudflare"?"cf-ipcountry":null;
 const code=field?headers.get(field):null;
 return code&&/^[A-Z]{2}$/.test(code)?code:null;
}
export function hostPlatform():"vercel"|"cloudflare"|"none"{
 if(process.env.VERCEL==="1")return "vercel";
 if(process.env.CF_PAGES==="1")return "cloudflare";
 return "none";
}
export function priceForRequest(headers:Pick<Headers,"get">):RegionalPrice{
 return priceForCountry(trustedCountry(headers,hostPlatform()));
}
