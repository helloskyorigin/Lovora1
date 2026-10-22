"use client";
import {FormEvent,useState} from "react";
import "./checkout.css";
import {useLaunchOffer} from "./LaunchOffer";
export function CheckoutForm({lang}:{lang:"en"|"hi"}){
 const [email,setEmail]=useState("");
 const [ack,setAck]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const {offer}=useLaunchOffer();
 const soldOut=offer?.active===false;
 const checkoutPaused=soldOut&&!offer?.regularAvailable;
 const price=soldOut?"₹299":"₹149";
 async function pay(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(!ack||busy||checkoutPaused)return;
  setBusy(true);setError("");
  try{
   const res=await fetch("/api/checkout",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,adultPayerConfirmed:ack})});
   const data=await res.json() as {ok?:boolean;checkoutUrl?:string;error?:string};
   if(!res.ok||!data.ok||!data.checkoutUrl)throw new Error(data.error||"Checkout unavailable.");
   window.location.assign(data.checkoutUrl);
  }catch(e){setError(e instanceof Error?e.message:"Could not open checkout.");setBusy(false);}
 }
 return <form onSubmit={pay} className="lovora-checkout">
  <p className="lovora-checkout__eyebrow">✦ {lang==="hi"?"एक बार का भुगतान":"ONE-TIME PURCHASE"}</p>
  {!soldOut&&<div className="lovora-checkout__old"><del>₹299</del><small>{lang==="hi"?"लॉन्च ऑफ़र · पहले 500":"LAUNCH OFFER · FIRST 500"}</small></div>}
  <div className="lovora-checkout__price">{price} <span>{lang==="hi"?"सिर्फ़ एक बार · सब्सक्रिप्शन नहीं":"once · no subscription"}</span></div>
  <label htmlFor="lovora-pay-email">{lang==="hi"?"आपकी रसीद और सहायता के लिए ईमेल":"Email for your payment receipt and support"}</label>
  <input id="lovora-pay-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" maxLength={254}/>
  <label className="lovora-checkout__ack">
   <input type="checkbox" checked={ack} onChange={e=>setAck(e.target.checked)} required/>
   <span>{lang==="hi"?"मैं भुगतान करने वाला/वाली वयस्क (18+) हूँ, स्वयं के लिए या अभिभावक के रूप में। यह निश्चित भविष्यवाणी नहीं है।":"I am 18+ and paying for myself or as a parent/guardian. This is for reflection, not a guaranteed prediction."}</span>
  </label>
  {soldOut&&<p className="lovora-checkout__error" role="status">{checkoutPaused?(lang==="hi"?"लॉन्च ऑफ़र खत्म हुआ। सामान्य मूल्य पर चेकआउट अभी उपलब्ध नहीं है।":"Launch offer is sold out; regular checkout isn't available yet."):(lang==="hi"?"पहले 500 का ऑफ़र खत्म हुआ। अब सामान्य मूल्य ₹299 है।":"Launch offer has ended. Regular price is ₹299.")}</p>}
  {error&&<p className="lovora-checkout__error" role="alert">{error}</p>}
  <button type="submit" disabled={busy||!ack||checkoutPaused} className="lovora-checkout__button">{busy?(lang==="hi"?"चेकआउट खोल रहे हैं...":"Preparing secure checkout..."):(lang==="hi"?"पूरी कहानी अनलॉक करें — "+price:"Unlock My Complete Story — "+price)} <span>↗</span></button>
  <p className="lovora-checkout__fine"><a href="/terms">Terms</a> · <a href="/privacy">Privacy</a> · <a href="/refunds">Refunds</a> · <a href="/support">Support</a></p>
  <p className="lovora-checkout__fine">{lang==="hi"?"Dodo Payments पर सुरक्षित भुगतान। भुगतान सफल होने और सत्यापन के बाद रिपोर्ट खुलेगी।":"Secure Dodo checkout. Your report unlocks only after verified successful payment."}</p>
 </form>;
}
