// Short-lived browser-tab copy of the free scan result, no birth data or payment entitlements.
const KEY="lovora:scan:v1";
type Result={ok?:boolean;mode?:"verified"|"guide";insight?:unknown;sessionToken?:string;reason?:string};
export function rememberScanResult(value:Result):void{
 try{
  if(typeof window==="undefined")return;
  const safe={ok:value.ok,mode:value.mode,reason:value.reason,insight:value.insight};
  window.sessionStorage.setItem(KEY,JSON.stringify({value:safe,expires:Date.now()+10*60_000}));
 }catch{}
}
export function forgetScanResult():void{
 try{if(typeof window!=="undefined")window.sessionStorage.removeItem(KEY);}catch{}
}
export function readScanResult():Result|null{
 try{
  if(typeof window==="undefined")return null;
  const raw=window.sessionStorage.getItem(KEY);
  if(!raw)return null;
  const record=JSON.parse(raw) as {value:Result;expires:number};
  if(record?.expires>Date.now()&&record.value?.ok===true)return record.value;
  forgetScanResult();return null;
 }catch{return null;}
}
