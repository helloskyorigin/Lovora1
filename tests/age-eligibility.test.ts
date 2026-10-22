import test from "node:test";
import assert from "node:assert/strict";
import {isEligibleBirthDate,isMinorBirthDate,validateBirthInput} from "../lib/birth";
const now=new Date("2026-10-22T10:00:00Z");
test("ages 14-110 boundaries are correct",()=>{
 assert.equal(isEligibleBirthDate("2012-10-22",now),true);
 assert.equal(isEligibleBirthDate("2012-10-23",now),false);
 assert.equal(isEligibleBirthDate("2008-10-22",now),true);
 assert.equal(isMinorBirthDate("2008-10-22",now),false);
 assert.equal(isMinorBirthDate("2009-08-13",now),true);
 assert.equal(isEligibleBirthDate("2012-02-30",now),false);
 assert.equal(isEligibleBirthDate("1916-10-22",now),true);
 assert.equal(isEligibleBirthDate("1916-10-21",now),false);
});
test("backend requires parent acknowledgement for minors",()=>{
 const now=new Date(),birth=new Date(Date.UTC(now.getUTCFullYear()-16,now.getUTCMonth(),now.getUTCDate())).toISOString().slice(0,10);
 const draft={dateOfBirth:birth,timeKnown:true,birthTime:"14:12",placeId:9};
 const blocked=validateBirthInput(draft);assert.equal(blocked.ok,false);
 const allowed=validateBirthInput({...draft,guardianConsent:true});assert.equal(allowed.ok,true);
 if(allowed.ok)assert.equal(allowed.data.guardianConsent,true);
});
