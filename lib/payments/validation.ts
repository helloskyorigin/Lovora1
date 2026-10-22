export const PRICE_PAISE = 29900;
export const CURRENCY = "INR";
export type DodoPayment = {
 payment_id?: string; checkout_session_id?: string; status?: string; currency?: string;
 total_amount?: number; metadata?: Record<string,string>;
 product_cart?: {product_id:string;quantity:number}[];
 customer?: {email?:string}; refund_status?:string;
};
export type DodoProduct = { product_id?:string; is_recurring?:boolean;
 price?:{type?:string;currency?:string;price?:number;pay_what_you_want?:boolean;tax_inclusive?:boolean} };
export function assertProduct(product:DodoProduct,id:string):void {
 if(product.product_id!==id || product.is_recurring!==false || product.price?.type!=="one_time_price" ||
 product.price?.currency!=="INR" || product.price?.price!==PRICE_PAISE || product.price?.pay_what_you_want===true || product.price?.tax_inclusive!==true) {
  throw new Error("DODO_PRODUCT_PRICE_MISMATCH");
 }
}
export function validPayment(payment:DodoPayment, order:{id:string;sessionId:string;email:string;paymentId?:string},product:string):boolean {
 return payment.status==="succeeded" && payment.currency===CURRENCY && payment.total_amount===PRICE_PAISE &&
 payment.metadata?.lovora_order_id===order.id && payment.checkout_session_id===order.sessionId &&
 Array.isArray(payment.product_cart) && payment.product_cart.length===1 &&
 payment.product_cart[0].product_id===product && payment.product_cart[0].quantity===1 &&
 !!payment.payment_id && (!order.paymentId || order.paymentId===payment.payment_id) &&
 typeof payment.customer?.email==="string" && payment.customer.email.trim().toLowerCase()===order.email.trim().toLowerCase() &&
 (!payment.refund_status || payment.refund_status==="none");
}
