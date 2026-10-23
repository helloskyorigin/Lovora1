import {nativeCurrencyForCountry} from "../pricing";

export const PRICE_PAISE = 14900; // India localized INR
export const USD_PRICE_CENTS = 500; // Global base USD
export const ORIGINAL_PRICE_PAISE = 29900; // Existing legacy orders
export const CURRENCY = "INR";
export type DodoPayment = {
 payment_id?: string; checkout_session_id?: string; status?: string; currency?: string;
 total_amount?: number; metadata?: Record<string,string>;
 product_cart?: {product_id:string;quantity:number}[];
 customer?: {email?:string}; refund_status?:string;
 billing?: {country?:string};
 settlement_amount?:number;settlement_currency?:string;
 discount_id?:string|null;
};
export type DodoProduct = { product_id?:string; is_recurring?:boolean;pricing_mode?:string;
 price?:{type?:string;currency?:string;price?:number;pay_what_you_want?:boolean;tax_inclusive?:boolean} };
export type LocalizedPricesResponse = {items?:Array<{country_code?:string|null;currency?:string;amount?:number}>};
export function assertProduct(product:DodoProduct,id:string):void {
 if(product.product_id!==id||product.is_recurring!==false||product.price?.type!=="one_time_price"||
  product.price?.currency!=="USD"||product.price.price!==USD_PRICE_CENTS||
  product.price.pay_what_you_want===true||product.price.tax_inclusive!==true||product.pricing_mode!=="by_country")
  throw new Error("DODO_PRODUCT_PRICE_MISMATCH");
}
export function assertIndiaLocalizedPrice(rules:LocalizedPricesResponse):void {
 if(!Array.isArray(rules.items)||!rules.items.some(x=>x.country_code==="IN"&&x.currency==="INR"&&x.amount===PRICE_PAISE))
  throw new Error("DODO_INDIA_LOCALIZED_PRICE_MISSING");
}
/** Verify the provider's final billing country, customer-facing currency and amount.
 * This is independent of the visitor's initial IP quote: billing country can change at checkout. */
export function validPayment(payment:DodoPayment,order:{
 id:string;sessionId:string;email:string;paymentId?:string;pricePaise?:number;currency?:string;
},product:string,regionalProductId?:string):boolean {
 const country=payment.billing?.country;
 const regional=product===regionalProductId;
 const regionalAllowed=country==="IN"
   ? payment.currency==="INR"&&payment.total_amount===PRICE_PAISE
   : typeof country==="string"&&/^[A-Z]{2}$/.test(country)&&
     typeof payment.currency==="string"&&/^[A-Z]{3}$/.test(payment.currency)&&
     (country==="US"?payment.currency==="USD"&&payment.total_amount===USD_PRICE_CENTS:
       (!nativeCurrencyForCountry(country)||[nativeCurrencyForCountry(country),"USD"].includes(payment.currency))&&
       typeof payment.total_amount==="number"&&Number.isSafeInteger(payment.total_amount)&&
       payment.total_amount>0&&payment.total_amount<=1_000_000);
 // For international FX there is no trustworthy static exchange rate. The value is
 // Dodo's server-retrieved, succeeded payment, for the sole verified product in
 // the checkout. We deliberately do not compare an old on-site FX preview.
 const correctAmount=regional?regionalAllowed:
  payment.currency===(order.currency||"INR")&&payment.total_amount===(order.pricePaise??ORIGINAL_PRICE_PAISE);
 return !!correctAmount&&payment.status==="succeeded"&&payment.discount_id==null&&
  payment.metadata?.lovora_order_id===order.id&&payment.checkout_session_id===order.sessionId&&
  Array.isArray(payment.product_cart)&&payment.product_cart.length===1&&
  payment.product_cart[0].product_id===product&&payment.product_cart[0].quantity===1&&
  !!payment.payment_id&&(!order.paymentId||order.paymentId===payment.payment_id)&&
  typeof payment.customer?.email==="string"&&payment.customer.email.trim().toLowerCase()===order.email.trim().toLowerCase()&&
  (!payment.refund_status||payment.refund_status==="none");
}
