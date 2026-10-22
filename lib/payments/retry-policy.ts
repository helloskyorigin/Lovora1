/**
 * Paid report retries must not hammer the paid astrology provider every 5s
 * while a customer polls the checkout return page.
 */
export const MAX_GENERATION_ATTEMPTS=6;
const delaysMs=[0,45_000,2*60_000,10*60_000,60*60_000,6*60*60_000] as const;
export function generationRetryState(attempts:number,lastAttemptAt:number,now=Date.now()):"run"|"cooldown"|"needs_support"{
 if(!Number.isSafeInteger(attempts)||attempts<0||!Number.isFinite(lastAttemptAt)||lastAttemptAt<0)return "needs_support";
 if(attempts>=MAX_GENERATION_ATTEMPTS)return "needs_support";
 if(attempts===0)return "run";
 return now>=lastAttemptAt+delaysMs[attempts]?"run":"cooldown";
}
