import type { JourneyDraft } from "../context";
import type { Chapter, ChartEvidence, MarriageStoryReport, PlanetName, RawChartData, RawPosition, SignName, Timing, VerifiedPlanet } from "./types";

export const SIGNS: SignName[] = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
const RULERS: PlanetName[] = ["Mars","Venus","Mercury","Moon","Sun","Mercury","Venus","Mars","Jupiter","Saturn","Saturn","Jupiter"];
const ID_TO_NAME: Record<number,PlanetName>={0:"Sun",1:"Moon",2:"Mercury",3:"Venus",4:"Mars",5:"Jupiter",6:"Saturn",100:"Ascendant",101:"Rahu",102:"Ketu"};
const SIGN_CHARACTER: Record<SignName,string>={
  Aries:"independence and a direct approach to partnership",
  Taurus:"steadiness, affection and shared comfort",
  Gemini:"conversation, curiosity and adaptability",
  Cancer:"emotional safety, family feeling and nurturance",
  Leo:"warmth, visibility and mutual appreciation",
  Virgo:"care expressed through practical commitment",
  Libra:"fairness, cooperation and balanced partnership",
  Scorpio:"depth, privacy and emotional honesty",
  Sagittarius:"freedom, shared growth and exploration",
  Capricorn:"stability, responsibility and long-term effort",
  Aquarius:"friendship, individuality and shared principles",
  Pisces:"empathy, imagination and compassion",
};
const NOTES = {
  timing:"Traditional Dasha periods are interpretive frameworks, not reliable dates for a real marriage. No definite wedding date is provided.",
  disclaimer:"LOVORA is a symbolic exploration of traditional Vedic astrology, for reflection and entertainment. Astrology is not scientifically established as a way to predict marriage, relationships, partner identity or life outcomes. Your choices and circumstances matter more than any chart.",
};

function signOf(value: unknown): SignName|null{
  if(typeof value!=="string")return null;
  const normalized=value.trim().toLowerCase();
  return SIGNS.find(sign=>sign.toLowerCase()===normalized)||null;
}
function nameOf(row:RawPosition):PlanetName|null{
  const id = typeof row.id === "number" && Number.isInteger(row.id) ? row.id : -1;
  const mapped=Object.prototype.hasOwnProperty.call(ID_TO_NAME,id)?ID_TO_NAME[id]:null;
  const raw=typeof row.name==="string"?row.name.trim().toLowerCase():"";
  const named=Object.values(ID_TO_NAME).find(name=>name.toLowerCase()===raw)||null;
  // Never label Mercury as Venus because an upstream numeric ID changed.
  if(named&&mapped&&named!==mapped)throw new Error("PLANET_ID_NAME_CONFLICT");
  if(raw&&!named)return null;
  return named||mapped;
}
export function normalizePlanets(rows:RawPosition[]):VerifiedPlanet[]{
  if(!Array.isArray(rows)||rows.length>40)throw new Error("UNSUPPORTED_CHART_RESPONSE");
  const normalized = new Map<PlanetName,VerifiedPlanet>();
  for(const raw of rows){
    if(!raw||typeof raw!=="object")continue;
    const name=nameOf(raw);
    const sign=signOf(raw.rasi?.name);
    if(!name||!sign)continue;
    if(normalized.has(name))throw new Error("DUPLICATE_PLANET");
    const id=Object.entries(ID_TO_NAME).find(([,v])=>v===name);
    const degree=typeof raw.degree==="number"&&Number.isFinite(raw.degree)&&raw.degree>=0&&raw.degree<30 ? raw.degree : null;
    normalized.set(name,{name,id:id?Number(id[0]):-1,sign,signIndex:SIGNS.indexOf(sign),wholeSignHouse:0,degree,isRetrograde:typeof raw.is_retrograde==="boolean"?raw.is_retrograde:null});
  }
  const lagna=normalized.get("Ascendant");
  if(!lagna)throw new Error("MISSING_ASCENDANT");
  const necessary:PlanetName[]=["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn"];
  if(necessary.some(name=>!normalized.has(name)))throw new Error("INCOMPLETE_CHART");
  return [...normalized.values()].map(planet=>({...planet,wholeSignHouse:((planet.signIndex-lagna.signIndex+12)%12)+1}));
}
function one(p:VerifiedPlanet[],name:PlanetName):VerifiedPlanet {
  const found=p.find(planet=>planet.name===name);
  if(!found)throw new Error("INCOMPLETE_CHART");
  return found;
}
function houseSign(risingIndex:number,house:number):SignName{
  return SIGNS[(risingIndex+house-1)%12];
}
function houseDescription(house:number):string{
  if(house===1)return "personal outlook and self-expression";
  if(house===5)return "romance and personal creativity";
  if(house===7)return "partnership and commitment";
  if(house===4)return "home and family values";
  if(house===11)return "friendship and social circles";
  if(house===9)return "shared philosophy and beliefs";
  return "the broader life circumstances surrounding relationships";
}
function navamsaSign(payload:RawChartData["navamsa"],name:PlanetName):SignName|null{
  if(!payload||!Array.isArray(payload.divisional_positions))return null;
  for(const entry of payload.divisional_positions){
    const rowName = nameOf({id:entry.planet?.id,name:entry.planet?.name});
    if(rowName===name)return signOf(entry.rasi?.name);
  }
  return null;
}
function tryDasha(raw:unknown,relevant:Set<string>):Timing{
  const unavailable:Timing={status:"not_available",description:"The Dasha data did not provide a reliably verifiable period in the supported format. LOVORA does not invent wedding years or dates.",windows:[]};
  if(!raw||typeof raw!=="object")return unavailable;
  const obj=raw as Record<string,unknown>;
  const periods = (obj.data && typeof obj.data==="object" ? (obj.data as Record<string,unknown>).dasha_periods : obj.dasha_periods);
  if(!Array.isArray(periods))return unavailable;
  const result:Timing["windows"]=[];
  for(const item of periods.slice(0,35)){
    if(!item||typeof item!=="object")continue;
    const p=item as Record<string,unknown>;
    // Fail closed: accept a clearly named lord and unambiguous ISO-8601 dates only.
    const lordField=p.lord||p.planet;
    let lord="";
    if(typeof lordField==="string")lord=lordField;
    else if(lordField&&typeof lordField==="object"){
      const data=lordField as Record<string,unknown>;
      if(typeof data.name==="string")lord=data.name;
    }
    const start=p.start_date||p.start;
    const end=p.end_date||p.end;
    if(!relevant.has(lord.toLowerCase())||typeof start!=="string"||typeof end!=="string")continue;
    if(!/^\d{4}-\d{2}-\d{2}(T[\d:.+-Z]+)?$/.test(start)||!/^\d{4}-\d{2}-\d{2}(T[\d:.+-Z]+)?$/.test(end))continue;
    const a=Date.parse(start),b=Date.parse(end);
    if(!Number.isFinite(a)||!Number.isFinite(b)||a>=b)continue;
    if(a < Date.UTC(1980,0,1)||b > Date.UTC(2200,0,1))continue;
    result.push({name:lord,start:start.slice(0,10),end:end.slice(0,10),why:lord+" is one of the traditional chart rulers or Venus; this is a Dasha association, not a marriage forecast."});
    if(result.length>=3)break;
  }
  if(!result.length)return unavailable;
  return {status:"supported",description:"These are verifiable traditional Dasha intervals associated with relationship indicators, not predicted wedding dates.",windows:result};
}

export function createMarriageReport(draft:JourneyDraft,raw:RawChartData, reportId:string,createdAt=new Date()):MarriageStoryReport {
  if(!draft.timeKnown||!draft.birthTime||!draft.relationship)throw new Error("INCOMPLETE_JOURNEY");
  const planets=normalizePlanets(raw.planets);
  const rising=one(planets,"Ascendant");
  const fifth=houseSign(rising.signIndex,5);
  const seventh=houseSign(rising.signIndex,7);
  const fifthLord=RULERS[SIGNS.indexOf(fifth)];
  const seventhLord=RULERS[SIGNS.indexOf(seventh)];
  const fifthP=one(planets,fifthLord);
  const seventhP=one(planets,seventhLord);
  const venus=one(planets,"Venus"),moon=one(planets,"Moon");
  const signals={love:0,family:0,neutral:0};
  const evidence:ChartEvidence[]=[];
  const append=(id:string,title:string,observation:string,meaning:string,type:ChartEvidence["type"],names:PlanetName[])=>evidence.push({id,title,observation,meaning,type,planets:names});
  append("asc","The birth-chart rising sign","Ascendant in "+rising.sign,"Whole-sign houses are derived from this verified sign, using the Lahiri sidereal zodiac.","support",["Ascendant"]);
  append("houses","Romance and partnership signs","5th house: "+fifth+" ("+fifthLord+"); 7th house: "+seventh+" ("+seventhLord+")","In this traditional model, the 5th house is linked with romance and the 7th with committed partnership.","support",[fifthLord,seventhLord]);
  const sameRuler=fifthLord===seventhLord;
  if(sameRuler){
    signals.love+=1;
    append("rulers","A shared house ruler","Both 5th and 7th houses are ruled by "+fifthLord,"Some schools read this as an overlap of romance and partnership themes. It is not a marriage-type verdict.","relationship",[fifthLord]);
  }else if(fifthP.sign===seventhP.sign){
    signals.love+=2;
    append("rulers","Relationship between the house rulers",fifthLord+" and "+seventhLord+" both occupy "+fifthP.sign,"Their sign-level co-presence is traditionally interpreted as a connection between romance and partnership.","relationship",[fifthLord,seventhLord]);
  }else{
    signals.neutral++;
    append("rulers","Two different relationship patterns",fifthLord+" is in "+fifthP.sign+" (house "+fifthP.wholeSignHouse+"); "+seventhLord+" is in "+seventhP.sign+" (house "+seventhP.wholeSignHouse+")","Distinct positions give separate symbolic themes. A definitive marriage path cannot be inferred from this alone.","balance",[fifthLord,seventhLord]);
  }
  if(fifthP.wholeSignHouse===7||seventhP.wholeSignHouse===5){
    signals.love+=2;
    append("cross","Romance-partnership house connection", (fifthP.wholeSignHouse===7?fifthLord+" is in the 7th house. ":"")+(seventhP.wholeSignHouse===5?seventhLord+" is in the 5th house.":""),"Some traditions associate a 5th–7th placement with romance entering a committed relationship.","relationship",[fifthLord,seventhLord]);
  }else{
    signals.neutral++;
  }
  if(venus.wholeSignHouse===5||venus.wholeSignHouse===7){
    signals.love++;
    append("venus","Venus in a relationship house","Venus in "+venus.sign+", whole-sign house "+venus.wholeSignHouse,"Venus's traditional association with affection provides an additional symbolic relationship theme.","relationship",["Venus"]);
  }else{
    signals.neutral++;
    append("venus","Venus and affection","Venus in "+venus.sign+", whole-sign house "+venus.wholeSignHouse,"This placement is interpreted symbolically for affection; it is not proof of a marriage outcome.","support",["Venus"]);
  }
  // Family-supported is not inferred from whether planets are absent from romance houses.
  // It is only discussed as an equally possible real-life path, not a computed destiny.
  signals.family=0;
  append("moon","Emotional expression","Moon in "+moon.sign+", whole-sign house "+moon.wholeSignHouse,"The Moon is used in traditional readings as a symbolic lens on emotional comfort.","support",["Moon"]);
  append("seven","Partnership ruler",seventhLord+" (ruler of the 7th house) is in "+seventhP.sign+", house "+seventhP.wholeSignHouse,"Interpretations consider the ruler's position as another partnership theme, but it does not describe a real future person's identity.","support",[seventhLord]);
  const d9Venus=navamsaSign(raw.navamsa,"Venus");
  const d9Lord=navamsaSign(raw.navamsa,seventhLord);
  const navamsa=d9Venus&&d9Lord?{venus:d9Venus,seventhLord:d9Lord}:null;
  if(navamsa)append("d9","Navamsa cross-reference","Navamsa Venus: "+d9Venus+"; Navamsa "+seventhLord+": "+d9Lord,"A second traditional chart is available as a cross-reference; it does not replace the main birth chart.","support",["Venus",seventhLord]);
  const timing=tryDasha(raw.dasha,new Set([fifthLord.toLowerCase(),seventhLord.toLowerCase(),"venus"]));
  if(timing.status==="supported")append("timing","Dasha data available",timing.windows.map(w=>w.name+" ("+w.start+"–"+w.end+")").join("; "),"Intervals are taken from provider-returned dates and are not marriage predictions.","timing",[fifthLord,seventhLord]);
  const isLinked=signals.love>=2;
  const headline=isLinked?"Romance and commitment share some traditional chart links":"A mixed relationship story — no single path is established";
  const summary=isLinked
    ?"Some verified positions connect the traditional romance and partnership houses. This is a symbolic emphasis, not evidence that a love marriage will occur. Family choice, circumstances and consent remain central."
    :"The chart shows distinct relationship themes without a strong verified sign-level 5th–7th link in this limited ruleset. This does not imply an arranged marriage; the outcome cannot be deduced from these positions.";
  const chapters:Chapter[]=[
    {id:"path",number:1,eyebrow:"THE CHOICE",title:"Your Marriage Path",introduction:headline,
      paragraphs:[summary,"The 5th house is "+fifth+" and its traditional ruler "+fifthLord+" is in house "+fifthP.wholeSignHouse+". The 7th house is "+seventh+" and its ruler "+seventhLord+" is in house "+seventhP.wholeSignHouse+". This is the foundation of the comparison.",
        "LOVORA will not treat a missing romance indicator as proof of arranged marriage, and it will never label a family-supported relationship as less authentic. The chart does not know what family, culture or personal choices will shape your decisions."],
      evidenceIds:["houses","rulers","cross","venus"].filter(id=>evidence.some(e=>e.id===id)),
      note:"Traditional symbolism — not a prediction or personal instruction."},
    {id:"love",number:2,eyebrow:"THE HEART",title:"The Way You Love",introduction:"A closer look at Venus and the Moon.",
      paragraphs:["Venus occupies "+venus.sign+" in house "+venus.wholeSignHouse+". Traditional sign symbolism highlights "+SIGN_CHARACTER[venus.sign]+". This suggests topics for reflection, not a diagnosis of your personality.",
        "The Moon occupies "+moon.sign+" in house "+moon.wholeSignHouse+". Traditional readings connect this sign with "+SIGN_CHARACTER[moon.sign]+". These two placements can be read together without claiming to know how you actually behave.",
        "Your selected relationship status is context supplied by you; the interpretation does not treat it as a planet position."],
      evidenceIds:["venus","moon"]},
    {id:"partner",number:3,eyebrow:"THE CONNECTION",title:"Future Partnership Themes",introduction:"Symbolic themes, never an invented future partner.",
      paragraphs:["The 7th house falls in "+seventh+", a sign traditionally associated with "+SIGN_CHARACTER[seventh]+". It may suggest reflection topics for how you would like partnership to feel.",
        "The 7th-house ruler "+seventhLord+" appears in "+seventhP.sign+" and house "+seventhP.wholeSignHouse+", symbolically connecting partnership with "+houseDescription(seventhP.wholeSignHouse)+".",
        navamsa?"A supplementary Navamsa reading places Venus in "+navamsa.venus+" and the partnership ruler in "+navamsa.seventhLord+". These are additional symbolic references, not proof of another person's character.":"A verified Navamsa cross-check was not available; LOVORA will not fill that gap with made-up chart positions."],
      evidenceIds:["seven","d9"].filter(id=>evidence.some(e=>e.id===id)),note:"No identification, location or personal traits of a real future spouse can be derived."},
    {id:"timing",number:4,eyebrow:"THE SEASONS",title:"The Rhythm of Commitment",introduction:timing.description,
      paragraphs:timing.status==="supported"
        ?["The astrology provider returned "+timing.windows.length+" validated Dasha interval(s) whose named planetary rulers relate to this report's traditional romance or partnership indicators.",
          "These intervals are symbolic contexts for interpretation and do not establish when someone will marry. No exact wedding date or guaranteed favorable year can be calculated from these limited signals."]
        :["No appropriately structured, verifiable Dasha intervals were available for this report. Instead of printing a plausible-looking wedding year, this chapter clearly describes the limitation.",
          "The original 5th/7th house-ruler relationship and Venus placement remain meaningful as traditional symbolism, independently of a timing estimate."],
      evidenceIds:["timing","houses"].filter(id=>evidence.some(e=>e.id===id)),note:NOTES.timing},
    {id:"married-life",number:5,eyebrow:"LIFE TOGETHER",title:"Building a Life Together",introduction:"From symbolism to thoughtful relationship questions.",
      paragraphs:["The 7th-house ruler occupies the "+seventhP.wholeSignHouse+"th house, traditionally linked with "+houseDescription(seventhP.wholeSignHouse)+". Consider how this theme might relate to your own expectations of companionship.",
        "The Moon's placement in "+moon.sign+" is sometimes connected with "+SIGN_CHARACTER[moon.sign]+". In a real relationship, honest communication, trust and mutual boundaries matter more than a chart position.",
        "The report cannot tell whether your marriage will be happy, troubled, early or late. It can only frame conventional astrological symbols as prompts for reflection."],
      evidenceIds:["seven","moon"]},
    {id:"evidence",number:6,eyebrow:"THE WHY",title:"The Chart Behind the Story",introduction:"Every major interpretation has a checkable source.",
      paragraphs:["Birth-chart rising sign: "+rising.sign+". Traditional Lahiri sidereal whole-sign houses are calculated from this verified ascendant. Romance sign: "+fifth+". Partnership sign: "+seventh+".",
        "Venus: "+venus.sign+" (house "+venus.wholeSignHouse+"). Moon: "+moon.sign+" (house "+moon.wholeSignHouse+"). Partnership ruler: "+seventhLord+" in "+seventhP.sign+". These are chart facts supplied by the provider and structured by the rules engine.",
        "No unverifiable probabilities, fabricated marriage scores or numerical success rates are included. You can inspect every supporting indicator below."],
      evidenceIds:evidence.map(e=>e.id)},
    {id:"keepsake",number:7,eyebrow:"YOUR KEEPSAKE",title:"A Story Worth Keeping",introduction:"Your own symbolic story, presented as a keepsake.",
      paragraphs:["The central theme of your report is: "+headline+".",
        "You asked most about "+({path:"love versus arranged marriage",timing:"traditional relationship timing",partner:"partnership themes"}[draft.relationship.interest])+". Keep what resonates and disregard what does not; chart symbolism is not a substitute for your lived experience.",
        "Save your reading as a printable PDF. It reflects traditional astrological conventions rather than certainties about a future partner or wedding."],
      evidenceIds:["asc","houses"],note:"This report is for personal exploration and entertainment."},
  ];
  if(chapters.length!==7||chapters.some(c=>c.paragraphs.length<2))throw new Error("INVALID_REPORT_STRUCTURE");
  return {
    version:1,id:reportId,createdAt:createdAt.toISOString(),
    person:{firstName:draft.firstName,birthDate:draft.dateOfBirth,birthTime:draft.birthTime,
      birthplace:[draft.place.name,draft.place.region,draft.place.country].filter(Boolean).join(", "),timezone:draft.place.timezone},
    context:draft.relationship,
    source:{provider:"Prokerala",ayanamsa:"Lahiri",methods:["Sidereal planet-position","Traditional whole-sign houses","Documented 5th/7th lord comparisons",...(navamsa?["Verified Navamsa positions"]:[]),...(timing.status==="supported"?["Validated Dasha interval fields"]:[])],partial:[...(!navamsa?["Navamsa data unavailable or unparseable"]:[]),...(timing.status!=="supported"?["Dasha timing unavailable or unparseable"]:[])]},
    chart:{rising:rising.sign,fifth,seventh,fifthLord,seventhLord,planets,navamsa},
    marriagePath:{headline,summary,signals,caveat:"No marriage-type probability or guaranteed outcome is estimated."},
    timing,evidence,chapters,disclaimer:NOTES.disclaimer,
  };
}
