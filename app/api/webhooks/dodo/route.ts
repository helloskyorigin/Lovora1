import {NextRequest,NextResponse} from "next/server";
import {Webhook} from "standardwebhooks";
import {dodoGet,getDodoProductId,validPayment,type DodoPayment} from "@/lib/payments/dodo";
import {readOrder,markVerifiedPaid,revokeMatchingPayment,failPendingOrder} from "@/lib/payments/order-store";
import {fulfillPaidOrder} from "@/lib/payments/fulfill";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=60;

// Webhook replay protection: signed by Dodo, then each success payment is
// re-fetched from Dodo. Order+session+amount+currency+email+product must match.
export async function POST(request:NextRequest){
 const signingSecret=process.env.DODO_PAYMENTS_WEBHOOK_KEY;
 if(!signingSecret)return new Response("Webhook not configured",{status:503});
 const length=Number(request.headers.get("content-length")||0);
 if(length>65536)return new Response("Payload too large",{status:413});
 const raw=await request.text();
 if(raw.length>65536)return new Response("Payload too large",{status:413});
 const signatureHeaders={
  "webhook-id":request.headers.get("webhook-id")||"",
  "webhook-signature":request.headers.get("webhook-signature")||"",
  "webhook-timestamp":request.headers.get("webhook-timestamp")||"",
 };
 if(Object.values(signatureHeaders).some(x=>!x))return new Response("Missing signature headers",{status:400});
 try{new Webhook(signingSecret).verify(raw,signatureHeaders);}catch{return new Response("Invalid signature",{status:400});}
 let event:unknown;
 try{event=JSON.parse(raw);}catch{return new Response("Invalid payload",{status:400});}
 if(!event||typeof event!=="object"||Array.isArray(event))return new Response("Invalid payload",{status:400});
 const payload=event as {type?:unknown;data?:{payment_id?:unknown}};
 const type=payload.type;
 if(!["payment.succeeded","payment.failed","payment.cancelled","payment.processing","refund.succeeded","dispute.opened"].includes(String(type)))
  return NextResponse.json({ok:true,ignored:true});
 const paymentId=payload.data?.payment_id;
 if(typeof paymentId!=="string"||!/^pay_[A-Za-z0-9]+$/.test(paymentId))return NextResponse.json({ok:true,ignored:true});
 try{
  const payment=await dodoGet<DodoPayment>("/payments/"+encodeURIComponent(paymentId));
  const orderId=payment.metadata?.lovora_order_id;
  if(!orderId||!/^[a-f0-9-]{36}$/.test(orderId))return NextResponse.json({ok:true,ignored:true});
  const order=await readOrder(orderId);
  if(!order)return NextResponse.json({ok:true,ignored:true});
  // An unusually fast webhook may arrive before the checkout session ID is persisted.
  // A retryable response prevents silently losing a legitimate paid purchase.
  if(!order.sessionId)return new Response("Checkout session pending; retry event",{status:503});
  if(payment.checkout_session_id!==order.sessionId)return NextResponse.json({ok:true,ignored:true});
  if(type==="payment.succeeded"){
   if(!validPayment(payment,order,getDodoProductId()))return new Response("Payment validation failed",{status:422});
   if(payment.payment_id!==paymentId)return new Response("Mismatched payment identity",{status:422});
   if(!await markVerifiedPaid(orderId,paymentId))return NextResponse.json({ok:true,revoked:true});
   try{
    await fulfillPaidOrder(orderId);
   }catch(err){
    console.error("LOVORA paid fulfillment retry required",err instanceof Error?err.message:"unknown");
    return new Response("Fulfillment retry required",{status:503});
   }
  }
  if(type==="payment.failed"||type==="payment.cancelled"){
   await failPendingOrder(orderId);
  }
  if(type==="refund.succeeded"||type==="dispute.opened"){
   await revokeMatchingPayment(orderId,paymentId);
  }
  return NextResponse.json({ok:true});
 }catch(err){
  console.error("Dodo webhook processing retry:",err instanceof Error?err.message:"unknown");
  return new Response("Webhook processing unavailable",{status:503});
 }
}
