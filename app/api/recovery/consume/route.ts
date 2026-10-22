import {NextRequest,NextResponse} from "next/server";
import {redeemOneTimeToken} from "@/lib/recovery/store";
import {REPORT_COOKIE,ACCESS_TTL,sealAccess} from "@/lib/report/access";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"no-store"};
export async function POST(req:NextRequest){
 const origin=req.headers.get("origin");
 if(origin&&origin!==new URL(req.url).origin)return NextResponse.json({ok:false,error:"Invalid request origin."},{status:403,headers});
 if(!req.headers.get("content-type")?.includes("application/json"))return NextResponse.json({ok:false,error:"Expected JSON."},{status:415,headers});
 let token:unknown;
 try{
  const raw=await req.text();if(raw.length>400)throw new Error("Too large");
  token=(JSON.parse(raw) as {token?:unknown}).token;
 }catch{return NextResponse.json({ok:false,error:"Invalid recovery link."},{status:400,headers});}
 if(typeof token!=="string"||token.length!==43)return NextResponse.json({ok:false,error:"Invalid recovery link."},{status:400,headers});
 try{
  const order=await redeemOneTimeToken(token);
  if(!order)return NextResponse.json({ok:false,error:"This link expired, was already used, or the purchase is no longer eligible."},{status:410,headers});
  const response=NextResponse.json({ok:true,next:"/report"},{headers});
  response.cookies.set(REPORT_COOKIE,sealAccess({reportId:order.reportId,orderId:order.id,isDev:false}),{
   httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:ACCESS_TTL,
  });
  return response;
 }catch{
  return NextResponse.json({ok:false,error:"Could not verify this link. Please request another one."},{status:503,headers});
 }
}
