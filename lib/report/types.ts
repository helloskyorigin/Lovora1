import type { RelationshipContext } from "../context";

export type SignName = "Aries"|"Taurus"|"Gemini"|"Cancer"|"Leo"|"Virgo"|"Libra"|"Scorpio"|"Sagittarius"|"Capricorn"|"Aquarius"|"Pisces";
export type PlanetName = "Sun"|"Moon"|"Mercury"|"Venus"|"Mars"|"Jupiter"|"Saturn"|"Rahu"|"Ketu"|"Ascendant";
export type VerifiedPlanet = { name:PlanetName; id:number; sign:SignName; signIndex:number; wholeSignHouse:number; degree:number|null; isRetrograde:boolean|null };
export type ChartEvidence = { id:string; title:string; observation:string; meaning:string; type:"relationship"|"support"|"balance"|"timing"; planets:PlanetName[] };
export type Chapter = { id:string; number:number; eyebrow:string; title:string; introduction:string; paragraphs:string[]; evidenceIds:string[]; note?:string };
export type Timing = { status:"supported"|"not_available"; description:string; windows:{name:string;start:string;end:string;why:string}[] };
export type MarriageStoryReport = {
  version:1;
  id:string;
  createdAt:string;
  person:{firstName:string;birthDate:string;birthTime:string;birthplace:string; timezone:string};
  context:RelationshipContext;
  source:{provider:"Prokerala";ayanamsa:"Lahiri";methods:string[];partial:string[]};
  chart:{rising:SignName;fifth:SignName;seventh:SignName;fifthLord:PlanetName;seventhLord:PlanetName;planets:VerifiedPlanet[];navamsa:{venus:SignName;seventhLord:SignName}|null};
  marriagePath:{headline:string;summary:string;signals:{love:number;family:number;neutral:number};caveat:string};
  timing:Timing;
  evidence:ChartEvidence[];
  chapters:Chapter[];
  disclaimer:string;
};
export type RawPosition = {id?:unknown;name?:unknown;degree?:unknown;is_retrograde?:unknown;rasi?:{id?:unknown;name?:unknown}};
export type RawChartData = {
  planets:RawPosition[];
  navamsa?:{divisional_positions?:Array<{planet?:{id?:unknown;name?:unknown};rasi?:{id?:unknown;name?:unknown}}>}|null;
  dasha?:unknown;
};
