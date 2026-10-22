import {Cities} from "countries-states-cities-service/cities";
import {Countries} from "countries-states-cities-service/countries";
import {States} from "countries-states-cities-service/states";
import tzlookup from "@photostructure/tz-lookup";
import type {BirthPlace} from "./birth";

/** Bundled worldwide cities; no GeoNames account or live geocoding requests. */
type LocalCity={
 id:number;name:string;region:string;country:string;
 latitude:number;longitude:number;normalized:string;
};
export type CitySuggestion={id:number;name:string;region:string;country:string;display:string};
let catalog:LocalCity[]|undefined;
let byId:Map<number,LocalCity>|undefined;
function normalize(value:string){
 return value.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").trim().toLocaleLowerCase("en");
}
function initialize(){
 if(catalog&&byId)return;
 const countries=new Map(Countries.getCountries().map(c=>[c.id,c.name]));
 const states=new Map(States.getStates().map(s=>[s.id,s.name]));
 const list:LocalCity[]=[];
 const ids=new Map<number,LocalCity>();
 for(const c of Cities.getCities()){
  if(!Number.isSafeInteger(c.id)||c.id<=0||ids.has(c.id))continue;
  const latitude=Number(c.latitude),longitude=Number(c.longitude);
  if(!Number.isFinite(latitude)||Math.abs(latitude)>90||!Number.isFinite(longitude)||Math.abs(longitude)>180)continue;
  const city:LocalCity={
   id:c.id,name:c.name,region:states.get(c.state_id)||c.state_code||"",
   country:countries.get(c.country_id)||c.country_code,latitude,longitude,
   normalized:normalize(c.name),
  };
  ids.set(c.id,city);list.push(city);
 }
 catalog=list;byId=ids;
}
export async function searchCities(term:string):Promise<CitySuggestion[]>{
 const q=normalize(term);
 if(q.length<3||q.length>60)return [];
 initialize();
 const matched:(LocalCity&{rank:number})[]=[];
 for(const city of catalog!){
  const name=city.normalized;
  if(!name.includes(q))continue;
  const rank=name===q?0:name.startsWith(q)?1:name.split(/\s+/).some(word=>word.startsWith(q))?2:3;
  matched.push({...city,rank});
 }
 matched.sort((a,b)=>a.rank-b.rank||a.name.length-b.name.length||a.name.localeCompare(b.name)||a.country.localeCompare(b.country));
 return matched.slice(0,8).map(city=>({
  id:city.id,name:city.name,region:city.region,country:city.country,
  display:[city.name,city.region,city.country].filter(Boolean).join(", "),
 }));
}
export async function getVerifiedPlace(id:number):Promise<BirthPlace>{
 if(!Number.isSafeInteger(id)||id<1)throw new Error("INVALID_CITY_ID");
 initialize();
 const city=byId!.get(id);
 if(!city)throw new Error("CITY_NOT_FOUND_IN_DIRECTORY");
 let timezone:string;
 try{
  timezone=tzlookup(city.latitude,city.longitude);
  new Intl.DateTimeFormat("en-US",{timeZone:timezone});
 }catch{throw new Error("CITY_TIMEZONE_UNAVAILABLE");}
 return {
  id:city.id,name:city.name,region:city.region,country:city.country,
  latitude:city.latitude,longitude:city.longitude,timezone,
 };
}
