import {normalizePlanets,SIGNS} from "./rules";
import type {RawPosition,PlanetName,VerifiedPlanet} from "./types";

export type PathLeaning="romance-linked"|"undetermined";
export type PathPreview={leaning:PathLeaning;loveIndicators:number;available:true};
/**
 * This is an ordinal count of traditional sign-level connections, NOT a
 * probability of love vs arranged marriage. Absence of romance links is NOT
 * evidence for an arranged marriage.
 * Mirrors the same 5th–7th comparison used for paid reports.
 */
export function previewMarriagePath(raw:RawPosition[]):PathPreview {
 const planets=normalizePlanets(raw);
 const byName=(name:PlanetName):VerifiedPlanet=>{
  const planet=planets.find(p=>p.name===name);
  if(!planet)throw new Error("INCOMPLETE_CHART");
  return planet;
 };
 const ascending=byName("Ascendant");
 const rulers:PlanetName[]=["Mars","Venus","Mercury","Moon","Sun","Mercury","Venus","Mars","Jupiter","Saturn","Saturn","Jupiter"];
 const fifthSign=SIGNS[(ascending.signIndex+4)%12];
 const seventhSign=SIGNS[(ascending.signIndex+6)%12];
 const fifthLord=rulers[SIGNS.indexOf(fifthSign)];
 const seventhLord=rulers[SIGNS.indexOf(seventhSign)];
 const fifth=byName(fifthLord),seventh=byName(seventhLord),venus=byName("Venus");
 let score=0;
 if(fifthLord===seventhLord)score+=1;
 else if(fifth.sign===seventh.sign)score+=2;
 if(fifth.wholeSignHouse===7||seventh.wholeSignHouse===5)score+=2;
 if(venus.wholeSignHouse===5||venus.wholeSignHouse===7)score+=1;
 return {leaning:score>=2?"romance-linked":"undetermined",loveIndicators:score,available:true};
}
