"use client";
import {Suspense,useEffect,useState} from "react";
import Link from "next/link";
import {useRouter,useSearchParams} from "next/navigation";
import {getBirthSessionHeaders,rememberBirthSession} from "@/lib/client-birth-session";
import {rememberScanResult} from "@/lib/client-scan-result";
import {readApiJSON} from "@/lib/api-response";
import "../journey.css";

type Result={ok?:boolean;mode?:"verified"|"guide";insight?:unknown;sessionToken?:string;reason?:string};
function ScanFlow(){
 const params=useSearchParams(),router=useRouter();
 const hi=params.get("lang")==="hi",lang=hi?"hi":"en";
 const [status,setStatus]=useState(hi?"आपकी जन्म-जानकारी जाँची जा रही है…":"Checking your birth details…");
 const [problem,setProblem]=useState("");
 useEffect(()=>{
  let closed=false;
  (async()=>{
   try{
    const res=await fetch("/api/insight",{
     method:"POST",credentials:"same-origin",cache:"no-store",
     headers:{"Content-Type":"application/json",...getBirthSessionHeaders()}
    });
    const data=await readApiJSON<Result>(res,"Chart service returned an unexpected response.");
    if(!res.ok||!data.ok||!data.mode)throw new Error("Chart preview temporarily unavailable.");
    if(closed)return;
    rememberBirthSession(data.sessionToken);
    rememberScanResult(data);
    setStatus(hi?"आपकी कहानी तैयार है।":"Your story is ready.");
   }catch(err){
    if(closed)return;
    rememberScanResult({ok:true,mode:"guide",reason:"SERVICE_UNAVAILABLE"});
    setStatus(hi?"आपकी कहानी खोल रहे हैं…":"Opening your story…");
    setProblem(err instanceof Error?err.message:"");
   }
   if(!closed)router.replace("/insight?lang="+lang);
  })();
  return ()=>{closed=true;};
 },[router,hi,lang]);
 return <main className="journey journey--scan"><div className="journey__wrap">
  <header className="journey__top"><Link href={"/birth-details?lang="+lang} className="journey__back">← {hi?"जन्म विवरण":"Birth details"}</Link><Link href="/" className="journey__brand">✦ LOVORA</Link><span className="journey__scan-language">{hi?"हिंदी":"EN"}</span></header>
  <section className="lovora-scan">
   <div className="lovora-scan__orbit" aria-hidden="true"><span>♡</span><i/></div>
   <p className="journey__overline">✦ {hi?"आपकी प्रेम कहानी":"YOUR LOVE STORY"}</p>
   <h1>{hi?"दिल की कहानी,":"Your heart,"}<em>{hi?"सितारों की जुबानी।":"through the stars."}</em></h1>
   <p role="status">{status}</p>
   <div className="lovora-scan__steps"><span>{hi?"जन्म विवरण":"Birth details"} ✓</span><span>{hi?"ग्रह संकेत जाँच रहे हैं":"Checking chart indicators"} ◌</span><span>{hi?"परिणाम":"Your result"} ◌</span></div>
   {problem&&<p className="lovora-scan__fallback">{hi?"व्यक्तिगत गणना उपलब्ध नहीं हुई; सामान्य जानकारी खुलेगी।":"Personalized calculation unavailable; opening the general exploration."}</p>}
  </section></div></main>;
}
export default function ScanningPage(){return <Suspense fallback={<main className="journey"/>}><ScanFlow/></Suspense>}
