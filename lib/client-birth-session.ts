/**
 * Store only an opaque, authenticated encrypted session token in this browser tab.
 * No plaintext birth fields, no payment information, and no URL query tokens.
 */
const KEY="lovora:birth-session:v1";
const ttl=24*60*60*1000;
const tokenPattern=/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/;
function store():Storage|null{
 try{return typeof window==="undefined"?null:window.sessionStorage;}catch{return null;}
}
export function forgetBirthSession():void{
 try{store()?.removeItem(KEY);}catch{}
}
export function rememberBirthSession(token:unknown):void{
 if(typeof token!=="string"||token.length>3600||!tokenPattern.test(token))return;
 try{store()?.setItem(KEY,JSON.stringify({token,until:Date.now()+ttl}));}catch{}
}
export function getBirthSessionHeaders():Record<string,string>{
 try{
  const current=store()?.getItem(KEY);
  if(!current)return {};
  const value=JSON.parse(current) as {token?:unknown;until?:unknown};
  if(typeof value.token!=="string"||!tokenPattern.test(value.token)||value.token.length>3600||
     typeof value.until!=="number"||Date.now()>value.until){
    forgetBirthSession();return {};
  }
  return {"x-lovora-birth-session":value.token};
 }catch{forgetBirthSession();return {};}
}
