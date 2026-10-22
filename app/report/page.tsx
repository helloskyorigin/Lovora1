"use client";
import { useEffect,useState } from "react";
import Link from "next/link";
import { ReportExperience } from "@/components/ReportExperience";
import type { MarriageStoryReport } from "@/lib/report/types";
import "./report.css";

export default function PaidReportPage(){
  const [report,setReport]=useState<MarriageStoryReport|null>(null);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    const controller=new AbortController();
    fetch("/api/report",{cache:"no-store",credentials:"same-origin",signal:controller.signal})
      .then(async response=>{
        const value=await response.json() as {ok?:boolean;report?:MarriageStoryReport;error?:string};
        if(!response.ok||!value.ok||!value.report)throw new Error(value.error||"Unable to load your report.");
        if(!controller.signal.aborted)setReport(value.report);
      })
      .catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Report unavailable.");})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[]);
  if(report)return <ReportExperience report={report}/>;
  return <main className="report-site">
    <header className="report-header"><div className="report-header__inner"><Link href="/" className="report-header__brand"><span className="report-header__star">✦</span> LOVORA</Link></div></header>
    <section className="report-locked"><div className="report-locked__inner">
      <div className="report-locked__icon">☾</div>
      <p className="report-kicker">YOUR PERSONAL MARRIAGE STORY</p>
      <h1>{loading?"Opening your story…":"Your story is private."}</h1>
      <p>{loading?"Checking secure report access.":error||"This report requires verified access. No private reading is exposed without authorization."}</p>
      <Link href="/insight">Return to my free insight ↗</Link>
      <Link href="/recover">Already purchased? Recover by email ↗</Link>
    </div></section>
  </main>;
}
