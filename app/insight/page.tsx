"use client";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import "../journey.css";
import {CheckoutForm} from "@/components/CheckoutForm";

type Insight = {planet:"Venus";sign:string;descriptionEn:string;descriptionHi:string;source:string;ayanamsa:string};
type Lang="en"|"hi";
const copy={
  en:{
    eyebrow:"YOUR PERSONAL FREE GLIMPSE",headline:"One true chart detail.",accent:"A story to explore.",
    desc:"An authentic planetary placement, interpreted through traditional Vedic astrology.",
    loading:"Calculating your actual planetary positions…",loadingNote:"No AI guesses. No made-up astrology results.",
    retry:"Try again",back:"Edit birth details",context:"Change your question",label:"YOUR LOVE NATURE",fact:"Verified chart position",
    source:"Source: Prokerala · Lahiri ayanamsa",interpret:"Traditional interpretation",
    note:"Venus is traditionally associated with love and affection. A single placement does not establish your marriage type, marriage date, or future partner.",
    premium:"There's more to your story.",premiumDesc:"The full marriage reading will explore multiple relevant chart indicators and their limitations — not just one planet.",
    chapters:["Love, arranged or family-supported marriage","Traditional marriage timing, where supported","Future partnership and relationship themes","Chart evidence and complete report"],
    checkout:"Complete report: ₹299 one-time",notYet:"Full report checkout is not connected in this phase. No payment will be charged.",
    lang:"हिंदी",error:"No reading is available right now.",footer:"Astrology is a traditional practice, not a scientifically established way to predict relationships.",
  },
  hi:{
    eyebrow:"आपकी व्यक्तिगत मुफ़्त झलक",headline:"कुंडली का एक वास्तविक संकेत।",accent:"आपकी कहानी का आरंभ।",
    desc:"वास्तविक ग्रह-स्थिति के आधार पर पारंपरिक वैदिक ज्योतिषीय व्याख्या।",
    loading:"ग्रहों की वास्तविक स्थिति निकाल रहे हैं…",loadingNote:"बिना अनुमान के, बिना नकली परिणाम के।",
    retry:"दोबारा कोशिश करें",back:"जन्म विवरण बदलें",context:"अपना सवाल बदलें",label:"आपका प्रेम स्वभाव",fact:"वास्तविक ग्रह-स्थिति",
    source:"स्रोत: Prokerala · लाहिड़ी अयनांश",interpret:"पारंपरिक व्याख्या",
    note:"शुक्र को पारंपरिक ज्योतिष में प्रेम से जोड़ा जाता है। केवल एक ग्रह स्थिति से शादी का प्रकार, तारीख या साथी की पहचान तय नहीं होती।",
    premium:"आपकी कहानी में अभी बहुत कुछ बाकी है।",premiumDesc:"पूरी विवाह रीडिंग कई संबंधित कुंडली संकेतों और सीमाओं को समझाएगी।",
    chapters:["लव, अरेंज या परिवार-सहयोग से विवाह के संकेत","उपयुक्त होने पर पारंपरिक विवाह समय","भविष्य के रिश्तों के विषय","कुंडली के प्रमाण और पूरी रिपोर्ट"],
    checkout:"पूरी रीडिंग ₹299 एक बार",notYet:"इस चरण में भुगतान नहीं जुड़ा है। कोई राशि नहीं ली जाएगी।",
    lang:"English",error:"अभी रीडिंग उपलब्ध नहीं है।",footer:"ज्योतिष पारंपरिक चिंतन है, रिश्तों की वैज्ञानिक भविष्यवाणी नहीं।",
  },
} as const;

function InsightContent(){
  const params=useSearchParams();
  const [lang,setLang]=useState<Lang>(params.get("lang")==="hi"?"hi":"en");
  const [insight,setInsight]=useState<Insight|null>(null);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);
  const called=useRef(false);
  const c=copy[lang];

  const generate=useCallback(async()=>{
    setLoading(true);setError("");
    try{
      const response=await fetch("/api/insight",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"}});
      const json=await response.json() as {ok?:boolean;insight?:Insight;error?:string};
      if(!response.ok||!json.ok||!json.insight)throw new Error(json.error||"Your chart could not be calculated.");
      setInsight(json.insight);
    }catch(e){setError(e instanceof Error?e.message:"Your chart could not be calculated.");}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{if(called.current)return;called.current=true;void generate();},[generate]);

  return <main className={"journey"+(lang==="hi"?" journey--hi":"")}>
    <div className="journey__wrap">
      <header className="journey__top"><Link href={"/relationship?lang="+lang} className="journey__back"><span aria-hidden="true">←</span>{c.context}</Link>
        <Link className="journey__brand" href="/"><span>✦</span> LOVORA</Link>
        <button className="journey__language" onClick={()=>setLang(lang==="en"?"hi":"en")} type="button">{c.lang}</button></header>
      <div className="journey__result">
        <div className="journey__result-heading">
          <p className="journey__overline">✦ {c.eyebrow}</p>
          <h1 className="journey__title">{c.headline}<em>{c.accent}</em></h1>
          <p>{c.desc}</p>
        </div>
        <div className="journey__wheel" aria-hidden="true"><span>♀</span></div>
        {loading?<div className="journey__loading" role="status"><p>{c.loading}</p><p>{c.loadingNote}</p></div>:
          error?<div className="journey__premium">
            <div className="journey__error" role="alert">{error}</div>
            <button className="journey__button" type="button" onClick={()=>void generate()}>{c.retry}<span>↗</span></button>
            <div className="journey__action-row"><Link href={"/birth-details?lang="+lang}>{c.back}</Link></div>
          </div>:
          insight&&<>
            <section className="journey__reading">
              <p className="journey__reading-kicker">✧ {c.label}</p>
              <h2>{lang==="hi"?"शुक्र (Venus) — ":"Venus in "}{insight.sign}</h2>
              <p><strong>{c.interpret}.</strong> {lang==="hi"?insight.descriptionHi:insight.descriptionEn}</p>
              <div className="journey__evidence"><span>{c.fact}:</span><strong>Venus · {insight.sign}</strong><span>· {c.source}</span></div>
            </section>
            <p className="journey__note">{c.note}</p>
            <section className="journey__premium">
              <h3>{c.premium}</h3><p>{c.premiumDesc}</p>
              <ul>{c.chapters.map(x=><li key={x}><span>✧</span>{x}</li>)}</ul>
              <p className="journey__configured">{c.checkout}</p>
              <CheckoutForm lang={lang}/>
              <Link href="/report/sample" style={{color:"#f3cf9f",fontSize:12,textDecoration:"underline",textUnderlineOffset:4}}>{lang==="hi"?"पूरी रिपोर्ट का सैंपल देखें ↗":"Preview the seven-chapter sample report ↗"}</Link>
              <Link href="/recover" style={{color:"#f3cf9f",fontSize:12,textDecoration:"underline",textUnderlineOffset:4}}>{lang==="hi"?"पहले खरीदी रिपोर्ट ईमेल से वापस पाएँ ↗":"Already paid? Recover your report by email ↗"}</Link>
            </section>
          </>
        }
        <p className="journey__provider"><a href="https://www.prokerala.com/astrology/" target="_blank" rel="noopener noreferrer">Astrology calculations by Prokerala ↗</a></p>
      </div>
    </div>
    <footer className="journey__footer">{c.footer}</footer>
  </main>;
}
export default function InsightPage(){return <Suspense fallback={<main className="journey"/>}><InsightContent/></Suspense>;}
