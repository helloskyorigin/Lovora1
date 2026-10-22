import test from "node:test";
import assert from "node:assert/strict";
import { createMarriageReport, normalizePlanets } from "../lib/report/rules";
import type { JourneyDraft } from "../lib/context";
import type { RawChartData } from "../lib/report/types";

const birth:JourneyDraft={
  firstName:"Test",dateOfBirth:"1996-02-04",birthTime:"12:30",timeKnown:true,
  place:{id:123,name:"Test City",region:"Test",country:"Example",latitude:25,longitude:85,timezone:"Asia/Kolkata"},
  savedAt:Date.now(),relationship:{status:"single",interest:"path"},
};
function source(sunSign="Libra"):RawChartData{
  return {planets:[
    {id:100,name:"Ascendant",rasi:{name:"Aries"},degree:12},
    {id:0,name:"Sun",rasi:{name:sunSign},degree:16},
    {id:1,name:"Moon",rasi:{name:"Cancer"},degree:4},
    {id:2,name:"Mercury",rasi:{name:"Gemini"},degree:2},
    {id:3,name:"Venus",rasi:{name:"Libra"},degree:21},
    {id:4,name:"Mars",rasi:{name:"Taurus"},degree:9},
    {id:5,name:"Jupiter",rasi:{name:"Sagittarius"},degree:11},
    {id:6,name:"Saturn",rasi:{name:"Capricorn"},degree:26},
  ],navamsa:null,dasha:null};
}
test("generates exactly 7 chart-based chapters, without marriage certainty",()=>{
  const r=createMarriageReport(birth,source(),"a-new-report");
  assert.equal(r.chapters.length,7);
  assert.deepEqual(r.chapters.map(x=>x.id),["path","love","partner","timing","married-life","evidence","keepsake"]);
  assert.equal(r.chart.rising,"Aries");
  assert.equal(r.chart.fifth,"Leo");
  assert.equal(r.chart.seventh,"Libra");
  assert.equal(r.chart.fifthLord,"Sun");
  assert.equal(r.chart.seventhLord,"Venus");
  assert.equal(r.timing.status,"not_available");
  assert.equal(r.timing.windows.length,0);
  assert.equal(r.chart.navamsa,null);
  assert.ok(r.marriagePath.headline.includes("Romance"));
  assert.ok(r.evidence.find(e=>e.id==="cross"));
  assert.ok(!r.chapters.some(ch=>ch.paragraphs.some(p=>/\b100%\b|guaranteed wedding|definitely marry/i.test(p))));
});
test("disconnected rulers do not force an arranged-marriage prediction",()=>{
  const r=createMarriageReport(birth,source("Taurus"),"b-new-report");
  assert.match(r.marriagePath.headline,/mixed relationship/i);
  assert.equal(r.marriagePath.signals.family,0);
  assert.match(r.chapters[0].paragraphs.join(" "),/does not imply an arranged marriage/i);
  assert.equal(r.timing.windows.length,0);
});
test("rejects missing ascendant rather than inventing whole-sign houses",()=>{
  assert.throws(()=>normalizePlanets(source().planets.filter(x=>x.id!==100)),/MISSING_ASCENDANT/);
});
test("rejects duplicate positions",()=>{
  const rows=source().planets;
  assert.throws(()=>normalizePlanets([...rows,rows[4]]),/DUPLICATE_PLANET/);
});
test("optional D9 is included only when source returns matched known signs",()=>{
  const sourceData=source();
  sourceData.navamsa={divisional_positions:[
    {planet:{id:3,name:"Venus"},rasi:{name:"Cancer"}},
    {planet:{id:3,name:"Venus"},rasi:{name:"Cancer"}},
  ]};
  const r=createMarriageReport(birth,sourceData,"c-new-report");
  assert.deepEqual(r.chart.navamsa,{venus:"Cancer",seventhLord:"Cancer"});
  assert.ok(r.evidence.some(x=>x.id==="d9"));
});
test("unknown birth time blocks premium report",()=>{
  const draft={...birth,timeKnown:false,birthTime:null};
  assert.throws(()=>createMarriageReport(draft,source(),"blocked"),/INCOMPLETE_JOURNEY/);
});
test("timing data requires verifiable ISO start/end and named relevant lord",()=>{
  const data=source();
  data.dasha={data:{dasha_periods:[
    {lord:{name:"Venus"},start:"2030-01-01",end:"2032-01-01"},
    {lord:{name:"Mars"},start:"2033-01-01",end:"2033-01-02"},
  ]}};
  const report=createMarriageReport(birth,data,"dated");
  assert.equal(report.timing.status,"supported");
  assert.equal(report.timing.windows.length,1);
  assert.equal(report.timing.windows[0].name,"Venus");
  assert.ok(report.timing.windows[0].why.includes("not a marriage forecast"));
});

test("rejects conflicting provider ID/name instead of misidentifying Venus",()=>{
 const rows=source().planets.map(x=>({...x}));
 rows[4]={...rows[4],id:4,name:"Venus"};
 assert.throws(()=>normalizePlanets(rows),/PLANET_ID_NAME_CONFLICT/);
});
test("does not silently trust a known ID with an unknown planet name",()=>{
 const rows=source().planets.map(x=>({...x}));
 rows[4]={...rows[4],name:"Unknown planet"};
 assert.throws(()=>normalizePlanets(rows),/INCOMPLETE_CHART/);
});
