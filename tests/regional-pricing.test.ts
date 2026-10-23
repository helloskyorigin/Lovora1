import assert from "node:assert/strict";
import {test} from "node:test";
import {GLOBAL_PRICE,priceForCountry,trustedCountry,formatRegionalAmount} from "../lib/pricing";
import {assertProduct,assertIndiaLocalizedPrice,validPayment,PRICE_PAISE,USD_PRICE_CENTS} from "../lib/payments/validation";

test("Geo: India INR, all other markets and unknown default USD",()=>{
 for(const [country,currency,amount] of [["IN","INR",14900],["US","USD",500],["GB","USD",500],["FR","USD",500],["AU","USD",500],[null,"USD",500]] as const){
  const q=priceForCountry(country);
  assert.equal(q.currency,currency);
  assert.equal(q.amount,amount);
 }
 assert.deepEqual(priceForCountry(null),GLOBAL_PRICE);
 assert.equal(formatRegionalAmount(14900,"INR"),"₹149");
 assert.equal(formatRegionalAmount(500,"USD"),"$5");
});
test("No spoofable country from untrusted headers",()=>{
 const h=new Headers({"x-vercel-ip-country":"IN","cf-ipcountry":"IN","x-country":"IN"});
 assert.equal(trustedCountry(h,"none"),null);
 assert.equal(trustedCountry(h,"vercel"),"IN");
 assert.equal(trustedCountry(h,"cloudflare"),"IN");
 assert.equal(trustedCountry(new Headers({"x-vercel-ip-country":"IN,US"}),"vercel"),null);
});
const item="pdt_Example99";
const product={product_id:item,is_recurring:false,pricing_mode:"by_country",price:{type:"one_time_price",currency:"USD",price:USD_PRICE_CENTS,tax_inclusive:true}};
test("Dodo product must have $5 USD base and fixed INR 149",()=>{
 assert.doesNotThrow(()=>assertProduct(product,item));
 assert.doesNotThrow(()=>assertIndiaLocalizedPrice({items:[{country_code:"IN",currency:"INR",amount:PRICE_PAISE}]}));
 assert.throws(()=>assertProduct({...product,price:{...product.price,price:499}},item));
 assert.throws(()=>assertIndiaLocalizedPrice({items:[{country_code:"IN",currency:"INR",amount:29900}]}));
});
function payment(country:string,currency:string,amount:number){
 return {status:"succeeded",currency,total_amount:amount,billing:{country},payment_id:"pay_XYZ",
  metadata:{lovora_order_id:"order_1"},checkout_session_id:"cks_XYZ",product_cart:[{product_id:item,quantity:1}],customer:{email:"test@example.com"}};
}
const order={id:"order_1",sessionId:"cks_XYZ",email:"test@example.com",pricePaise:14900,currency:"INR",productId:item};
test("Provider verified billing country wins; detect currency mismatch and spoofed amounts",()=>{
 const verify=(c:string,cy:string,a:number)=>validPayment(payment(c,cy,a),order,item,item);
 assert.equal(verify("IN","INR",14900),true);
 assert.equal(verify("US","USD",500),true); // checkout country changed: verified amount/currency is final
 assert.equal(verify("GB","USD",500),true);
 assert.equal(verify("FR","USD",500),true);
 assert.equal(verify("IN","USD",500),false);
 assert.equal(verify("US","INR",14900),false);
 assert.equal(verify("GB","GBP",500),false);
 assert.equal(verify("IN","INR",29900),false);
 assert.equal(validPayment({...payment("IN","INR",14900),status:"failed"},order,item,item),false);
 assert.equal(validPayment({...payment("IN","INR",14900),checkout_session_id:"cks_other"},order,item,item),false);
 const legacy={...order,pricePaise:29900,productId:"pdt_Legacy"};
 assert.equal(validPayment({...payment("IN","INR",29900),product_cart:[{product_id:"pdt_Legacy",quantity:1}]},legacy,"pdt_Legacy",item),true);
});
