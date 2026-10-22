import {createHash} from "node:crypto";
import {NextRequest,NextResponse} from "next/server";
import {normalizeEmail,emailIndexKey,recoveryLink} from "@/lib/recovery/token";
import {newestRecoverableOrder,issueOneTimeToken,revokeOneTimeToken} from "@/lib/recovery/store";
import {limitAttempts} from "@/lib/payments/order-store";
import {sendRecoveryEmail} from "@/lib/recovery/email";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"no-store"};
const generic="If a recoverable paid report exists for this email, we'll send a one-time link.";
export async function POST(req:NextRequest){
 const origin=req.headers.get("origin");
 if(origin&&origin!==new URL(req.url).origin)return NextResponse.json({ok:false,error:"Invalid request origin."},{status:403,headers});
 if(!req.headers.get("content-type")?.includes("application/json"))return NextResponse.json({ok:false,error:"Expected JSON."},{status:415,headers});
 let email:string|null=null;
 try{
  const body=await req.text();
  if(body.length>512)throw new Error("Invalid");
  email=normalizeEmail((JSON.parse(body) as {email?:unknown}).email);
 }catch{return NextResponse.json({ok:true,message:generic},{headers});}
 if(!email)return NextResponse.json({ok:true,message:generic},{headers});
 try{
  const ip=req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"anonymous";
  const ipHash=createHash("sha256").update(ip).digest("hex").slice(0,36);
  // Keep the response generic for existent and nonexistent email addresses.
  const allowedIp=await limitAttempts("recovery-ip:"+ipHash,10,3600);
  const allowedEmail=await limitAttempts("recovery-email:"+emailIndexKey(email).slice(-40),2,1800);
  if(!allowedIp||!allowedEmail)return NextResponse.json({ok:true,message:generic},{headers});
  const order=await newestRecoverableOrder(email);
  if(order){
   const token=await issueOneTimeToken(order.id);
   try{
    await sendRecoveryEmail(email,recoveryLink(token),createHash("sha256").update(token).digest("hex").slice(0,32));
   }catch(err){
    await revokeOneTimeToken(token).catch(()=>undefined);
    console.error("LOVORA recovery mail unavailable:",err instanceof Error?err.message:"Unknown error");
   }
  }
 }catch(err){
  console.error("LOVORA recovery lookup unavailable:",err instanceof Error?err.message:"Unknown error");
 }
 return NextResponse.json({ok:true,message:generic},{headers});
}
