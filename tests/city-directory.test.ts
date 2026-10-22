import test from "node:test";
import assert from "node:assert/strict";
import {searchCities,getVerifiedPlace} from "../lib/city-directory";

test("offline city directory returns real Indian city coordinates and timezone",async()=>{
 const matches=await searchCities("Mumbai");
 assert.ok(matches.length>0);
 const city=matches.find(x=>x.country==="India"&&x.name.toLowerCase()==="mumbai");
 assert.ok(city,"Mumbai must exist in bundled directory");
 const place=await getVerifiedPlace(city.id);
 assert.equal(place.country,"India");
 assert.equal(place.timezone,"Asia/Kolkata");
 assert.ok(Number.isFinite(place.latitude)&&Number.isFinite(place.longitude));
});
test("offline directory rejects arbitrary location IDs",async()=>{
 await assert.rejects(()=>getVerifiedPlace(-1),/INVALID_CITY_ID/);
 await assert.rejects(()=>getVerifiedPlace(999999999999),/CITY_NOT_FOUND_IN_DIRECTORY/);
});
test("case insensitive search works in other countries",async()=>{
 const a=await searchCities("London");
 const b=await searchCities("london");
 assert.deepEqual(a,b);
 assert.ok(a.some(x=>x.country==="United Kingdom"));
});
