import test from "node:test";
import assert from "node:assert/strict";
import {resolveBirthUTC} from "../lib/birth-time";

test("historic birth time uses birthplace timezone rather than today's offset",()=>{
 assert.equal(resolveBirthUTC("2000-01-01","12:00","Asia/Kolkata").toISOString(),"2000-01-01T06:30:00.000Z");
 assert.equal(resolveBirthUTC("2000-06-01","12:00","America/New_York").toISOString(),"2000-06-01T16:00:00.000Z");
});
test("nonexistent DST times cannot silently shift paid readings",()=>{
 assert.throws(()=>resolveBirthUTC("2020-03-08","02:30","America/New_York"),/AMBIGUOUS_BIRTH_TIME/);
 assert.equal(resolveBirthUTC("2020-03-08","03:30","America/New_York").toISOString(),"2020-03-08T07:30:00.000Z");
});
test("repeated DST time has two possible instants and must be rejected",()=>{
 assert.throws(()=>resolveBirthUTC("2020-11-01","01:30","America/New_York"),/AMBIGUOUS_BIRTH_TIME/);
 assert.equal(resolveBirthUTC("2020-11-01","02:30","America/New_York").toISOString(),"2020-11-01T07:30:00.000Z");
});
test("invalid birth dates and timezone names fail closed",()=>{
 assert.throws(()=>resolveBirthUTC("2020-02-30","12:00","Asia/Kolkata"),/INVALID_BIRTH_TIME/);
 assert.throws(()=>resolveBirthUTC("2000-01-01","12:00","Mars/Olympus"),/UNSUPPORTED_BIRTH_TIMEZONE/);
});
