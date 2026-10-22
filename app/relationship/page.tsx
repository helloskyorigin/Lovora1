"use client";
import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import "../journey.css";

type Status = "single" | "dating" | "relationship" | "engaged" | "private";
type Interest = "path" | "timing" | "partner";
type Lang = "en" | "hi";

const copy = {
  en: {
    back:"Birth details", step:"CHAPTER 02 / YOUR HEART",
    title:"Tell us about",accent:"your heart.",desc:"Two little questions to make your reading feel like yours.",
    one:"Where are you in your story?",two:"What are you most curious about?",
    statuses:[["single","Single","✧"],["dating","Dating someone","♡"],["relationship","In a relationship","♥"],["engaged","Engaged","✦"],["private","Prefer not to say","☾"]] as const,
    interests:[["path","Love marriage or arranged?","♡"],["timing","Traditional marriage timing","◷"],["partner","What could my future partner be like?","✦"]] as const,
    button:"Discover my free insight",loading:"Saving your choices...",footer:"Your answers shape the focus, not the planetary calculations.",lang:"हिंदी",
    error:"Unable to save your choices. Try again.", expired:"Your birth session has expired. Please enter your details again.",
  },
  hi: {
    back:"जन्म विवरण",step:"अध्याय 02 / आपका दिल",title:"थोड़ी बात",accent:"दिल की।",desc:"बस दो छोटे सवाल, ताकि रीडिंग आपके सवाल से जुड़ी हो।",
    one:"अभी आपके रिश्ते का क्या हाल है?",two:"आप क्या जानने के लिए उत्सुक हैं?",
    statuses:[["single","सिंगल","✧"],["dating","किसी को डेट कर रहे हैं","♡"],["relationship","रिश्ते में हैं","♥"],["engaged","सगाई हो चुकी है","✦"],["private","नहीं बताना चाहते","☾"]] as const,
    interests:[["path","लव मैरिज या अरेंज?","♡"],["timing","विवाह का पारंपरिक समय","◷"],["partner","भविष्य के साथी के संकेत","✦"]] as const,
    button:"मेरी मुफ़्त झलक दिखाएँ",loading:"आपके जवाब सेव हो रहे हैं...",footer:"ये उत्तर रीडिंग का विषय तय करते हैं, ग्रहों की गणना नहीं।",lang:"English",
    error:"उत्तर सेव नहीं हो पाए। फिर कोशिश करें।",expired:"जन्म विवरण का सेशन समाप्त हो गया। कृपया दोबारा भरें।",
  },
} as const;

function RelationshipForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [lang,setLang] = useState<Lang>(params.get("lang")==="hi"?"hi":"en");
  const [status,setStatus] = useState<Status | null>(null);
  const [interest,setInterest] = useState<Interest>("path");
  const [busy,setBusy] = useState(false);
  const [checking,setChecking] = useState(true);
  const [valid,setValid] = useState(false);
  const [error,setError] = useState("");
  const c=copy[lang];
  useEffect(()=>{
    const controller = new AbortController();
    fetch("/api/birth-details",{cache:"no-store",signal:controller.signal}).then(r=>{if(!controller.signal.aborted)setValid(r.ok);})
      .catch(()=>{if(!controller.signal.aborted)setValid(false);})
      .finally(()=>{if(!controller.signal.aborted)setChecking(false);});
    return ()=>controller.abort();
  },[]);
  async function onSubmit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    if (!status || busy) return;
    setBusy(true);setError("");
    try {
      const response=await fetch("/api/relationship",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({status,interest})});
      const value=await response.json() as {ok?:boolean;error?:string};
      if(!response.ok||!value.ok)throw new Error(value.error||c.error);
      router.push("/insight?lang="+lang);
    } catch(e){setError(e instanceof Error?e.message:c.error);setBusy(false);}
  }
  return <main className={"journey"+(lang==="hi"?" journey--hi":"")}>
    <div className="journey__wrap"><header className="journey__top">
      <Link className="journey__back" href={"/birth-details?lang="+lang}><span aria-hidden="true">←</span>{c.back}</Link>
      <Link href="/" className="journey__brand"><span>✦</span> LOVORA</Link>
      <button className="journey__language" type="button" onClick={()=>setLang(lang==="en"?"hi":"en")}>{c.lang}</button>
    </header>
    <div className="journey__grid"><section>
      <p className="journey__overline">{c.step}</p>
      <div className="journey__celestial" aria-hidden="true"><i className="journey__ring"/><i className="journey__ring journey__ring--alt"/><span className="journey__heart">♥</span><span className="journey__star">✦</span><span className="journey__star journey__star--two">✧</span></div>
      <h1 className="journey__title">{c.title}<em>{c.accent}</em></h1>
      <p className="journey__description">{c.desc}</p>
    </section>
    <section className="journey__panel">
      <div className="journey__counter"><b className="is-complete"/><b className="is-complete"/><b/></div>
      {checking?<p className="journey__note" role="status">Checking your birth details...</p>:
      !valid?<><div className="journey__error" role="alert">{c.expired}</div><Link className="journey__button" href={"/birth-details?lang="+lang}>{c.back} ↗</Link></>:
      <form onSubmit={onSubmit}>
        <fieldset className="journey__question" style={{border:0,padding:0}}><legend className="journey__field-label">{c.one}</legend>
          <div className="journey__options">
            {c.statuses.map(([id,label,symbol])=><button key={id} type="button" className={"journey__option"+(status===id?" is-selected":"")} onClick={()=>setStatus(id)} aria-pressed={status===id}>
              <span className="journey__option-symbol">{symbol}</span><span className="journey__option-label">{label}</span>{status===id&&<span className="journey__option-check">✓</span>}
            </button>)}
          </div>
        </fieldset>
        <fieldset className="journey__question" style={{border:0,padding:0}}><legend className="journey__field-label">{c.two}</legend>
          <div className="journey__options journey__options--topics">
            {c.interests.map(([id,label,symbol])=><button key={id} type="button" className={"journey__option"+(interest===id?" is-selected":"")} onClick={()=>setInterest(id)} aria-pressed={interest===id}>
              <span className="journey__option-symbol">{symbol}</span><span className="journey__option-label">{label}</span>{interest===id&&<span className="journey__option-check">✓</span>}
            </button>)}
          </div>
        </fieldset>
        {error&&<div className="journey__error" role="alert">{error}</div>}
        <button className="journey__button" disabled={!status||busy} type="submit">{busy?c.loading:c.button} <span>↗</span></button>
        <p className="journey__note">{c.footer}</p>
      </form>}
    </section></div></div>
    <footer className="journey__footer">LOVORA · Traditional astrology for personal reflection</footer>
  </main>;
}
export default function RelationshipPage(){return <Suspense fallback={<main className="journey"/>}><RelationshipForm/></Suspense>;}
