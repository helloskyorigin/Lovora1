"use client";
import {FormEvent,useState} from "react";
import Link from "next/link";
import "./recover.css";

export default function RecoverPage(){
 const [email,setEmail]=useState("");
 const [status,setStatus]=useState<"idle"|"sending"|"sent">("idle");
 const [msg,setMsg]=useState("");
 async function submit(event:FormEvent){
  event.preventDefault();if(status==="sending")return;
  setStatus("sending");setMsg("");
  try{
   const res=await fetch("/api/recovery/request",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})});
   if(!res.ok)throw new Error("Recovery is temporarily unavailable. Please try again later.");
   setStatus("sent");setMsg("If a paid report is eligible for recovery, a private 15-minute link will arrive at that email.");
  }catch(err){setStatus("idle");setMsg(err instanceof Error?err.message:"Please try again.");}
 }
 return <main className="recovery">
  <header className="recovery-header"><Link href="/" className="recovery-logo"><span>✦</span> LOVORA</Link></header>
  <section className="recovery-center">
   <div className="recovery-ornament" aria-hidden="true">☾</div>
   <p className="recovery-eyebrow">YOUR PRIVATE KEEPSAKE</p>
   <h1>Find your <em>story again.</em></h1>
   <p className="recovery-description">Bought a complete reading? Enter the email used at checkout. No account or password required.</p>
   <form className="recovery-panel" onSubmit={submit}>
    <label className="recovery-label" htmlFor="recovery-email">Payment email</label>
    <input className="recovery-input" type="email" id="recovery-email" autoComplete="email" required maxLength={254} placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/>
    <button className="recovery-button" type="submit" disabled={status==="sending"}>{status==="sending"?"Sending secure link…":"Email my recovery link ↗"}</button>
    <p className="recovery-foot">The link expires after 15 minutes and can only be used once. We never reveal whether an email has a purchase.</p>
   </form>
   {msg&&<p role="status" className={"recovery-message"+(status==="idle"?" recovery-error":"")}>{msg}</p>}
   <Link href="/" className="recovery-link">← Back to LOVORA</Link>
  </section>
 </main>;
}
