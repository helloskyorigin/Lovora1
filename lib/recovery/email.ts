import "server-only";

export async function sendRecoveryEmail(to:string,link:string,idempotencyToken:string):Promise<void>{
 const apiKey=process.env.RESEND_API_KEY;
 const sender=process.env.RESEND_FROM_EMAIL;
 if(!apiKey||!sender||!sender.includes("@"))throw new Error("RECOVERY_EMAIL_NOT_CONFIGURED");
 // No private birth details or report contents are sent by email.
 const res=await fetch("https://api.resend.com/emails",{
  method:"POST",cache:"no-store",signal:AbortSignal.timeout(12000),
  headers:{
   "Authorization":"Bearer "+apiKey,
   "Content-Type":"application/json",
   "User-Agent":"LOVORA/1.0",
   "Idempotency-Key":"lovora-recover-"+idempotencyToken,
  },
  body:JSON.stringify({
   from:sender,to:[to],subject:"LOVORA — your private report recovery link",
   text:"Open the secure recovery link within 15 minutes: "+link+"\n\n"+
     "The link works once and will not automatically open your report until you confirm. "+
     "If you did not request this, ignore the email.\n\nLOVORA",
   html:'<div style="max-width:520px;margin:20px auto;font-family:Georgia,serif;color:#30223e">'+
     '<h1 style="color:#6d3d69">✦ LOVORA</h1>'+
     '<h2>Your marriage story is yours to keep.</h2>'+
     '<p>Use this private link within 15 minutes. It can only be used once.</p>'+
     '<a href="'+link+'" style="display:inline-block;background:#55346c;padding:14px 20px;border-radius:8px;color:white;text-decoration:none">Recover my story</a>'+
     '<p style="font-size:12px;color:#695973;margin-top:22px">If you did not request this, you can safely ignore this email.</p></div>'
  }),
 });
 if(!res.ok)throw new Error("RECOVERY_EMAIL_DELIVERY_FAILED");
 const body=await res.json() as {id?:unknown};
 if(typeof body.id!=="string")throw new Error("RECOVERY_EMAIL_DELIVERY_FAILED");
}
