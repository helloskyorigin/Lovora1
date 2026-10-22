import {NextResponse} from "next/server";
import {getLaunchOfferStatus} from "@/lib/payments/offer-store";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
 try{
  const status=await getLaunchOfferStatus();
  return NextResponse.json({ok:true,...status},{headers:{"Cache-Control":"public, s-maxage=20, stale-while-revalidate=40"}});
 }catch{
  return NextResponse.json({ok:false,error:"Live offer progress unavailable."},{status:503,headers:{"Cache-Control":"no-store"}});
 }
}
