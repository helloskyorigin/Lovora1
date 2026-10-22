/**
 * Offline *astronomical* fallback. This uses Astronomy Engine (MIT licensed) and
 * approximate Lahiri sidereal offset to derive geocentric zodiac signs and the
 * ascendant from UTC, latitude and longitude. It does not simulate a prediction
 * model, or fabricate Navamsa / Dasha data absent from provider calculations.
 *
 * Do not represent these positions as an authoritative Swiss Ephemeris chart:
 * ayanamsa is approximated and zodiac sign boundaries may differ slightly.
 */
import * as astronomy from "astronomy-engine";
import {resolveBirthUTC} from "./birth-time";
import {SIGNS} from "./report/rules";
import type {JourneyDraft,PreviewInsight} from "./context";
import type {PlanetName,RawChartData,RawPosition,SignName} from "./report/types";
import {previewMarriagePath} from "./report/path-preview";

const MOD=360;
const radians=(v:number)=>v*Math.PI/180;
const norm=(v:number)=>((v%MOD)+MOD)%MOD;
type Placement={id:number;name:PlanetName;tropical:number};
const PLANETS:{name:PlanetName;id:number;body:astronomy.Body}[]=[
 {id:0,name:"Sun",body:astronomy.Body.Sun},
 {id:1,name:"Moon",body:astronomy.Body.Moon},
 {id:2,name:"Mercury",body:astronomy.Body.Mercury},
 {id:3,name:"Venus",body:astronomy.Body.Venus},
 {id:4,name:"Mars",body:astronomy.Body.Mars},
 {id:5,name:"Jupiter",body:astronomy.Body.Jupiter},
 {id:6,name:"Saturn",body:astronomy.Body.Saturn},
];
export const LOCAL_CHART_METHOD="Astronomy Engine geocentric positions · approximate Lahiri sidereal offset · whole-sign houses";

function ayanamsa(date:Date):number {
 const days=(date.getTime()-Date.UTC(2000,0,1,12,0,0))/86400000;
 // A bounded secular approximation centered on the early-2000s Lahiri value.
 return 23.8565 + days/365.2425 * (50.29/3600);
}
function sign(longitude:number):{name:SignName;id:number;degree:number} {
 if(!Number.isFinite(longitude))throw new Error("INVALID_LONGITUDE");
 const value=norm(longitude);
 const id=Math.floor(value/30);
 return {name:SIGNS[id],id:id+1,degree:value%30};
}
function longitudeOf(body:astronomy.Body,date:Date):number{
 if(body===astronomy.Body.Sun)return astronomy.SunPosition(date).elon;
 if(body===astronomy.Body.Moon)return astronomy.EclipticGeoMoon(date).lon;
 // Ecliptic GeoVector transforms apparent geocentric EQJ to ecliptic-of-date;
 // EclipticLongitude() is HELIOCENTRIC and must not be used here.
 return astronomy.Ecliptic(astronomy.GeoVector(body,date,true)).elon;
}
function risingLongitude(date:Date,lat:number,lon:number):number {
 const theta=radians(norm(astronomy.SiderealTime(date)*15+lon));
 const phi=radians(lat);
 const days=(date.getTime()-Date.UTC(2000,0,1,12))/86400000;
 const t=days/36525;
 const eps=radians(23.43929111-0.013004167*t);
 // East horizon intersection of the ecliptic and local celestial sphere.
 const a=Math.cos(phi)*Math.cos(theta);
 const b=Math.cos(phi)*Math.sin(theta)*Math.cos(eps)+Math.sin(phi)*Math.sin(eps);
 return norm(Math.atan2(-a,b)*180/Math.PI);
}
export function calculateLocalChart(draft:JourneyDraft):RawChartData {
 if(!draft.birthTime||!draft.timeKnown)throw new Error("BIRTH_TIME_REQUIRED");
 const lat=draft.place.latitude,lon=draft.place.longitude;
 if(!Number.isFinite(lat)||Math.abs(lat)>=89||!Number.isFinite(lon)||Math.abs(lon)>180)
  throw new Error("UNSUPPORTED_BIRTH_COORDINATES");
 const date=resolveBirthUTC(draft.dateOfBirth,draft.birthTime,draft.place.timezone);
 if(date.getUTCFullYear()<1900||date.getUTCFullYear()>2100)
  throw new Error("UNSUPPORTED_BIRTH_YEAR");
 const offset=ayanamsa(date);
 const positions:Placement[]=PLANETS.map(({body,name,id})=>({name,id,tropical:longitudeOf(body,date)}));
 positions.push({id:100,name:"Ascendant",tropical:risingLongitude(date,lat,lon)});
 const planets:RawPosition[]=positions.map(item=>{
  const s=sign(item.tropical-offset);
  return {id:item.id,name:item.name,degree:s.degree,rasi:{id:s.id,name:s.name}};
 });
 // Enforce the exact same rules used for paid reports; no invented planet rows.
 previewMarriagePath(planets);
 return {planets,origin:"local",navamsa:null,dasha:null};
}
const ZODIAC_DESC:Record<SignName,[string,string]>={
 Aries:["Initiative and openness","पहल और खुलापन"],
 Taurus:["Steadiness and comfort","स्थिरता और सहजता"],
 Gemini:["Communication and curiosity","बातचीत और जिज्ञासा"],
 Cancer:["Care and emotional safety","देखभाल और भावनात्मक सुरक्षा"],
 Leo:["Warmth and expression","अपनापन और अभिव्यक्ति"],
 Virgo:["Attention and care","ध्यान और देखभाल"],
 Libra:["Balance and cooperation","संतुलन और सहयोग"],
 Scorpio:["Depth and trust","गहराई और विश्वास"],
 Sagittarius:["Exploration and openness","खोज और खुलापन"],
 Capricorn:["Commitment and patience","प्रतिबद्धता और धैर्य"],
 Aquarius:["Friendship and individuality","दोस्ती और व्यक्तित्व"],
 Pisces:["Sensitivity and empathy","संवेदनशीलता और सहानुभूति"]
};
export function calculateLocalInsight(draft:JourneyDraft):PreviewInsight {
 const data=calculateLocalChart(draft);
 const venus=data.planets.find(p=>p.name==="Venus");
 const found=SIGNS.find(s=>s===venus?.rasi?.name);
 if(!found)throw new Error("LOCAL_VENUS_MISSING");
 const [en,hi]=ZODIAC_DESC[found];
 return {
  planet:"Venus",sign:found,signId:SIGNS.indexOf(found)+1,
  descriptionEn:"Traditional symbolism emphasizes "+en.toLowerCase()+". This local chart uses an approximate sidereal offset.",
  descriptionHi:"पारंपरिक संकेत: "+hi+"। स्थानीय गणना में सायन-निरयण अंतर अनुमानित है।",
  marriagePath:previewMarriagePath(data.planets),
  source:"Local astronomy calculation",ayanamsa:"Approximate Lahiri",generatedAt:Date.now()
 };
}
