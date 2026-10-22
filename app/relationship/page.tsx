"use client";
import {Suspense,useEffect} from "react";
import {useRouter,useSearchParams} from "next/navigation";
import Link from "next/link";
import "../journey.css";
function RemovedStep(){
 const params=useSearchParams();
 const router=useRouter();
 const lang=params.get("lang")==="hi"?"hi":"en";
 useEffect(()=>{router.replace("/insight?lang="+lang);},[router,lang]);
 return <main className="journey"><div className="journey__wrap" style={{paddingTop:90,textAlign:"center"}}>
  <p className="journey__overline">✦ LOVORA</p>
  <h1 className="journey__title">{lang==="hi"?"आपकी कहानी":"Your love story"}<em>{lang==="hi"?"तैयार है।":"is next."}</em></h1>
  <p className="journey__description">{lang==="hi"?"अतिरिक्त सवाल हटा दिए गए हैं।":"No more questions required."}</p>
  <Link className="journey__button" href={"/insight?lang="+lang}>{lang==="hi"?"रिज़ल्ट देखें ↗":"See your result ↗"}</Link>
 </div></main>;
}
export default function RelationshipPage(){return <Suspense fallback={<main className="journey"/>}><RemovedStep/></Suspense>}
