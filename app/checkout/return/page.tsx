"use client";
import {Suspense,useCallback,useEffect,useState} from "react";
import {useRouter,useSearchParams} from "next/navigation";
import Link from "next/link";
import "./return.css";
type State="checking"|"pending"|"paid"|"generating"|"ready"|"failed"|"revoked"|"needs_support"|"error";
function ReturnContent(){
 const params=useSearchParams(),router=useRouter();
 const order=params.get("order");
 const [status,setStatus]=useState<State>("checking");
 const [detail,setDetail]=useState("");
 const [attempt,setAttempt]=useState(0);
 const refresh=useCallback(async()=>{
  if(!order||!/^[a-f0-9-]{36}$/.test(order)){setStatus("error");setDetail("Invalid checkout return link.");return;}
  try{
   const response=await fetch("/api/checkout/status",{
    method:"POST",credentials:"same-origin",cache:"no-store",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({orderId:order})
   });
   const value=await response.json() as {ok?:boolean;status?:State;ready?:boolean;error?:string};
   if(!response.ok||!value.ok)throw new Error(value.error||"Unable to check payment.");
   if(value.ready){setStatus("ready");router.replace("/report");return;}
   setStatus(value.status==="paid"?"generating":value.status||"pending");
  }catch(e){setStatus("error");setDetail(e instanceof Error?e.message:"Unable to verify the payment.");}
 },[order,router]);
 useEffect(()=>{void refresh();},[refresh]);
 useEffect(()=>{
  if(status==="ready"||status==="failed"||status==="revoked"||status==="needs_support"||attempt>=24)return;
  const timer=window.setTimeout(()=>{setAttempt(n=>n+1);void refresh();},5000);
  return ()=>window.clearTimeout(timer);
 },[attempt,refresh,status]);
 const title=status==="ready"?"Your story is ready.":status==="failed"?"Payment did not complete.":
   status==="revoked"?"This payment was reversed.":status==="needs_support"?"Your payment needs our support team.":status==="generating"?"Writing your story…":
   status==="error"?"We couldn't verify it yet.":"Checking your payment…";
 const body=status==="ready"?"Opening your complete marriage reading.":
   status==="failed"?"You have not been charged for a successful purchase. You can try a new checkout from your free insight.":
   status==="revoked"?"Report access is unavailable because the payment was refunded or disputed.":
   status==="needs_support"?"Your payment was confirmed, but the astrology provider has repeatedly failed. Please contact support with your receipt email; do not purchase again.":
   status==="generating"?"Payment confirmed. We are calculating real chart details and preparing your seven chapters.":
   status==="error"?(detail||"Your report remains private. Check again if you completed payment."):
   "A payment redirect is not proof of purchase. We're checking the secure order status.";
 return <main className="lovora-return">
  <header><Link href="/" className="lovora-return__brand"><span>✦</span> LOVORA</Link></header>
  <section className="lovora-return__center">
   <div className="lovora-return__symbol" aria-hidden="true">☾</div>
   <p className="lovora-return__kicker">YOUR COMPLETE MARRIAGE READING</p>
   <h1>{title}</h1>
   <p>{body}</p>
   {(status==="pending"||status==="checking"||status==="generating")&&attempt>=24&&
     <p>Verification is taking longer than expected. Your order remains saved; use Check again to refresh.</p>}
   <div className="lovora-return__actions">
    <button type="button" onClick={()=>{setAttempt(0);void refresh();}} disabled={status==="ready"}>Check payment again ↻</button>
    <Link href="/insight">Back to free insight</Link>
    <Link href="/recover">Recover my purchase by email</Link>
    {status==="needs_support"&&<Link href="/support">Contact support</Link>}
   </div>
   <p className="lovora-return__footnote">No report unlock without a provider-verified successful payment. Keep your checkout email for receipt and support.</p>
  </section>
 </main>;
}
export default function CheckoutReturn(){
 return <Suspense fallback={<main className="lovora-return"/>}><ReturnContent/></Suspense>;
}
