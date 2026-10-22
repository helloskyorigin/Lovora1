"use client";
import {Suspense,useCallback,useEffect,useRef,useState} from "react";
import Link from "next/link";
import {useSearchParams} from "next/navigation";
import {CheckoutForm} from "@/components/CheckoutForm";
import {ResultChoiceModal} from "@/components/ResultChoiceModal";
import {getBirthSessionHeaders,rememberBirthSession} from "@/lib/client-birth-session";
import {readScanResult} from "@/lib/client-scan-result";
import {readApiJSON} from "@/lib/api-response";
import "../journey.css";

type Insight={
 planet:"Venus";sign:string;descriptionEn:string;descriptionHi:string;
 marriagePath?:{leaning:"romance-linked"|"undetermined";loveIndicators:number;available:true};
};
type View={ok?:boolean;mode?:"verified"|"guide";insight?:Insight;sessionToken?:string;reason?:string;error?:string};
type Lang="en"|"hi";
const copy={
 en:{
  top:"YOUR FIRST LOVE INSIGHT",title:"Love or arranged?",
  summary:"What do your traditional birth-chart symbols suggest?",
  verified:"BASED ON YOUR CALCULATED CHART",unverified:"LOVE & MARRIAGE · A FIRST LOOK",
  linked:"Romance and partnership are connected.",
  neutral:"Your chart leaves both paths open.",
  linkedDesc:"Traditional 5th- and 7th-house symbols show a connection. The complete reading explores why.",
  neutralDesc:"The traditional chart signals do not establish a clear marriage path. Your complete reading explains the balance.",
  general:"Love and arranged marriage can both grow through choice, affection and mutual consent.",
  generalDesc:"A personal chart-based interpretation is not available right now. This is general guidance, not your calculated marriage outcome.",
  unlock:"Discover the full story behind your chart.",
  unlockDesc:"Your complete seven-chapter reading, with evidence, reflections, and a keepsake.",
  first:"Your marriage path and supporting evidence",
  second:"Love nature, future partnership and your story",
  third:"Traditional timing where available, plus PDF and sharing",
  price:"Unlock Full Story — ₹149",
  restricted:"Personal chart not verified. You can explore for free, but checkout is paused until a real reading can be delivered.",
  preview:"See the seven-chapter sample",
  back:"Birth details",lang:"हिंदी",
  caveat:"Traditional interpretation for personal reflection, not a scientific probability or guaranteed marriage type."
 },
 hi:{
  top:"आपका पहला प्रेम संकेत",title:"लव मैरिज या अरेंज मैरिज?",
  summary:"पारंपरिक जन्म-कुंडली के संकेत क्या कहते हैं?",
  verified:"गणना की गई जन्म-कुंडली पर आधारित",unverified:"प्यार और विवाह · पहली झलक",
  linked:"प्रेम और साझेदारी के संकेत जुड़े हैं।",
  neutral:"दोनों रास्तों की संभावना खुली है।",
  linkedDesc:"पंचम और सप्तम भाव में पारंपरिक संबंध दिखता है। पूरी रिपोर्ट में इसका अर्थ समझें।",
  neutralDesc:"कुंडली के संकेत किसी एक विवाह रास्ते का स्पष्ट समर्थन नहीं करते। पूरी रिपोर्ट में विस्तार देखें।",
  general:"लव या अरेंज — दोनों में आपकी पसंद, प्यार और सहमति सबसे ज़रूरी हैं।",
  generalDesc:"अभी व्यक्तिगत कुंडली की गणना सत्यापित नहीं हुई। यह सामान्य जानकारी है, निजी भविष्यवाणी नहीं।",
  unlock:"कुंडली के पीछे की पूरी कहानी जानें।",
  unlockDesc:"प्रमाण, व्याख्या और यादगार रिपोर्ट के साथ सात व्यक्तिगत अध्याय।",
  first:"विवाह के पारंपरिक संकेत और प्रमाण",
  second:"प्रेम स्वभाव, साथी और आपकी कहानी",
  third:"जहाँ उपलब्ध हो पारंपरिक समय, PDF और शेयर",
  price:"पूरी कहानी खोलें — ₹149",
  restricted:"व्यक्तिगत कुंडली सत्यापित नहीं है। अभी मुफ़्त में देखें; वास्तविक रिपोर्ट तैयार हो सकने पर ही भुगतान खुलेगा।",
  preview:"सात अध्याय की नमूना रिपोर्ट देखें",
  back:"जन्म विवरण",lang:"English",
  caveat:"यह व्यक्तिगत चिंतन के लिए पारंपरिक व्याख्या है, वैज्ञानिक प्रतिशत या निश्चित भविष्यवाणी नहीं।"
 }
} as const;

function ResultPage(){
 const params=useSearchParams();
 const [lang,setLang]=useState<Lang>(params.get("lang")==="hi"?"hi":"en");
 const [result,setResult]=useState<View|null>(null);
 const [loading,setLoading]=useState(true);
 const [choice,setChoice]=useState(params.get("choice")==="1");
 const choiceClosed=useCallback(()=>setChoice(false),[]);
 const once=useRef(false);
 const c=copy[lang];
 const load=useCallback(async():Promise<boolean>=>{
  try{
   const res=await fetch("/api/insight",{
    method:"POST",credentials:"same-origin",cache:"no-store",
    headers:{"Content-Type":"application/json",...getBirthSessionHeaders()}
   });
   const data=await readApiJSON<View>(res,"The chart service is unavailable");
   if(!res.ok||!data.ok)throw new Error("Chart data unavailable");
   rememberBirthSession(data.sessionToken);
   setResult(data);
   return data.mode==="verified"&&data.insight?.marriagePath?.available===true;
  }catch{
   setResult({ok:true,mode:"guide",reason:"SERVER_UNAVAILABLE"});
   return false;
  }finally{setLoading(false);}
 },[]);
 useEffect(()=>{
  if(once.current)return;once.current=true;
  const cached=readScanResult();
  if(cached?.ok&&cached.mode){setResult(cached as View);setLoading(false);}
  else void load();
 },[load]);
 const verified=result?.mode==="verified"&&!!result?.insight?.marriagePath?.available;
 const linked=verified&&result?.insight?.marriagePath?.leaning==="romance-linked";
 return <main className={"journey journey--compact-result"+(lang==="hi"?" journey--hi":"")}>
  <div className="journey__wrap">
   <header className="journey__top">
    <Link href={"/birth-details?lang="+lang} className="journey__back">← <span>{c.back}</span></Link>
    <Link href="/" className="journey__brand"><span>✦</span> LOVORA</Link>
    <button type="button" className="journey__language" onClick={()=>setLang(lang==="en"?"hi":"en")}>{c.lang}</button>
   </header>
   <article className="lovora-result">
    <header className="lovora-result__intro">
     <p className="journey__overline">✦ {c.top}</p>
     <h1>{c.title}</h1>
     <p>{c.summary}</p>
    </header>
    {loading?<div className="lovora-result__waiting" role="status"><span>♡</span>{lang==="hi"?"कहानी खोल रहे हैं…":"Opening your story…"}</div>:
    <>
     <section className="lovora-result__verdict" aria-label={verified?c.verified:c.unverified}>
      <p className="lovora-result__kicker">✦ {verified?c.verified:c.unverified}</p>
      <h2>{!verified?c.general:linked?c.linked:c.neutral}</h2>
      <p>{!verified?c.generalDesc:linked?c.linkedDesc:c.neutralDesc}</p>
      {verified&&result?.insight?.source==="Local astronomy calculation"&&
       <p className="lovora-result__local-note">{lang==="hi"?"ऑफ़लाइन गणना · अनुमानित लाहिड़ी अयनांश · राशि सीमा के पास परिणाम बदल सकता है।":"Offline astronomy calculation · approximate Lahiri offset · signs near boundaries can vary."}</p>}
      <p className="lovora-result__small">{c.caveat}</p>
     </section>
     <section className="lovora-result__locked" aria-label={c.unlock}>
      <div className="lovora-result__offer"><span>✦ FIRST 500</span><div><del>₹299</del><strong>₹149</strong></div></div>
      <h2>{c.unlock}</h2>
      <p>{c.unlockDesc}</p>
      <button type="button" className="lovora-result__main-unlock" onClick={()=>setChoice(true)}>
       {c.price} <span aria-hidden="true">↗</span>
      </button>
      {!verified&&<p className="lovora-result__notice">{c.restricted}</p>}
      <div className="lovora-result__blurred" aria-hidden="true"><span>01</span><div><b>{c.first}</b><i/></div><span>↗</span></div>
      <div className="lovora-result__blurred" aria-hidden="true"><span>02</span><div><b>{c.second}</b><i/></div><span>↗</span></div>
      <div className="lovora-result__blurred" aria-hidden="true"><span>03</span><div><b>{c.third}</b><i/></div><span>↗</span></div>
      <Link className="lovora-result__sample" href="/report/sample">{c.preview} ↗</Link>
     </section>
    </>}
   </article>
  </div>
  {choice&&!loading&&<ResultChoiceModal lang={lang} verified={!!verified} onFree={choiceClosed} onVerify={load}/>}
 </main>;
}
export default function InsightPage(){return <Suspense fallback={<main className="journey"/>}><ResultPage/></Suspense>}
