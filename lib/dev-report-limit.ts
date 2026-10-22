import "server-only";
/**
 * Deliberately dev-only; the calling route rejects production requests.
 * Public endpoints use Upstash-backed cost controls in traffic-guard.ts.
 */
const windows=new Map<string,{count:number;reset:number}>();
export function allowDevReport(key:string):boolean{
 if(process.env.NODE_ENV==="production")return false;
 const now=Date.now();
 if(windows.size>100)windows.clear();
 const name=key.slice(0,100);
 const slot=windows.get(name);
 if(!slot||slot.reset<=now){
  windows.set(name,{count:1,reset:now+3600000});
  return true;
 }
 if(slot.count>=4)return false;
 slot.count++;
 return true;
}
