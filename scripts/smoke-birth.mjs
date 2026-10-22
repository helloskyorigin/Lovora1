/** End-to-end Next HTTP test for the form's actual POST route (CI only). */
import assert from "node:assert/strict";
const base = "http://127.0.0.1:3000";
async function jsonResponse(path,options){
 const response = await fetch(base+path,options);
 const type = response.headers.get("content-type")||"";
 assert.match(type,/application\/json/i,path+" must send JSON (not an HTML error page), HTTP "+response.status);
 return [response,await response.json()];
}
const [cityResponse,cityData]=await jsonResponse("/api/places?q=Siwan");
assert.equal(cityResponse.status,200);
const city=cityData.results.find(c=>c.name==="Siwan"&&c.country==="India");
assert.ok(city,"Must resolve Siwan from actual API");
const payload={firstName:"Preview Test",dateOfBirth:"2009-08-13",timeKnown:false,birthTime:null,
  placeId:city.id,guardianConsent:true};
const [response,body]=await jsonResponse("/api/birth-details",{
 method:"POST",headers:{"content-type":"application/json","origin":base},body:JSON.stringify(payload)
});
assert.equal(response.status,200,JSON.stringify(body));
assert.equal(body.ok,true);
const cookie=response.headers.get("set-cookie");
assert.ok(cookie?.includes("lovora_birth_draft="),"Session cookie must be issued");
assert.match(cookie,/HttpOnly/);
const [saved,stored]=await jsonResponse("/api/birth-details",{
 headers:{cookie:cookie.split(";")[0]}
});
assert.equal(saved.status,200,JSON.stringify(stored));
assert.equal(stored.draft.place.name,"Siwan");
assert.equal(stored.draft.guardianConsent,true);
const [denied,bad]=await jsonResponse("/api/birth-details",{
 method:"POST",headers:{"content-type":"application/json","origin":base},
 body:JSON.stringify({...payload,guardianConsent:false})
});
assert.equal(denied.status,400,JSON.stringify(bad));
console.log("Birth-details POST, encrypted cookie and GET are working for Siwan.");

const [crossSite,crossBody]=await jsonResponse("/api/birth-details",{
 method:"POST",headers:{"content-type":"application/json","origin":"https://attacker.example","sec-fetch-site":"cross-site"},
 body:JSON.stringify(payload)
});
assert.equal(crossSite.status,403,JSON.stringify(crossBody));

assert.equal(body.next,"/scanning");
assert.ok(typeof body.sessionToken==="string"&&body.sessionToken.split(".").length===3);
const [fromToken,tokenPayload]=await jsonResponse("/api/birth-details",{headers:{"x-lovora-birth-session":body.sessionToken}});
assert.equal(fromToken.status,200,JSON.stringify(tokenPayload));
assert.equal(tokenPayload.draft.place.name,"Siwan");
const [guide,guideResult]=await jsonResponse("/api/insight",{
 method:"POST",headers:{"content-type":"application/json","origin":base,"x-lovora-birth-session":body.sessionToken}
});
assert.equal(guide.status,200,JSON.stringify(guideResult));
assert.equal(guideResult.mode,"guide");
assert.equal(guideResult.reason,"BIRTH_TIME_REQUIRED");
assert.equal("insight" in guideResult,false,"Generic guide must not fabricate planetary positions");
const [malicious,maliciousResult]=await jsonResponse("/api/insight",{
 method:"POST",headers:{"origin":"https://attacker.example","sec-fetch-site":"cross-site","x-lovora-birth-session":body.sessionToken}
});
assert.equal(malicious.status,403,JSON.stringify(maliciousResult));
console.log("New direct birth-to-insight flow and cookie-free encrypted session path work.");

const timedPayload={...payload,timeKnown:true,birthTime:"13:40"};
const [timedResponse,timedBody]=await jsonResponse("/api/birth-details",{
 method:"POST",headers:{"content-type":"application/json","origin":base},body:JSON.stringify(timedPayload)
});
assert.equal(timedResponse.status,200,JSON.stringify(timedBody));
assert.equal(timedBody.next,"/scanning");
const [unavailablePreview,guideWhenNoRedis]=await jsonResponse("/api/insight",{
 method:"POST",headers:{"content-type":"application/json","origin":base,
  "x-lovora-birth-session":timedBody.sessionToken}
});
assert.equal(unavailablePreview.status,200,JSON.stringify(guideWhenNoRedis));
assert.equal(guideWhenNoRedis.mode,"guide",
 "If chart budget/provider is unavailable, show an honest guide rather than an error screen");
assert.equal("insight" in guideWhenNoRedis,false,"Never invent a birth chart while offline");
console.log("Prokerala/Redis offline still returns usable Love vs Arranged guide, not 503.");
