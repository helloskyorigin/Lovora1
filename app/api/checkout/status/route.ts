import {NextRequest,NextResponse} from "next/server";
import {CHECKOUT_COOKIE,parseCheckoutOrder} from "@/lib/payments/checkout-cookie";
import {readOrder} from "@/lib/payments/order-store";
import {fulfillPaidOrder} from "@/lib/payments/fulfill";
import {generationRetryState} from "@/lib/payments/retry-policy";
import {indexPurchasedReport} from "@/lib/recovery/store";
import {REPORT_COOKIE,sealAccess,ACCESS_TTL} from "@/lib/report/access";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=60;
const headers={"Cache-Control":"private, no-store"};

export async function POST(request:NextRequest){
 const origin=request.headers.get("origin");
 if(origin&&origin!==new URL(request.url).origin)return NextResponse.json({ok:false,error:"Invalid origin."},{status:403,headers});
 const id=parseCheckoutOrder(request.cookies.get(CHECKOUT_COOKIE)?.value);
 let requested:string|null=null;
 try {const raw=await request.json() as {orderId?:unknown};requested=typeof raw.orderId==="string"?raw.orderId:null;}catch{}
 if(!id || id!==requested)return NextResponse.json({ok:false,error:"This checkout belongs to a different browser session."},{status:401,headers});
 try{
  let order=await readOrder(id);
  if(!order)return NextResponse.json({ok:false,error:"Order not found or expired."},{status:404,headers});
  if(order.status==="paid"){
   try{await fulfillPaidOrder(id);}catch(error){
    console.error("LOVORA fulfillment requires retry",error instanceof Error?error.message:"unknown");
   }
   order=await readOrder(id);
   if(!order)return NextResponse.json({ok:false,error:"Order not found."},{status:404,headers});
  }
  const status=order.status;
  const publicStatus=status==="paid"
   ?generationRetryState(order.generationAttempts||0,order.lastAttemptAt||0)==="needs_support"?"needs_support":"generating"
   :status;
  const response=NextResponse.json({ok:true,status:publicStatus,ready:status==="ready"}, {headers});
  if(status==="ready"&&order.reportId&&order.paymentId){
   // Repair missing recovery indexing after transient email-index storage errors.
   try{await indexPurchasedReport(order);}catch(error){
    console.error("LOVORA recovery index needs retry",error instanceof Error?error.message:"unknown");
   }
   response.cookies.set(REPORT_COOKIE,sealAccess({reportId:order.reportId,orderId:order.id,isDev:false}),{
    httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:ACCESS_TTL
   });
  }
  return response;
 }catch{
  return NextResponse.json({ok:false,error:"Unable to check payment status. Please retry."},{status:503,headers});
 }
}
