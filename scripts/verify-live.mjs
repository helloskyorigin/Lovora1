/**
 * Read-only production diagnostics. Never performs checkout, charges a card,
 * sends emails, or prints credentials. Run locally with protected .env.local.
 */
const e=process.env;
const report=[];
async function check(name,fn){
 try{const detail=await fn();report.push({name,status:"PASS",detail});}
 catch(err){report.push({name,status:"FAIL",detail:err instanceof Error?err.message:"Unavailable"});}
}
const required=["BIRTH_SESSION_SECRET","REPORT_ENCRYPTION_SECRET","PROKERALA_CLIENT_ID","PROKERALA_CLIENT_SECRET","UPSTASH_REDIS_REST_URL","UPSTASH_REDIS_REST_TOKEN","DODO_PAYMENTS_API_KEY","DODO_LOVORA_PRODUCT_ID","DODO_PAYMENTS_WEBHOOK_KEY","LOVORA_BASE_URL","RESEND_API_KEY","RESEND_FROM_EMAIL","LOVORA_OPERATOR_NAME","LOVORA_SUPPORT_EMAIL"];
await check("Configured secrets",()=>{
 const missing=required.filter(k=>!e[k]?.trim());
 if(missing.length)throw Error("Missing: "+missing.join(", "));
 if(e.BIRTH_SESSION_SECRET.length<32||e.REPORT_ENCRYPTION_SECRET.length<32)throw Error("Encryption secrets must be 32+ chars");
 return "Required variables present";
});
await check("Live-only switch",()=>{
 if(e.DODO_PAYMENTS_ENVIRONMENT!=="live_mode")throw Error("DODO_PAYMENTS_ENVIRONMENT must be live_mode");
 if(e.LOVORA_PAYMENTS_ENABLED!=="true")throw Error("LOVORA_PAYMENTS_ENABLED must be true when activation is authorized");
 const origin=new URL(e.LOVORA_BASE_URL);
 if(origin.protocol!=="https:"||origin.pathname!=="/"||origin.username||origin.password||origin.search||origin.hash)throw Error("Invalid HTTPS LOVORA_BASE_URL origin");
 return "Live environment selected; operator must still verify merchant approval";
});
await check("Upstash Redis",async()=>{
 const r=await fetch(e.UPSTASH_REDIS_REST_URL.replace(/\/+$/,""),{
  method:"POST",signal:AbortSignal.timeout(8000),headers:{"Authorization":"Bearer "+e.UPSTASH_REDIS_REST_TOKEN,"Content-Type":"application/json"},
  body:JSON.stringify(["PING"])
 });
 if(!r.ok)throw Error("Redis endpoint returned HTTP "+r.status);
 const j=await r.json();if(j.result!=="PONG")throw Error("Redis PING failed");
 return "Authenticated Redis PING succeeded";
});
await check("Prokerala OAuth",async()=>{
 const r=await fetch("https://api.prokerala.com/token",{
  method:"POST",signal:AbortSignal.timeout(8000),headers:{"Content-Type":"application/x-www-form-urlencoded"},
  body:new URLSearchParams({grant_type:"client_credentials",client_id:e.PROKERALA_CLIENT_ID,client_secret:e.PROKERALA_CLIENT_SECRET}),
 });
 if(!r.ok)throw Error("OAuth HTTP "+r.status);
 const body=await r.json();if(!body.access_token)throw Error("OAuth access token missing");
 return "Credentials authenticated; paid astrology request not executed";
});
await check("Dodo live product",async()=>{
 const id=e.DODO_LOVORA_PRODUCT_ID;
 if(!/^pdt_[A-Za-z0-9]+$/.test(id))throw Error("Invalid live product ID");
 const r=await fetch("https://live.dodopayments.com/products/"+encodeURIComponent(id),{
  signal:AbortSignal.timeout(10000),headers:{"Authorization":"Bearer "+e.DODO_PAYMENTS_API_KEY}
 });
 if(!r.ok)throw Error("Live product lookup HTTP "+r.status);
 const d=await r.json();
 if(d.product_id!==id||d.is_recurring!==false||d.price?.type!=="one_time_price"||d.price?.currency!=="INR"||d.price?.price!==29900||d.price?.tax_inclusive!==true)throw Error("Product must be INR 299 one-time and tax inclusive");
 return "Live Dodo product verified as one-time INR 299";
});
console.table(report);
console.log("NOT TESTED: actual charges, webhook delivery, successful report unlocking, historical timezone quality, Resend delivery, merchant approval.");
if(report.some(x=>x.status==="FAIL"))process.exitCode=1;
