"use client";
import {useEffect,useState} from "react";

type OfferStatus={claimed:number;limit:number;remaining:number;progress:number;active:boolean};
export function useLaunchOffer(){
 const [offer,setOffer]=useState<OfferStatus|null>(null);
 useEffect(()=>{
  const controller=new AbortController();
  fetch("/api/launch-offer",{cache:"no-store",signal:controller.signal})
   .then(async r=>{
    if(!r.ok||!(r.headers.get("content-type")||"").includes("application/json"))return;
    const v=await r.json() as Partial<OfferStatus>&{ok?:boolean};
    if(v.ok===true&&typeof v.claimed==="number"&&typeof v.limit==="number"&&typeof v.progress==="number"
       &&typeof v.active==="boolean"&&Number.isSafeInteger(v.claimed)&&v.limit===500&&v.claimed>=0
       &&v.progress>=0&&v.progress<=100)
      setOffer({claimed:v.claimed,limit:v.limit,remaining:Math.max(0,500-v.claimed),progress:v.progress,active:v.active});
   }).catch(()=>undefined);
  return ()=>controller.abort();
 },[]);
 return {offer};
}
export function LaunchOffer({lang,placement}:{lang:"en"|"hi";placement:"hero"|"pricing"}){
 const {offer}=useLaunchOffer();
 return <aside className={"launch-offer launch-offer--"+placement} aria-label={lang==="hi"?"पहले 500 के लिए लॉन्च ऑफ़र":"First 500 launch offer"}>
  <div className="launch-offer__heading"><span className="launch-offer__heart" aria-hidden="true">♡</span>
   <span>{lang==="hi"?"पहली 500 प्रेम कहानियों के लिए विशेष मूल्य":"A little launch love · First 500"}</span>
  </div>
  <div className="launch-offer__price"><del>₹299</del><strong>₹149</strong><small>50% OFF</small></div>
  {offer&&<div className="launch-offer__progress">
   <div className="launch-offer__progress-label"><span>{lang==="hi"?`${offer.claimed} / 500 खरीदे गए`:`${offer.claimed} / 500 claimed`}</span>
     <strong>{offer.progress}%</strong></div>
   <div className="launch-offer__track" role="progressbar" aria-label={lang==="hi"?"वास्तविक खरीदार":"Verified purchases"} aria-valuenow={Math.min(offer.claimed,500)} aria-valuemin={0} aria-valuemax={500}>
    <div className="launch-offer__fill" style={{width:offer.progress+"%"}}/>
   </div>
  </div>}
 </aside>;
}
