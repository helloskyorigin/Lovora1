"use client";
import {useEffect,useState} from "react";
import {useRegionalPrice} from "./PricingProvider";

type OfferStatus={claimed:number;limit:number;remaining:number;progress:number;active:boolean;regularAvailable?:boolean};
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
      setOffer({claimed:v.claimed,limit:v.limit,remaining:Math.max(0,500-v.claimed),progress:v.progress,active:v.active,regularAvailable:!!v.regularAvailable});
   }).catch(()=>undefined);
  return ()=>controller.abort();
 },[]);
 return {offer};
}
export function LaunchOffer({lang,placement}:{lang:"en"|"hi";placement:"hero"|"pricing"}){
 const {offer}=useLaunchOffer();
 const quote=useRegionalPrice();
 return <aside className={"launch-offer launch-offer--"+placement} aria-label={lang==="hi"?"क्षेत्रीय मूल्य":"Regional price"}>
  <div className="launch-offer__heading"><span className="launch-offer__heart" aria-hidden="true">♡</span>
   <span>{lang==="hi"?"एक रीडिंग · एक बार का भुगतान":"One reading · One-time payment"}</span>
  </div>
  <div className="launch-offer__price"><strong>{quote.label}</strong><small>{lang==="hi"?"बिना सब्सक्रिप्शन":"NO SUBSCRIPTION"}</small></div>
  {offer&&offer.claimed<500&&<div className="launch-offer__progress">
   <div className="launch-offer__progress-label"><span>{lang==="hi"?`${offer.claimed} / 500 शुरुआती खरीदार`:`${offer.claimed} / 500 early supporters`}</span>
     <strong>{offer.progress}%</strong></div>
   <div className="launch-offer__track" role="progressbar" aria-label={lang==="hi"?"वास्तविक खरीदार":"Verified purchases"} aria-valuenow={Math.min(offer.claimed,500)} aria-valuemin={0} aria-valuemax={500}>
    <div className="launch-offer__fill" style={{width:offer.progress+"%"}}/>
   </div>
  </div>}
 </aside>;
}
