import "server-only";
import {generateAndStoreReport} from "@/lib/report/generate";
import {indexPurchasedReport} from "@/lib/recovery/store";
import {readOrder,lockFulfillment,unlockFulfillment,decodeDraft,markReadyIfPaid,recordGenerationAttempt} from "./order-store";
import {generationRetryState} from "./retry-policy";

// Only called for orders whose succeeded payment was verified against Dodo's
// API, never based on browser query parameters.
export async function fulfillPaidOrder(id:string):Promise<"ready"|"busy"|"unavailable">{
 const first=await readOrder(id);
 if(!first)return "unavailable";
 if(first.status==="ready"&&first.reportId){await indexPurchasedReport(first);return "ready";}
 if(first.status!=="paid"||!first.paymentId||!first.encryptedDraft)return "unavailable";
 const token=await lockFulfillment(id);
 if(!token)return "busy";
 try{
  const order=await readOrder(id);
  if(!order||order.status!=="paid"||!order.paymentId||!order.encryptedDraft)return "unavailable";
  const retry=generationRetryState(order.generationAttempts||0,order.lastAttemptAt||0);
  if(retry!=="run")return retry==="cooldown"?"busy":"unavailable";
  await recordGenerationAttempt(id,Date.now());
  const draft=decodeDraft(order.encryptedDraft);
  const report=await generateAndStoreReport(draft);
  const latest=await readOrder(id);
  // A refund or dispute can revoke access while report creation is in-flight.
  if(!latest||latest.status!=="paid"||latest.paymentId!==order.paymentId)return "unavailable";
  // The final state write must not race a refund or dispute webhook.
  if(!await markReadyIfPaid(id,order.paymentId,report.id))return "unavailable";
  await indexPurchasedReport({...latest,status:"ready",reportId:report.id,encryptedDraft:""});
  return "ready";
 }finally{
  await unlockFulfillment(id,token).catch(()=>undefined);
 }
}
