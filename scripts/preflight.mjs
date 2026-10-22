/**
 * Readiness preflight: no network, no charge, no secret values printed.
 * Run: npm run preflight (Node 22; loads .env.local when available).
 */
const p=process.env;
const core=["BIRTH_SESSION_SECRET","PROKERALA_CLIENT_ID","PROKERALA_CLIENT_SECRET",
 "UPSTASH_REDIS_REST_URL","UPSTASH_REDIS_REST_TOKEN","REPORT_ENCRYPTION_SECRET"];
const payment=["DODO_PAYMENTS_API_KEY","DODO_LOVORA_PRODUCT_ID","DODO_PAYMENTS_WEBHOOK_KEY",
 "LOVORA_OPERATOR_NAME","LOVORA_SUPPORT_EMAIL","LOVORA_BASE_URL"];
const recovery=["RESEND_API_KEY","RESEND_FROM_EMAIL"];
const enabled=p.LOVORA_PAYMENTS_ENABLED==="true";
let problems=0;
function result(label,pass,needed=true){
 console.log((pass?"OK ":""+(needed?"BLOCK ":"TODO "))+label);
 if(!pass&&needed)problems++;
}
for(const name of core)result(name,!!p[name]?.trim());
for(const name of payment)result(name,!!p[name]?.trim(),enabled);
for(const name of recovery)result(name,!!p[name]?.trim(),enabled);
result("BIRTH_SESSION_SECRET length >=32",!!p.BIRTH_SESSION_SECRET&&p.BIRTH_SESSION_SECRET.length>=32);
result("REPORT_ENCRYPTION_SECRET length >=32",!!p.REPORT_ENCRYPTION_SECRET&&p.REPORT_ENCRYPTION_SECRET.length>=32);
const address=p.LOVORA_BASE_URL;
let originValid=false;
try{
 if(address){
  const url=new URL(address);
  originValid=!url.username&&!url.password&&url.pathname==="/"&&!url.search&&!url.hash&&(
   url.protocol==="https:"||(p.NODE_ENV!=="production"&&url.origin==="http://localhost:3000"));
 }
}catch{}
result("LOVORA_BASE_URL valid HTTPS or local development",originValid,enabled);
result("Dodo mode configured",["test_mode","live_mode"].includes(p.DODO_PAYMENTS_ENVIRONMENT||""),enabled);
if(enabled&&p.DODO_PAYMENTS_ENVIRONMENT==="live_mode"){
 result("Production origin is HTTPS",!!address?.startsWith("https://"));
}
for(const [key,defaultValue] of [["LOVORA_FREE_CHARTS_PER_DAY",100],["LOVORA_PLACES_PER_DAY",900],["LOVORA_BIRTH_VERIFICATIONS_PER_DAY",250]]){
 const value=p[key]===undefined||p[key]===""?defaultValue:Number(p[key]);
 result(key+" valid (1..5000)",Number.isSafeInteger(value)&&value>=1&&value<=5000);
}
console.log("Payments enabled:",enabled?"YES (requires separate merchant and sandbox verification)":"NO (safe default)");
console.log("No provider APIs, Dodo charges, or emails were contacted during this check.");
process.exitCode=problems?1:0;
