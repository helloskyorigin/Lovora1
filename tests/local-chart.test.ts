import test from "node:test";
import assert from "node:assert/strict";
import {calculateLocalChart,calculateLocalInsight} from "../lib/local-chart";
import {createMarriageReport,normalizePlanets} from "../lib/report/rules";
import type {JourneyDraft} from "../lib/context";
const draft:JourneyDraft={
 firstName:"Test",dateOfBirth:"2009-08-13",birthTime:"13:40",timeKnown:true,
 place:{id:123,name:"Siwan",region:"Bihar",country:"India",latitude:26.22,longitude:84.36,timezone:"Asia/Kolkata"},
 guardianConsent:true,savedAt:Date.now(),relationship:{status:"private",interest:"path"}
};
test("offline ephemeris builds complete ascending sign and seven astronomically computed planet rows",()=>{
 const a=calculateLocalChart(draft);
 const b=calculateLocalChart(draft);
 assert.deepEqual(a,b);
 assert.equal(a.origin,"local");
 assert.equal(a.planets.length,8);
 assert.equal(a.dasha,null);
 assert.equal(a.navamsa,null);
 const normalized=normalizePlanets(a.planets);
 assert.equal(normalized.length,8);
 assert.ok(normalized.some(p=>p.name==="Ascendant"));
 for(const p of normalized){assert.ok(p.degree!==null&&p.degree>=0&&p.degree<30);}
});
test("offline previews use actual birth date/time and explicitly mark source",()=>{
 const first=calculateLocalInsight(draft);
 assert.equal(first.marriagePath?.available,true);
 assert.equal(first.source,"Local astronomy calculation");
 assert.equal(first.ayanamsa,"Approximate Lahiri");
 const later=calculateLocalChart({...draft,dateOfBirth:"2009-10-13"});
 assert.notEqual(later.planets.find(p=>p.name==="Sun")?.rasi?.name,calculateLocalChart(draft).planets.find(p=>p.name==="Sun")?.rasi?.name);
});
test("paid local report contains seven full chapters without fabricated Dasha, with local provenance",()=>{
 const report=createMarriageReport(draft,calculateLocalChart(draft),"offline-7");
 assert.equal(report.chapters.length,7);
 assert.equal(report.source.provider,"LOVORA local astronomy");
 assert.equal(report.source.ayanamsa,"Approximate Lahiri");
 assert.equal(report.timing.status,"not_available");
 assert.ok(report.source.partial.some(x=>x.includes("approximation")));
 assert.equal(report.chapters.reduce((n,ch)=>n+(ch.deepDive?.length||0),0),15);
});
test("unknown birth time cannot produce a fake ascendant or marriage chart",()=>{
 assert.throws(()=>calculateLocalChart({...draft,birthTime:null,timeKnown:false}),/BIRTH_TIME_REQUIRED/);
});
test("invalid locations are rejected instead of generating chart",()=>{
 assert.throws(()=>calculateLocalChart({...draft,place:{...draft.place,latitude:999}}),/UNSUPPORTED_BIRTH_COORDINATES/);
});
