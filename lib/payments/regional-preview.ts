import "server-only";
import {unstable_cache} from "next/cache";
import {dodoPost,getDodoProductId} from "./dodo";
import {priceForCountry,priceFromDodoPreview,type RegionalPrice} from "../pricing";

/** Dodo checkout preview: read-only. Country only comes from our trusted hosting edge.
 * Cache by country briefly to limit API usage. A missing/invalid quote falls back to USD.
 * Actual checkout is authoritative, especially after edits to billing country/currency. */
const previewCountry=unstable_cache(async(country:string):Promise<RegionalPrice>=>{
 const fallback=priceForCountry(country);
 if(country==="IN"||country==="US")return fallback;
 if(!process.env.DODO_PAYMENTS_API_KEY||!process.env.DODO_LOVORA_PRODUCT_ID||
    !["live_mode","test_mode"].includes(process.env.DODO_PAYMENTS_ENVIRONMENT||""))return fallback;
 try{
  const data=await dodoPost<unknown>("/checkouts/preview",{
   product_cart:[{product_id:getDodoProductId(),quantity:1}],
   billing_address:{country},
   minimal_address:true,
   feature_flags:{allow_discount_code:false}
  });
  return priceFromDodoPreview(country,data)||fallback;
 }catch{return fallback;}
},["lovora-regional-dodo-checkout-preview-v1"],{revalidate:300});

export async function regionalQuote(country:string|null):Promise<RegionalPrice>{
 if(!country)return priceForCountry(null);
 return previewCountry(country);
}
