import test from "node:test";
import assert from "node:assert/strict";
import {generationRetryState,MAX_GENERATION_ATTEMPTS} from "../lib/payments/retry-policy";

test("first verified purchase starts generation immediately",()=>{
 assert.equal(generationRetryState(0,0,1000),"run");
});
test("repeated checkout polls cannot rapidly drain Prokerala credits",()=>{
 assert.equal(generationRetryState(1,1000,45_999),"cooldown");
 assert.equal(generationRetryState(1,1000,46_000),"run");
 assert.equal(generationRetryState(2,1000,120_999),"cooldown");
 assert.equal(generationRetryState(2,1000,121_000),"run");
 assert.equal(generationRetryState(5,1000,21_600_999),"cooldown");
 assert.equal(generationRetryState(5,1000,21_601_000),"run");
});
test("repeated provider failures require support rather than infinite retry",()=>{
 assert.equal(MAX_GENERATION_ATTEMPTS,6);
 assert.equal(generationRetryState(6,1000,Number.MAX_SAFE_INTEGER),"needs_support");
 assert.equal(generationRetryState(-1,1000,1000),"needs_support");
});
