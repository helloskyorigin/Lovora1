/** Compare browser origin to proxy-visible Host as well as internal Next request URL. */
type OriginRequest=Pick<Request,"url"|"headers">;
function safeHost(value:string|null):string|null {
 if(!value||value.length>255||value.includes(",")||value.includes("/")||value.includes("@")||/\s/.test(value))return null;
 try{const u=new URL("http://"+value);return u.host.toLowerCase()===value.toLowerCase()?u.host.toLowerCase():null;}catch{return null;}
}
const loopback=(h:string)=>h==="localhost"||h==="127.0.0.1"||h==="[::1]";
export function isSameOriginRequest(req:OriginRequest):boolean {
 if(req.headers.get("sec-fetch-site")==="cross-site")return false;
 const raw=req.headers.get("origin");
 if(!raw)return true;
 let client:URL,internal:URL;
 try{client=new URL(raw);internal=new URL(req.url);}catch{return false;}
 if(client.origin!==raw||!["https:","http:"].includes(client.protocol))return false;
 if(client.origin===internal.origin)return true;
 const hosts=[req.headers.get("host"),req.headers.get("x-forwarded-host")].map(safeHost);
 if(hosts.includes(client.host.toLowerCase()))return true;
 return loopback(client.hostname)&&loopback(internal.hostname)&&client.protocol===internal.protocol&&client.port===internal.port;
}
