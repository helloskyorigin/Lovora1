"use client";
import {Suspense,useCallback,useEffect,useRef,useState} from "react";
import Link from "next/link";
import {useSearchParams} from "next/navigation";
import {CheckoutForm} from "@/components/CheckoutForm";
import {getBirthSessionHeaders,rememberBirthSession} from "@/lib/client-birth-session";
import {readApiJSON} from "@/lib/api-response";
import "../journey.css";

type Insight={planet:"Venus";sign:string;descriptionEn:string;descriptionHi:string;source:string;ayanamsa:string};
type View={ok?:boolean;mode?:"verified"|"guide";insight?:Insight;sessionToken?:string;reason?:string;error?:string};
type Lang="en"|"hi";
const copy={
 en:{
  eyebrow:"YOUR LOVE STORY · FREE EXPLORATION",
  headline:"Love marriage",accent:"or arranged marriage?",
  desc:"Two meaningful paths. Traditional symbolism can inspire reflection, but cannot guarantee which one you'll have.",
  loading:"Exploring your love story…",
  real:"VERIFIED BIRTH-CHART DETAIL",
  guide:"A free guide, not a personalized chart",
  love:"Love marriage",arranged:"Arranged marriage",
  loveText:"A bond you choose, with affection and mutual consent at the center.",
  arrangedText:"An introduction with family involvement, where your choice and consent remain essential.",
  context:"Marriage isn't a fixed choice determined by planets. Family-supported love can also combine both paths.",
  venus:"Venus in",meaning:"Traditional Venus theme",
  source:"Planetary position verified through Prokerala · Lahiri",
  unavailable:"We couldn't verify your planetary chart right now. This is a general Love vs Arranged Marriage guide, not a calculated result or prediction.",
  action:"Try chart calculation again",edit:"Edit birth details",lang:"हिंदी",
  paid:"Go deeper into your chart",paidText:"When a verified birth chart is available, you can unlock seven detailed chapters about traditional relationship indicators. One-time ₹149 launch price.",
  pending:"Paid report is unavailable until your real chart can be verified. You will not be charged for this general guide.",
  sample:"Explore the seven-chapter sample ↗",
  footer:"Traditional Vedic astrology for reflection, not a scientific marriage prediction."
 },
 hi:{
  eyebrow:"आपकी प्रेम कहानी · मुफ़्त झलक",
  headline:"लव मैरिज",accent:"या अरेंज मैरिज?",
  desc:"दो रास्ते, लेकिन कुंडली से शादी का प्रकार निश्चित नहीं बताया जा सकता।",
  loading:"आपकी कहानी देख रहे हैं…",
  real:"सत्यापित जन्म-कुंडली संकेत",
  guide:"सामान्य जानकारी — व्यक्तिगत कुंडली नहीं",
  love:"लव मैरिज",arranged:"अरेंज मैरिज",
  loveText:"आपकी पसंद, प्यार और आपसी सहमति से आगे बढ़ने वाला रिश्ता।",
  arrangedText:"परिवार की मदद से परिचय, जिसमें आपकी अपनी सहमति ज़रूरी है।",
  context:"ग्रह किसी एक रास्ते को तय नहीं करते। परिवार के साथ लव मैरिज भी संभव है।",
  venus:"शुक्र की राशि:",meaning:"शुक्र की पारंपरिक व्याख्या",
  source:"Prokerala से सत्यापित ग्रह स्थिति · लाहिड़ी",
  unavailable:"अभी वास्तविक ग्रह-स्थिति सत्यापित नहीं हो सकी। यह सामान्य लव बनाम अरेंज मैरिज जानकारी है, गणना किया गया निजी नतीजा नहीं।",
  action:"कुंडली फिर जाँचें",edit:"जन्म विवरण बदलें",lang:"English",
  paid:"कुंडली के संकेत विस्तार से पढ़ें",paidText:"वास्तविक कुंडली सत्यापित होने पर सात विस्तृत अध्याय अनलॉक कर सकते हैं। ₹149 का एक बार का लॉन्च मूल्य।",
  pending:"वास्तविक कुंडली सत्यापित होने तक भुगतान उपलब्ध नहीं। सामान्य जानकारी के लिए कोई शुल्क नहीं लिया जाएगा।",
  sample:"सात अध्याय की नमूना रिपोर्ट देखें ↗",
  footer:"वैदिक ज्योतिष व्यक्तिगत चिंतन के लिए है, वैज्ञानिक विवाह-भविष्यवाणी नहीं।"
 }
} as const;

function InsightPageBody(){
 const params=useSearchParams();
 const [lang,setLang]=useState<Lang>(params.get("lang")==="hi"?"hi":"en");
 const [result,setResult]=useState<View|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const called=useRef(false);
 const c=copy[lang];
 const generate=useCallback(async()=>{
  setLoading(true);setError("");
  try{
   const response=await fetch("/api/insight",{
    method:"POST",credentials:"same-origin",cache:"no-store",
    headers:{"Content-Type":"application/json",...getBirthSessionHeaders()}
   });
   const data=await readApiJSON<View>(response,"The server returned a page instead of chart data.");
   if(!response.ok||!data.ok)throw new Error(data.error||"Unable to load this guide.");
   rememberBirthSession(data.sessionToken);
   setResult(data);
  }catch(e){
   // Still show an explicitly non-personal general guide, never pretend to verify a chart.
   setResult({ok:true,mode:"guide",reason:"SERVER_UNAVAILABLE"});
   setError(e instanceof Error?e.message:"Service unavailable.");
  }finally{setLoading(false);}
 },[]);
 useEffect(()=>{if(called.current)return;called.current=true;void generate();},[generate]);
 const verified=result?.mode==="verified"&&!!result.insight;
 return <main className={"journey journey--love-choice"+(lang==="hi"?" journey--hi":"")}>
  <div className="journey__wrap">
   <header className="journey__top">
    <Link href={"/birth-details?lang="+lang} className="journey__back">← {c.edit}</Link>
    <Link href="/" className="journey__brand"><span>✦</span> LOVORA</Link>
    <button className="journey__language" onClick={()=>setLang(lang==="en"?"hi":"en")} type="button">{c.lang}</button>
   </header>
   <div className="journey__result">
    <div className="journey__result-heading">
     <p className="journey__overline">✦ {c.eyebrow}</p>
     <h1 className="journey__title">{c.headline}<em>{c.accent}</em></h1>
     <p>{c.desc}</p>
    </div>
    {loading?<section className="journey__loading" role="status">{c.loading}</section>:
     <div className="lovora-two-paths">
      <div className="lovora-path"><span className="lovora-path__icon">♡</span><h2>{c.love}</h2><p>{c.loveText}</p></div>
      <div className="lovora-path"><span className="lovora-path__icon">✦</span><h2>{c.arranged}</h2><p>{c.arrangedText}</p></div>
     </div>
    }
    {!loading&&<section className="lovora-verification" aria-label={verified?c.real:c.guide}>
     <p className="journey__reading-kicker">✧ {verified?c.real:c.guide}</p>
     {verified&&result?.insight?<><h2>{c.venus} {result.insight.sign}</h2>
      <p><strong>{c.meaning}:</strong> {lang==="hi"?result.insight.descriptionHi:result.insight.descriptionEn}</p>
      <small>{c.source}</small></>:
      <><p>{c.unavailable}</p>
       <button type="button" className="lovora-secondary-action" onClick={()=>void generate()}>{c.action} ↻</button>
       {error&&<p className="lovora-verification__notice" role="status">{error}</p>}</>
     }
     <p className="lovora-verification__caveat">{c.context}</p>
    </section>}
    {!loading&&<section className="journey__premium">
     <h3>{c.paid}</h3><p>{c.paidText}</p>
     {verified?<CheckoutForm lang={lang}/>:<p className="lovora-verification__notice">{c.pending}</p>}
     <Link href="/report/sample" className="lovora-secondary-action">{c.sample}</Link>
    </section>}
   </div>
  </div>
  <footer className="journey__footer">{c.footer}</footer>
 </main>;
}
export default function InsightPage(){return <Suspense fallback={<main className="journey"/>}><InsightPageBody/></Suspense>}
