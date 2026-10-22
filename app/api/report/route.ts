import {NextRequest,NextResponse} from "next/server";
import {REPORT_COOKIE,verifyAccess} from "@/lib/report/access";
import {getReport} from "@/lib/report/store";
import {readOrder} from "@/lib/payments/order-store";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 const headers={"Cache-Control":"private, no-store"};
 const access=verifyAccess(request.cookies.get(REPORT_COOKIE)?.value);
 if(!access)return NextResponse.json({ok:false,error:"Verified report access is required."},{status:403,headers});
 try{
  if(!access.isDev){
   const order=await readOrder(access.orderId);
   if(!order||order.status!=="ready"||!order.paymentId||order.reportId!==access.reportId){
    return NextResponse.json({ok:false,error:"Report access has expired or been revoked."},{status:403,headers});
   }
  }
  const report=await getReport(access.reportId);
  if(!report)return NextResponse.json({ok:false,error:"Report not found. Contact support using your payment email."},{status:404,headers});
  return NextResponse.json({ok:true,report},{headers});
 }catch{
  return NextResponse.json({ok:false,error:"Report service temporarily unavailable."},{status:503,headers});
 }
}
