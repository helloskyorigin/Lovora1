import {createHash,randomUUID} from "node:crypto";
import {NextRequest,NextResponse} from "next/server";
import {BIRTH_COOKIE,readBirthDraft} from "@/lib/birth-session";
import type {JourneyDraft} from "@/lib/context";
import {dodoGet,dodoPost,assertProduct,getDodoProductId,verifiedCheckoutURL,type DodoProduct} from "@/lib/payments/dodo";
import {createOrder,encodeDraft,limitAttempts,patchOrder} from "@/lib/payments/order-store";
import {CHECKOUT_COOKIE,issueCheckoutOrder} from "@/lib/payments/checkout-cookie";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=30;
const headers={"Cache-Control":"no-store"};


function publicOrigin(request:NextRequest){
 const base=process.env.LOVORA_BASE_URL;
 if(!base)throw new Error("APP_ORIGIN_NOT_CONFIGURED");
 const url=new URL(base);
 if(url.username||url.password||url.pathname!=="/"||url.search||url.hash)throw new Error("APP_ORIGIN_INVALID");
 if(url.protocol!=="https:" && !(process.env.NODE_ENV!=="production"&&url.origin==="http://localhost:3000"))throw new Error("APP_ORIGIN_INVALID");
 if(new URL(request.url).origin!==url.origin)throw new Error("APP_ORIGIN_INVALID");
 return url.origin;
}
export async function POST(request:NextRequest){
 if(!process.env.LOVORA_SUPPORT_EMAIL||!process.env.LOVORA_OPERATOR_NAME)return NextResponse.json({ok:false,error:"Payment support and legal operator details are required before charging."},{status:503,headers});
 if(process.env.LOVORA_PAYMENTS_ENABLED!=="true")return NextResponse.json({ok:false,error:"Payments are not enabled yet. Merchant approval is required."},{status:503,headers});
 const origin=request.headers.get("origin");
 if(origin&&origin!==new URL(request.url).origin)return NextResponse.json({ok:false,error:"Invalid request origin."},{status:403,headers});
 if(!request.headers.get("content-type")?.includes("application/json"))return NextResponse.json({ok:false,error:"Expected JSON."},{status:415,headers});
 const draft=readBirthDraft(request.cookies.get(BIRTH_COOKIE)?.value) as JourneyDraft|null;
 if(!draft?.relationship||!draft.preview||!draft.birthTime||!draft.timeKnown)
  return NextResponse.json({ok:false,error:"Complete your free insight before checkout."},{status:401,headers});
 let raw:unknown;
 try{const body=await request.text();if(body.length>512)throw new Error("LONG");raw=JSON.parse(body);}catch{
  return NextResponse.json({ok:false,error:"Invalid checkout information."},{status:400,headers});
 }
 const obj=raw&&typeof raw==="object"&&!Array.isArray(raw)?raw as Record<string,unknown>:null;
 const email=typeof obj?.email==="string"?obj.email.trim().toLowerCase():"";
 if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  return NextResponse.json({ok:false,error:"Enter a valid receipt email."},{status:400,headers});
 try{
  const base=publicOrigin(request);
  const ip=request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"anonymous";
  const hash=createHash("sha256").update(ip).digest("hex").slice(0,30);
  if(!await limitAttempts("checkout:"+hash,6,3600))
   return NextResponse.json({ok:false,error:"Too many checkout attempts. Try later."},{status:429,headers});
  const productId=getDodoProductId();
  assertProduct(await dodoGet<DodoProduct>("/products/"+encodeURIComponent(productId)),productId);
  const orderId=randomUUID();
  await createOrder({id:orderId,email,sessionId:"",paymentId:"",status:"pending",reportId:"",
    encryptedDraft:encodeDraft(draft),createdAt:new Date().toISOString()});
  const session=await dodoPost<{session_id?:string;checkout_url?:string|null}>("/checkouts",{
    product_cart:[{product_id:productId,quantity:1}],
    customer:{email,name:draft.firstName||undefined},
    billing_currency:"INR",
    minimal_address:true,
    metadata:{lovora_order_id:orderId},
    return_url:base+"/checkout/return?order="+orderId
  });
  if(!session.session_id||!/^cks_[A-Za-z0-9]+$/.test(session.session_id))throw new Error("INVALID_DODO_SESSION");
  const url=verifiedCheckoutURL(session.checkout_url);
  await patchOrder(orderId,{sessionId:session.session_id});
  const response=NextResponse.json({ok:true,checkoutUrl:url},{headers});
  response.cookies.set(CHECKOUT_COOKIE,issueCheckoutOrder(orderId),{
   httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:60*60*24*30
  });
  return response;
 }catch(error){
  const code=error instanceof Error?error.message:"UNKNOWN";
  console.error("LOVORA checkout setup failed:",code);
  const message=code==="DODO_PRODUCT_PRICE_MISMATCH"
   ?"Merchant product must be configured as an exact ₹299 INR one-time purchase."
   :"Secure checkout is temporarily unavailable. Please retry after configuration.";
  return NextResponse.json({ok:false,error:message},{status:503,headers});
 }
}
