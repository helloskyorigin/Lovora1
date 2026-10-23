import assert from "node:assert/strict";
import {test} from "node:test";
import {GLOBAL_PRICE,priceForCountry,trustedCountry,formatRegionalAmount,
 nativeCurrencyForCountry,priceFromDodoPreview} from "../lib/pricing";
import {assertProduct,assertIndiaLocalizedPrice,validPayment,PRICE_PAISE,USD_PRICE_CENTS} from "../lib/payments/validation";

test("No invented converted amounts; India fixed and unknown uses USD fallback",()=>{
 for(const country of ["IN","US","GB","FR","DE","AU","CA","JP",null]){
  const q=priceForCountry(country);
  assert.equal(q.label,country==="IN"?"₹149":"$5");
 }
 assert.deepEqual(priceForCountry(null),GLOBAL_PRICE);
 assert.equal(formatRegionalAmount(14900,"INR"),"₹149");
 assert.equal(formatRegionalAmount(500,"USD"),"$5");
 assert.equal(formatRegionalAmount(375,"GBP"),"£3.75");
 assert.equal(formatRegionalAmount(461,"EUR"),"€4.61");
 assert.equal(nativeCurrencyForCountry("GB"),"GBP");
 assert.equal(nativeCurrencyForCountry("FR"),"EUR");
 assert.equal(nativeCurrencyForCountry("AU"),"AUD");
 assert.equal(nativeCurrencyForCountry("CA"),"CAD");
 assert.equal(nativeCurrencyForCountry("ZZ"),null);
});
test("Server trusted geo headers only; no user price spoofing",()=>{
 const h=new Headers({"x-vercel-ip-country":"IN","cf-ipcountry":"IN","x-country":"IN"});
 assert.equal(trustedCountry(h,"none"),null);
 assert.equal(trustedCountry(h,"vercel"),"IN");
 assert.equal(trustedCountry(h,"cloudflare"),"IN");
 assert.equal(trustedCountry(new Headers({"x-vercel-ip-country":"IN,US"}),"vercel"),null);
});
test("Dodo authoritative preview: only its returned actual currency and total",()=>{
 for(const [country,currency,amount,label] of [
  ["GB","GBP",395,"£3.95"],["FR","EUR",460,"€4.60"],
  ["AU","AUD",780,"A$7.80"],["CA","CAD",690,"CA$6.90"],
 ] as const){
  const q=priceFromDodoPreview(country,{billing_country:country,currency,current_breakup:{total_amount:amount}});
  assert.equal(q?.label,label);
  assert.equal(q?.source,"dodo-preview");
 }
 assert.equal(priceFromDodoPreview("IN",{billing_country:"IN",currency:"USD",current_breakup:{total_amount:500}})?.label,"₹149");
 assert.equal(priceFromDodoPreview("GB",{billing_country:"FR",currency:"GBP",current_breakup:{total_amount:400}}),null);
 assert.equal(priceFromDodoPreview("GB",{billing_country:"GB",currency:"INR",current_breakup:{total_amount:14900}}),null);
 assert.equal(priceFromDodoPreview("GB",{billing_country:"GB",currency:"GBP",current_breakup:{total_amount:-1}}),null);
 assert.equal(priceFromDodoPreview("GB",{}),null);
});
const item="pdt_Example99";
const product={product_id:item,is_recurring:false,pricing_mode:"by_country",price:{type:"one_time_price",currency:"USD",price:USD_PRICE_CENTS,tax_inclusive:true}};
test("Existing USD 5 Dodo product with INR 149 override",()=>{
 assert.doesNotThrow(()=>assertProduct(product,item));
 assert.doesNotThrow(()=>assertIndiaLocalizedPrice({items:[{country_code:"IN",currency:"INR",amount:PRICE_PAISE}]}));
 assert.throws(()=>assertProduct({...product,price:{...product.price,price:499}},item));
 assert.throws(()=>assertIndiaLocalizedPrice({items:[{country_code:"IN",currency:"INR",amount:29900}]}));
});
function payment(country:string,currency:string,amount:number){
 return {status:"succeeded",currency,total_amount:amount,billing:{country},payment_id:"pay_XYZ",
  metadata:{lovora_order_id:"order_1"},checkout_session_id:"cks_XYZ",product_cart:[{product_id:item,quantity:1}],customer:{email:"test@example.com"}};
}
const order={id:"order_1",sessionId:"cks_XYZ",email:"test@example.com",pricePaise:500,currency:"USD",productId:item};
test("Webhook uses Dodo final converted currency, not stale IP quote",()=>{
 const verify=(c:string,cy:string,a:number)=>validPayment(payment(c,cy,a),order,item,item);
 assert.equal(verify("IN","INR",14900),true);
 assert.equal(verify("US","USD",500),true);
 assert.equal(verify("GB","GBP",395),true);
 assert.equal(verify("FR","EUR",460),true);
 assert.equal(verify("AU","AUD",780),true);
 assert.equal(verify("CA","CAD",690),true);
 assert.equal(verify("GB","USD",500),true); // user switched to base in Dodo
 assert.equal(verify("IN","USD",500),false);
 assert.equal(verify("US","INR",14900),false);
 assert.equal(verify("IN","INR",29900),false);
 assert.equal(verify("GB","GBP",0),false);
 assert.equal(validPayment({...payment("IN","INR",14900),status:"failed"},order,item,item),false);
 assert.equal(validPayment({...payment("IN","INR",14900),status:"cancelled"},order,item,item),false);
 assert.equal(validPayment({...payment("GB","GBP",395),discount_id:"dsc_illegal"},order,item,item),false);
 assert.equal(validPayment({...payment("GB","GBP",395),checkout_session_id:"cks_other"},order,item,item),false);
 const legacy={...order,pricePaise:29900,productId:"pdt_Legacy"};
 assert.equal(validPayment({...payment("IN","INR",29900),product_cart:[{product_id:"pdt_Legacy",quantity:1}]},legacy,"pdt_Legacy",item),true);
});
