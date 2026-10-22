"use client";
import {Suspense,useCallback,useEffect,useRef,useState} from "react";
import Link from "next/link";
import {useSearchParams} from "next/navigation";
import {CheckoutForm} from "@/components/CheckoutForm";
import {getBirthSessionHeaders,rememberBirthSession} from "@/lib/client-birth-session";
import {readScanResult} from "@/lib/client-scan-result";
import {readApiJSON} from "@/lib/api-response";
import "../journey.css";

type Insight={
 planet:"Venus";sign:string;descriptionEn:string;descriptionHi:string;
 marriagePath?:{leaning:"romance-linked"|"undetermined";loveIndicators:number;available:true}
};
type View={ok?:boolean;mode?:"verified"|"guide";insight?:Insight;sessionToken?:string;reason?:string;error?:string};
type Lang="en"|"hi";
const copy={
 en:{
  top:"YOUR FREE LOVE STORY", title:"Love or arranged?",subtitle:"Here's what your birth-chart symbols can — and can't — tell us.",
  chart:"VERIFIED TRADITIONAL CHART PATTERN",guide:"NO VERIFIED CHART YET",
  linked:"Romance-linked indicators stand out.",unclear:"No clear lead between the two paths.",
  linkedSub:"Your chart contains traditional links between romance and partnership themes.",
  unclearSub:"The verified indicators don't establish either marriage type as more likely.",
  noData:"Your personal chart isn't ready. We won't invent a marriage verdict.",
  retry:"Try the real chart again",edit:"Edit birth details",
  hint:"Is the connection in the 5th and 7th houses? What does Venus add?",
  unlocked:"Your complete story goes much deeper.",premium:"UNLOCK YOUR COMPLETE STORY",
  premiumIntro:"See the chart evidence, what supports or limits your reading, and seven personalized chapters.",
  teaserOne:"Your marriage path — with the real chart evidence",
  teaserTwo:"Your love nature, future partnership & relationship patterns",
  teaserThree:"Traditional timing where available, plus a keepsake & PDF",
  preview:"See a sample seven-chapter report",powered:"Chart calculations by Prokerala ↗",
  price:"₹149 ONE-TIME",oldPrice:"₹299",offer:"FIRST 500 OFFER",
  noPay:"Personalized report unlock opens only when a real chart can be verified. No payment for this preview.",
  back:"Birth details",lang:"हिंदी",
  caveat:"This is a traditional astrological indication, not a percentage, promise or scientific prediction. Consent and personal choice matter."
 },
 hi:{
  top:"आपकी मुफ़्त प्रेम कहानी",title:"लव या अरेंज मैरिज?",subtitle:"जन्म-कुंडली के पारंपरिक संकेतों में क्या दिखता है?",
  chart:"सत्यापित पारंपरिक कुंडली संकेत",guide:"अभी व्यक्तिगत कुंडली सत्यापित नहीं",
  linked:"प्रेम और साझेदारी के संकेत जुड़े हुए हैं।",unclear:"दोनों रास्तों में स्पष्ट बढ़त नहीं।",
  linkedSub:"आपकी कुंडली में रोमांस और साझेदारी के कुछ पारंपरिक संकेत जुड़े हैं।",
  unclearSub:"सत्यापित संकेत किसी एक विवाह प्रकार की अधिक संभावना साबित नहीं करते।",
  noData:"अभी निजी कुंडली की पुष्टि नहीं हुई। हम मनगढ़ंत विवाह-नतीजा नहीं दिखाएँगे।",
  retry:"कुंडली फिर जाँचें",edit:"जन्म विवरण बदलें",
  hint:"पंचम और सप्तम भाव क्या दिखाते हैं? शुक्र का संकेत क्या है?",
  unlocked:"आपकी पूरी कहानी में और भी बहुत कुछ है।",premium:"अपनी पूरी कहानी खोलें",
  premiumIntro:"वास्तविक कुंडली के प्रमाण, व्याख्या और सात विस्तृत व्यक्तिगत अध्याय देखें।",
  teaserOne:"विवाह का रास्ता — वास्तविक कुंडली प्रमाण के साथ",
  teaserTwo:"प्रेम स्वभाव, रिश्ते और भावी साझेदारी",
  teaserThree:"जहाँ उपलब्ध हों पारंपरिक दशा-अवधियाँ, यादगार रिपोर्ट और PDF",
  preview:"सात अध्याय की नमूना रिपोर्ट देखें",powered:"Prokerala से कुंडली गणना ↗",
  price:"₹149 एक बार",oldPrice:"₹299",offer:"पहले 500 के लिए ऑफ़र",
  noPay:"असली कुंडली की पुष्टि होने पर ही निजी रिपोर्ट खरीदी जा सकेगी। सामान्य झलक मुफ़्त है।",
  back:"जन्म विवरण",lang:"English",
  caveat:"ये पारंपरिक प्रतीकात्मक संकेत हैं, निश्चित प्रतिशत या भविष्यवाणी नहीं। आपकी पसंद और सहमति ज़्यादा अहम हैं।"
 }
} as const;
function ResultPage(){
 const params=useSearchParams();
 const [lang,setLang]=useState<Lang>(params.get("lang")==="hi"?"hi":"en");
 const [result,setResult]=useState<View|null>(null);
 const [loading,setLoading]=useState(true);
 const [retrying,setRetrying]=useState(false);
 const called=useRef(false);
 const c=copy[lang];
 const check=useCallback(async()=>{
  setRetrying(true);
  try{
   const res=await fetch("/api/insight",{
    method:"POST",credentials:"same-origin",cache:"no-store",
    headers:{"Content-Type":"application/json",...getBirthSessionHeaders()}
   });
   const data=await readApiJSON<View>(res,"Unavailable");
   if(!res.ok||!data.ok)throw new Error("Unavailable");
   rememberBirthSession(data.sessionToken);
   setResult(data);
  }catch{
   setResult({ok:true,mode:"guide",reason:"SERVER_UNAVAILABLE"});
  }finally{setLoading(false);setRetrying(false);}
 },[]);
 useEffect(()=>{
  if(called.current)return;
  called.current=true;
  const cached=readScanResult();
  if(cached?.ok&&cached.mode){
   setResult(cached as View);
   setLoading(false);
  }else void check();
 },[check]);
 const verified=result?.mode==="verified"&&!!result?.insight?.marriagePath?.available;
 const leaning=verified?result!.insight!.marriagePath!.leaning:"unavailable";
 return <main className={"journey journey--compact-result"+(lang==="hi"?" journey--hi":"")}>
  <div className="journey__wrap">
   <header className="journey__top">
    <Link className="journey__back" href={"/birth-details?lang="+lang}>← <span>{c.back}</span></Link>
    <Link className="journey__brand" href="/"><span>✦</span> LOVORA</Link>
    <button type="button" className="journey__language" onClick={()=>setLang(lang==="en"?"hi":"en")}>{c.lang}</button>
   </header>
   <article className="lovora-result">
    <div className="lovora-result__intro">
     <p className="journey__overline">✦ {c.top}</p>
     <h1>{c.title}</h1>
     <p>{c.subtitle}</p>
    </div>
    {loading?<div className="lovora-result__waiting" role="status"><span>♡</span>{lang==="hi"?"रिज़ल्ट खोल रहे हैं…":"Opening your result…"}</div>:
    <section className="lovora-result__verdict" aria-label={verified?c.chart:c.guide}>
     <p className="lovora-result__kicker">{verified?"✦ "+c.chart:"◇ "+c.guide}</p>
     {leaning==="romance-linked"?<>
      <h2>{c.linked}</h2><p>{c.linkedSub}</p>
     </>:leaning==="undetermined"?<>
      <h2>{c.unclear}</h2><p>{c.unclearSub}</p>
     </>:<>
      <h2>{c.noData}</h2>
      <button type="button" className="lovora-result__retry" disabled={retrying} onClick={()=>void check()}>{retrying?"…":c.retry} ↻</button>
     </>}
     <p className="lovora-result__small">{c.caveat}</p>
    </section>}
    {!loading&&<>
     <section className="lovora-result__locked" aria-label={c.premium}>
      <div className="lovora-result__offer"><span>✦ {c.offer}</span><div><del>{c.oldPrice}</del><strong>₹149</strong></div></div>
      <h2>{c.unlocked}</h2>
      <p>{c.premiumIntro}</p>
      {verified?<CheckoutForm lang={lang}/>:<p className="lovora-result__notice">{c.noPay}</p>}
      <div className="lovora-result__blurred" aria-hidden="true"><span>01</span><div><b>{c.teaserOne}</b><i/></div><span>↗</span></div>
      <div className="lovora-result__blurred" aria-hidden="true"><span>02</span><div><b>{c.teaserTwo}</b><i/></div><span>↗</span></div>
      <div className="lovora-result__blurred" aria-hidden="true"><span>03</span><div><b>{c.teaserThree}</b><i/></div><span>↗</span></div>
      <Link className="lovora-result__sample" href="/report/sample">{c.preview} ↗</Link>
     </section>
     <p className="lovora-result__attribution"><a href="https://www.prokerala.com/" target="_blank" rel="noopener noreferrer">{c.powered}</a></p>
    </>}
   </article>
  </div>
 </main>;
}
export default function InsightPage(){return <Suspense fallback={<main className="journey"/>}><ResultPage/></Suspense>}
