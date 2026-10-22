"use client";
import {useEffect,useRef,useState} from "react";
import {CheckoutForm} from "@/components/CheckoutForm";

type Lang="en"|"hi";
export function ResultChoiceModal({lang,verified,onFree,onVerify}:{lang:Lang;verified:boolean;onFree:()=>void;onVerify:()=>Promise<boolean>}){
 const [step,setStep]=useState<"choose"|"paid">("choose");
 const [verifying,setVerifying]=useState(false);
 const [checked,setChecked]=useState(false);
 async function openPaid(){
  setStep("paid");
  if(!verified&&!checked){
   setVerifying(true);
   setChecked(true);
   try{await onVerify();}finally{setVerifying(false);}
  }
 }
 const primary=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  primary.current?.focus();
  const onKey=(event:KeyboardEvent)=>{
   if(event.key==="Escape"){event.preventDefault();onFree();}
  };
  document.addEventListener("keydown",onKey);
  const old=document.body.style.overflow;
  document.body.style.overflow="hidden";
  return ()=>{document.removeEventListener("keydown",onKey);document.body.style.overflow=old;};
 },[onFree]);
 const hi=lang==="hi";
 return <div className="lovora-choice-backdrop">
  <section className="lovora-choice" role="dialog" aria-modal="true" aria-labelledby="lovora-choice-heading" aria-describedby="lovora-choice-desc">
   <p className="lovora-choice__eyebrow">✦ LOVORA · {hi?"आपकी प्रेम कहानी":"YOUR LOVE STORY"}</p>
   {step==="choose"?<>
    <div className="lovora-choice__ornament" aria-hidden="true">♡</div>
    <h2 id="lovora-choice-heading">{hi?"कहानी आगे बढ़ाएँ।":"Your story starts here."}</h2>
    <p id="lovora-choice-desc">{hi?"अपनी मुफ़्त झलक देखें या ₹149 में पूरी सात-अध्याय कहानी खोलें।":"Discover your first insight for free, or explore your complete seven-chapter story."}</p>
    <button type="button" ref={primary} className="lovora-choice__free" onClick={onFree}>
     <strong>{hi?"मुफ़्त झलक देखें":"Continue with Free"}</strong>
     <span>{hi?"आपके लिए पहला संकेत":"Your first personal insight"} <span aria-hidden="true">↗</span></span>
    </button>
    <button type="button" className="lovora-choice__premium" onClick={()=>void openPaid()}>
     <strong>{hi?"पूरी कहानी अनलॉक करें":"Unlock Full Story"} · ₹149 <del>₹299</del></strong>
     <span>{hi?"7 अध्याय · एक बार का भुगतान":"7 chapters · one-time payment"} <span aria-hidden="true">↗</span></span>
    </button>
    <p className="lovora-choice__fine">{hi?"वास्तविक जन्म-कुंडली पर आधारित, निश्चित भविष्यवाणी नहीं।":"Traditional birth-chart interpretation for reflection, not a guaranteed prediction."}</p>
   </>:<>
    <button ref={primary} type="button" className="lovora-choice__back" onClick={()=>setStep("choose")}>← {hi?"विकल्प वापस":"Back to options"}</button>
    <h2 id="lovora-choice-heading">{hi?"आपकी पूरी कहानी":"Your complete story"}</h2>
    <p id="lovora-choice-desc">{hi?"एक सुरक्षित भुगतान के बाद सात अध्याय, कुंडली के प्रमाण और PDF।":"Seven chapters, chart evidence and a PDF keepsake after verified payment."}</p>
    {verified?<CheckoutForm lang={lang}/>:verifying?<div className="lovora-choice__hold" role="status">
     <p>{hi?"आपकी वास्तविक कुंडली की जानकारी सुरक्षित रूप से जाँची जा रही है…":"Securely checking the real chart before opening payment…"}</p>
    </div>:<div className="lovora-choice__hold" role="status">
     <p>{hi?"आपकी वास्तविक कुंडली अभी सत्यापित नहीं हो सकी। जब तक रिपोर्ट तैयार करने के लिए आवश्यक गणना उपलब्ध नहीं होगी, हम भुगतान नहीं लेंगे।":"Your chart calculation isn't verified yet. We won't charge you for a report we can't currently create."}</p>
     <button type="button" onClick={onFree}>{hi?"मुफ़्त झलक देखें":"See free exploration"} ↗</button>
    </div>}
   </>}
  </section>
 </div>;
}
