"use client";

import {useEffect,useRef,useState} from "react";
import type {MarriageStoryReport} from "@/lib/report/types";
import type {ReportLanguage} from "@/lib/report/localize";
import {buildShareCopy,STORY_PUBLIC_URL} from "@/lib/report/share-copy";

type Props={
 report:MarriageStoryReport;
 lang:ReportLanguage;
 demo:boolean;
 onClose:()=>void;
};

function drawCard(copy:ReturnType<typeof buildShareCopy>):HTMLCanvasElement{
 const canvas=document.createElement("canvas");
 canvas.width=1080;
 canvas.height=1920;
 const context=canvas.getContext("2d");
 if(!context)throw new Error("Your browser cannot create a story image.");
 const ctx:CanvasRenderingContext2D=context;
 const w=canvas.width,h=canvas.height;
 const background=ctx.createLinearGradient(0,0,w,h);
 background.addColorStop(0,"#21122f");
 background.addColorStop(.48,"#563167");
 background.addColorStop(1,"#170d2a");
 ctx.fillStyle=background;ctx.fillRect(0,0,w,h);
 const glow=ctx.createRadialGradient(540,780,10,540,780,650);
 glow.addColorStop(0,"#ae76b65a");
 glow.addColorStop(1,"#ae76b600");
 ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
 ctx.strokeStyle="#ecc6a780";
 ctx.lineWidth=3;
 ctx.strokeRect(44,44,w-88,h-88);
 const stars=[[145,340],[885,370],[250,620],[798,1120],[180,1530],[910,1490],[160,1050],[860,720],[300,1700]];
 for(const [x,y] of stars){
  ctx.fillStyle="#f6d7b4";
  ctx.font="38px Georgia";ctx.textAlign="center";ctx.fillText("✧",x,y);
 }
 ctx.textAlign="center";
 ctx.fillStyle="#edc99b";ctx.font="600 26px Arial";
 ctx.fillText("✦   L O V O R A   ✦",w/2,165);
 ctx.save();ctx.translate(w/2,770);ctx.rotate(-.34);
 ctx.strokeStyle="#e8b991b5";ctx.lineWidth=3;
 ctx.beginPath();ctx.ellipse(0,0,345,125,0,0,Math.PI*2);ctx.stroke();
 ctx.restore();
 ctx.save();ctx.translate(w/2,770);ctx.rotate(.75);
 ctx.strokeStyle="#d4b1dda8";ctx.lineWidth=3;
 ctx.beginPath();ctx.ellipse(0,0,290,105,0,0,Math.PI*2);ctx.stroke();
 ctx.restore();
 ctx.fillStyle="#f0c6da";ctx.font="270px Georgia";ctx.fillText("☾",w/2,850);
 function wrap(text:string,maxWidth:number,font:string):string[]{
  ctx.font=font;
  const words=text.split(/\s+/).filter(Boolean);
  const lines:string[]=[];let current="";
  for(const word of words){
   const candidate=current?current+" "+word:word;
   if(ctx.measureText(candidate).width>maxWidth&&current){lines.push(current);current=word;}
   else current=candidate;
  }
  if(current)lines.push(current);
  return lines;
 }
 const headingFont="500 104px Georgia";
 ctx.fillStyle="#fff1e6";
 const headingLines=wrap(copy.title,900,headingFont).slice(0,4);
 ctx.font=headingFont;
 let headingY=1150;
 for(const line of headingLines){ctx.fillText(line,w/2,headingY);headingY+=115;}
 ctx.fillStyle="#f2c8a8";ctx.font="italic 40px Georgia";
 ctx.fillText(copy.subtitle,w/2,headingY+32);
 if(copy.theme){
  ctx.strokeStyle="#ead1c871";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(170,headingY+115);ctx.lineTo(910,headingY+115);ctx.stroke();
  ctx.fillStyle="#f8dfec";
  const lines=wrap(copy.theme,840,"500 42px Arial").slice(0,3);
  ctx.font="500 42px Arial";
  let y=headingY+193;
  for(const line of lines){ctx.fillText(line,w/2,y);y+=65;}
 }
 ctx.font="500 28px Arial";
 ctx.fillStyle="#dfc4dc";
 ctx.fillText(copy.footer,w/2,1690);
 ctx.font="600 28px Arial";
 ctx.fillStyle="#edd0a8";
 ctx.fillText("lovora.ai.studio",w/2,1770);
 if(copy.demo){
  ctx.fillStyle="#dfcfb2";ctx.font="bold 26px Arial";
  ctx.fillText("ILLUSTRATIVE SAMPLE · NOT PERSONAL DATA",w/2,1835);
 }
 return canvas;
}
function getPng(canvas:HTMLCanvasElement):Promise<Blob>{
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("Couldn't prepare the story image.")),"image/png"));
}

export function ShareStoryModal({report,lang,demo,onClose}:Props){
 const [includeTheme,setIncludeTheme]=useState(false);
 const [busy,setBusy]=useState(false);
 const [status,setStatus]=useState("");
 const closeRef=useRef<HTMLButtonElement>(null);
 const hi=lang==="hi";
 const copy=buildShareCopy({language:lang,includeTheme,theme:report.marriagePath.headline,demo});
 useEffect(()=>{
  closeRef.current?.focus();
  const key=(event:KeyboardEvent)=>{if(event.key==="Escape")onClose();};
  document.addEventListener("keydown",key);
  return ()=>document.removeEventListener("keydown",key);
 },[onClose]);
 async function download(){
  setBusy(true);setStatus("");
  try{
   const png=await getPng(drawCard(copy));
   const url=URL.createObjectURL(png);
   const a=document.createElement("a");
   a.href=url;a.download=demo?"LOVORA-sample-story.png":"LOVORA-my-story.png";
   document.body.appendChild(a);a.click();a.remove();
   window.setTimeout(()=>URL.revokeObjectURL(url),1000);
   setStatus(hi?"स्टोरी कार्ड डाउनलोड हो गया।":"Your story card has been downloaded.");
  }catch(error){setStatus(error instanceof Error?error.message:"Unable to create story image.");}
  finally{setBusy(false);}
 }
 async function share(){
  setBusy(true);setStatus("");
  try{
   const png=await getPng(drawCard(copy));
   const file=new File([png],demo?"LOVORA-sample.png":"LOVORA-story.png",{type:"image/png"});
   if(typeof navigator.share==="function"){
    if(typeof navigator.canShare==="function"&&navigator.canShare({files:[file]})){
     await navigator.share({title:"LOVORA · My Story",files:[file]});
    }else{
     await navigator.share({title:"LOVORA",text:copy.message,url:STORY_PUBLIC_URL});
     setStatus(hi?"इस डिवाइस पर इमेज शेयर नहीं हो सकी; LOVORA लिंक शेयर किया गया।":"Image sharing wasn't available here, so the LOVORA link was shared.");
    }
   }else if(navigator.clipboard?.writeText){
    await navigator.clipboard.writeText(STORY_PUBLIC_URL);
    setStatus(hi?"शेयर करने के लिए LOVORA लिंक कॉपी हुआ।":"LOVORA link copied. You can share it anywhere.");
   }else{
    setStatus(hi?"इस ब्राउज़र में शेयर का विकल्प नहीं है। PNG डाउनलोड करें।":"Sharing isn't available here. Download the PNG instead.");
   }
  }catch(error){
   if(error instanceof Error&&error.name!=="AbortError")
    setStatus(hi?"शेयर नहीं हुआ। PNG डाउनलोड करके भेजें।":"Couldn't share. Download the PNG and send it instead.");
  }finally{setBusy(false);}
 }
 return <div className="report-share-overlay" onMouseDown={event=>{if(event.target===event.currentTarget)onClose();}}>
  <section className="report-share-dialog" role="dialog" aria-modal="true" aria-labelledby="lovora-share-title">
   <button ref={closeRef} type="button" className="report-share-dialog__close" onClick={onClose} aria-label={hi?"बंद करें":"Close"}>×</button>
   <p className="report-share-dialog__eyebrow">✦ LOVORA · {hi?"शेयर करने का कार्ड":"YOUR SHARE CARD"}</p>
   <h2 id="lovora-share-title">{hi?"अपनी कहानी शेयर करें":"A little love, worth sharing."}</h2>
   <p className="report-share-dialog__intro">{hi?"इंस्टाग्राम स्टोरी या WhatsApp के लिए एक खूबसूरत, निजी कार्ड।":"A beautiful story-sized card for WhatsApp or Instagram, without exposing your private report."}</p>
   <div className="report-share-preview" aria-label={hi?"शेयर होने वाले कार्ड की झलक":"Preview of card content"}>
    <span className="report-share-preview__brand">✦ LOVORA</span>
    <span className="report-share-preview__orb" aria-hidden="true">☾</span>
    <span className="report-share-preview__title">{copy.title}</span>
    <span className="report-share-preview__detail">{copy.theme||copy.subtitle}</span>
    <span className="report-share-preview__url">lovora.ai.studio{demo?" · SAMPLE":""}</span>
   </div>
   {!demo&&<label className="report-share-consent">
    <input type="checkbox" checked={includeTheme} onChange={event=>setIncludeTheme(event.target.checked)}/>
    <span>{hi?"कार्ड पर मेरी रीडिंग की मुख्य थीम भी दिखाएँ (निजी संकेत हो सकता है)":"Include my reading's main theme on the card (may reveal personal insight)"}</span>
   </label>}
   <p className="report-share-dialog__privacy">{hi?"आपका नाम, जन्मतिथि, जन्मस्थान, कुंडली विवरण और पूरी खरीदी रिपोर्ट शेयर नहीं होगी। कोई सार्वजनिक रिपोर्ट लिंक नहीं बनेगा।":"Your name, birth date, birthplace, chart details and full paid report are never included. This does not create a public report link."}</p>
   <div className="report-share-dialog__buttons">
    <button type="button" disabled={busy} onClick={()=>void share()}>{busy?(hi?"तैयार हो रहा है…":"Preparing…"):(hi?"शेयर करें ↗":"Share card ↗")}</button>
    <button type="button" disabled={busy} onClick={()=>void download()}>{hi?"PNG डाउनलोड ↓":"Download PNG ↓"}</button>
   </div>
   {status&&<p className="report-share-dialog__status" role="status">{status}</p>}
  </section>
 </div>;
}
