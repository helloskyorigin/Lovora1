import type { JourneyDraft } from "../context";
import type { RawChartData,MarriageStoryReport } from "./types";
import { createMarriageReport } from "./rules";

// Synthetically authored UI fixture; these are NOT actual birth-date calculations.
// Do not send this to purchase fulfillment or remove the sample banner.
const sampleDraft:JourneyDraft={
 firstName:"Aanya",dateOfBirth:"2000-01-01",birthTime:"10:30",timeKnown:true,
 place:{id:1,name:"Fictional City",region:"Sample State",country:"Illustration only",latitude:0,longitude:0,timezone:"Etc/UTC"},
 savedAt:Date.now(),relationship:{status:"single",interest:"path"},
};
const raw:RawChartData={
 planets:[
 {id:100,name:"Ascendant",rasi:{name:"Aries"},degree:12},
 {id:0,name:"Sun",rasi:{name:"Libra"},degree:18},
 {id:1,name:"Moon",rasi:{name:"Cancer"},degree:5},
 {id:2,name:"Mercury",rasi:{name:"Sagittarius"},degree:9},
 {id:3,name:"Venus",rasi:{name:"Libra"},degree:21},
 {id:4,name:"Mars",rasi:{name:"Gemini"},degree:17},
 {id:5,name:"Jupiter",rasi:{name:"Pisces"},degree:24},
 {id:6,name:"Saturn",rasi:{name:"Capricorn"},degree:2},
 {id:101,name:"Rahu",rasi:{name:"Taurus"},degree:11},
 {id:102,name:"Ketu",rasi:{name:"Scorpio"},degree:11},
 ],
 navamsa:null,dasha:null,
};
export function sampleReport():MarriageStoryReport {
 return createMarriageReport(sampleDraft,raw,"00000000-0000-0000-0000-000000000000",new Date("2026-10-01T00:00:00.000Z"));
}
