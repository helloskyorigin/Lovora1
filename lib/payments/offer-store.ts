import "server-only";
import {redis} from "./order-store";
import {LAUNCH_REDEEMED_KEY,LAUNCH_LIMIT} from "./offer-store-key";
/** Paid orders increment the counter atomically once, in markVerifiedPaid. */
export async function getLaunchOfferClaimed():Promise<number>{
 const raw=await redis(["GET",LAUNCH_REDEEMED_KEY]);
 if(raw===null)return 0;
 const n=Number(raw);
 if(!Number.isSafeInteger(n)||n<0)throw new Error("OFFER_COUNTER_INVALID");
 return n;
}
export async function getLaunchOfferStatus(){
 const claimed=await getLaunchOfferClaimed();
 return {claimed,limit:LAUNCH_LIMIT,remaining:Math.max(0,LAUNCH_LIMIT-claimed),
  progress:Math.min(100,Math.round(claimed*100/LAUNCH_LIMIT)),
  active:claimed<LAUNCH_LIMIT,regularAvailable:!!process.env.DODO_LOVORA_REGULAR_PRODUCT_ID};
}
