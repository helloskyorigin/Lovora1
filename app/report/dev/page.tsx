"use client";
import { FormEvent,useState } from "react";
import Link from "next/link";
import "../report.css";

export default function ReportDevPage(){
  const [secret,setSecret]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  async function run(event:FormEvent){
    event.preventDefault();setBusy(true);setError("");
    try{
      const response=await fetch("/api/report/dev-generate",{
        method:"POST",credentials:"same-origin",headers:{"x-lovora-dev-secret":secret},
      });
      const data=await response.json() as {ok?:boolean;next?:string;error?:string};
      if(!response.ok||!data.ok)throw new Error(data.error||"Development report failed.");
      window.location.assign(data.next||"/report");
    }catch(err){setError(err instanceof Error?err.message:"Development report unavailable.");setBusy(false);}
  }
  return <main className="report-site">
    <header className="report-header"><div className="report-header__inner"><Link href="/" className="report-header__brand">✦ LOVORA</Link></div></header>
    <section className="report-locked"><div className="report-locked__inner">
      <div className="report-locked__icon">✳</div>
      <h1>Developer report test</h1>
      <p>Only works on NODE_ENV=development, with actual Prokerala keys and the 32+ character LOVORA_DEV_REPORT_SECRET. No public paid report access.</p>
      <form onSubmit={run}>
        <input type="password" autoComplete="off" aria-label="Development report secret" value={secret} onChange={e=>setSecret(e.target.value)}
          style={{width:"100%",minHeight:48,padding:12,borderRadius:8,marginTop:15,background:"#fdf6f7",color:"#402c45"}} required/>
        <button type="submit" disabled={busy} style={{background:"#ebbad2",color:"#412b41",border:0,borderRadius:8,padding:"13px 20px",marginTop:14,width:"100%",cursor:"pointer"}}>
          {busy?"Calculating verified chart…":"Generate my development report"}
        </button>
      </form>
      {error&&<p role="alert" style={{color:"#ffbacc"}}>{error}</p>}
      <Link href="/report/sample">View clearly labeled illustrative sample instead →</Link>
    </div></section>
  </main>;
}
