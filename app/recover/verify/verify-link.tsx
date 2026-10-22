"use client";
import {useEffect,useState} from "react";
import {useRouter,useSearchParams} from "next/navigation";
import Link from "next/link";
export function VerifyLink(){
 const params=useSearchParams(),router=useRouter();
 const [token]=useState(()=>params.get("token")||"");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 useEffect(()=>{
  // Avoid retaining the secret in the visible URL or future navigation referrers.
  window.history.replaceState(window.history.state,"","/recover/verify");
 },[]);
 async function claim(){
  if(busy)return;
  setBusy(true);setError("");
  try{
   const res=await fetch("/api/recovery/consume",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token})});
   const json=await res.json() as {ok?:boolean;error?:string;next?:string};
   if(!res.ok||!json.ok)throw new Error(json.error||"Unable to open your report.");
   router.replace(json.next||"/report");
  }catch(err){setError(err instanceof Error?err.message:"This link cannot be used.");setBusy(false);}
 }
 return <main className="recovery">
  <header className="recovery-header"><Link href="/" className="recovery-logo"><span>✦</span> LOVORA</Link></header>
  <section className="recovery-center">
   <div className="recovery-ornament" aria-hidden="true">✧</div>
   <p className="recovery-eyebrow">ONE LAST PRIVATE STEP</p>
   <h1>Welcome <em>back.</em></h1>
   <p className="recovery-description">Confirm below to open your purchased marriage story on this device.</p>
   {token.length===43?<button className="recovery-button" disabled={busy} onClick={()=>void claim()}>{busy?"Verifying…":"Open my private story ↗"}</button>:<p className="recovery-message recovery-error">This recovery link is incomplete or invalid.</p>}
   {error&&<p role="alert" className="recovery-message recovery-error">{error}</p>}
   <p className="recovery-foot">This action uses your recovery link exactly once. Expired links can be requested again.</p>
   <Link href="/recover" className="recovery-link">Request another secure link</Link>
  </section>
 </main>;
}
