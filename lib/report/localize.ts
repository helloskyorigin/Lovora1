import type {ChartEvidence,Chapter,MarriageStoryReport,PlanetName,SignName} from "./types";

export type ReportLanguage="en"|"hi";
const signs:Record<SignName,string>={
 Aries:"मेष",Taurus:"वृषभ",Gemini:"मिथुन",Cancer:"कर्क",Leo:"सिंह",Virgo:"कन्या",
 Libra:"तुला",Scorpio:"वृश्चिक",Sagittarius:"धनु",Capricorn:"मकर",Aquarius:"कुंभ",Pisces:"मीन",
};
const planets:Record<PlanetName,string>={
 Sun:"सूर्य",Moon:"चंद्र",Mercury:"बुध",Venus:"शुक्र",Mars:"मंगल",
 Jupiter:"गुरु",Saturn:"शनि",Rahu:"राहु",Ketu:"केतु",Ascendant:"लग्न",
};
const themed:Record<SignName,string>={
 Aries:"पहल और स्वतंत्रता",Taurus:"स्थिरता और अपनापन",Gemini:"बातचीत और जिज्ञासा",
 Cancer:"भावनात्मक सुरक्षा और देखभाल",Leo:"आत्मविश्वास और सराहना",Virgo:"व्यावहारिक सहयोग",
 Libra:"संतुलन और आपसी समझ",Scorpio:"गहराई और भरोसा",Sagittarius:"स्वतंत्रता और साझा अनुभव",
 Capricorn:"धैर्य और जिम्मेदारी",Aquarius:"दोस्ती और व्यक्तिगत पहचान",Pisces:"सहानुभूति और संवेदनशीलता",
};
export function hindiSign(sign:SignName){return signs[sign];}
export function hindiPlanet(planet:PlanetName){return planets[planet];}

export function localizeReport(report:MarriageStoryReport,lang:ReportLanguage):MarriageStoryReport {
 if(lang==="en")return report;
 const r=report,p=r.chart,venus=p.planets.find(x=>x.name==="Venus"),
 moon=p.planets.find(x=>x.name==="Moon"),seventh=p.planets.find(x=>x.name===p.seventhLord),
 fifth=p.planets.find(x=>x.name===p.fifthLord);
 const house=(num:number|undefined)=>num?String(num):"अज्ञात";
 const sig=(s:SignName)=>signs[s];
 const pl=(s:PlanetName)=>planets[s];
 const linked=r.marriagePath.signals.love>=2;
 const headline=linked?"प्रेम और प्रतिबद्धता के बीच कुछ पारंपरिक कुंडली संबंध":"रिश्तों के मिले-जुले संकेत — कोई एक निश्चित रास्ता नहीं";
 const summary=linked
  ?"पंचम और सप्तम भाव से जुड़े कुछ वास्तविक ग्रह संकेत एक-दूसरे से जुड़े हैं। पर इसका मतलब प्रेम विवाह की गारंटी नहीं है। परिवार, पारस्परिक सहमति और आपके चुनाव सबसे महत्वपूर्ण हैं।"
  :"सीमित पारंपरिक नियमों में प्रेम और विवाह भावों के संकेत अलग-अलग दिखते हैं। इससे अरेंज मैरिज का निष्कर्ष नहीं निकलता; केवल इन ग्रह स्थितियों से विवाह का प्रकार तय नहीं होता।";
 const paragraphs:Record<string,string[]>={
  path:[
   summary,
   "पंचम भाव में "+sig(p.fifth)+" राशि और उसका स्वामी "+pl(p.fifthLord)+" भाव "+house(fifth?.wholeSignHouse)+" में है। सप्तम भाव में "+sig(p.seventh)+" राशि और उसका स्वामी "+pl(p.seventhLord)+" भाव "+house(seventh?.wholeSignHouse)+" में है। इन वास्तविक स्थितियों से पारंपरिक प्रतीकों की तुलना की जाती है।",
   "पंचम-सप्तम संबंध न मिलने का मतलब अरेंज मैरिज नहीं है। परिवार का सहयोग, संस्कृति, आपकी सहमति और जीवन की परिस्थितियाँ चार्ट से नहीं जानी जा सकतीं।",
  ],
  love:[
   "शुक्र "+(venus?sig(venus.sign):"अज्ञात राशि")+" में, भाव "+house(venus?.wholeSignHouse)+" पर है। वैदिक परंपरा में इस राशि को "+(venus?themed[venus.sign]:"रिश्तों")+" जैसे विषयों से जोड़ा जाता है। यह आत्मचिंतन का संकेत है, व्यक्तित्व का प्रमाण नहीं।",
   "चंद्र "+(moon?sig(moon.sign):"अज्ञात राशि")+" में, भाव "+house(moon?.wholeSignHouse)+" पर है। इसके प्रतीकात्मक विषयों में "+(moon?themed[moon.sign]:"भावनाएँ")+" शामिल हैं। ग्रह स्थिति आपके वास्तविक व्यवहार की सटीक जानकारी नहीं देती।",
   "आपने अपने रिश्ते की जो स्थिति बताई है, उसे आपकी रुचि समझने के लिए उपयोग किया गया है, खगोलीय गणना बदलने के लिए नहीं।",
  ],
  partner:[
   "सप्तम भाव "+sig(p.seventh)+" राशि में है। पारंपरिक रूप से इससे "+themed[p.seventh]+" के विषय जुड़े माने जाते हैं। इसे अपनी साझेदारी की अपेक्षाओं पर विचार करने के लिए इस्तेमाल करें।",
   "सप्तम स्वामी "+pl(p.seventhLord)+" "+(seventh?sig(seventh.sign):"अज्ञात राशि")+" और भाव "+house(seventh?.wholeSignHouse)+" में है। पारंपरिक व्याख्या में यह साझेदारी के अन्य जीवन-क्षेत्रों से प्रतीकात्मक संबंध दिखाता है।",
   p.navamsa?"नवांश (D9) में शुक्र "+sig(p.navamsa.venus)+" और सप्तम स्वामी "+sig(p.navamsa.seventhLord)+" में है। यह एक अतिरिक्त पारंपरिक संदर्भ है, किसी असली भविष्य के साथी के गुणों का प्रमाण नहीं।":"प्रमाणित नवांश (D9) विवरण उपलब्ध नहीं है। इसलिए उसके नाम पर कोई काल्पनिक ग्रह स्थिति नहीं दिखाई गई है।",
  ],
  timing:r.timing.status==="supported"
   ?["प्रदाता से "+r.timing.windows.length+" सत्यापित दशा-अवधियाँ मिलीं जो पारंपरिक संबंध संकेतों के ग्रहों से जुड़ी हैं। नीचे दिखाई गई तिथियाँ सिर्फ दशा अवधियों की हैं, शादी होने की भविष्यवाणी नहीं।",
      "इन ग्रह-अवधियों के आधार पर निश्चित शादी की तारीख, वर्ष या विवाह की गारंटी देना उचित नहीं है। व्यक्तिगत चुनाव और परिस्थितियाँ अधिक महत्वपूर्ण हैं।"]
   :["इस रिपोर्ट के लिए उचित रूप से सत्यापित दशा-अवधियाँ उपलब्ध नहीं थीं। दिखने में आकर्षक लेकिन मनगढ़ंत शादी का वर्ष बताने के बजाय यह सीमा स्पष्ट रखी गई है।",
      "पंचम/सप्तम स्वामी और शुक्र की वास्तविक ग्रह स्थितियों पर आधारित पारंपरिक प्रतीक दशा-समय अनुमान के बिना भी चर्चा किए जा सकते हैं।"],
  "married-life":[
   "सप्तम भाव का स्वामी "+pl(p.seventhLord)+" भाव "+house(seventh?.wholeSignHouse)+" में है। पारंपरिक दृष्टि से यह आपके रिश्ते में सहयोग, अपेक्षाओं और साझे लक्ष्यों पर विचार करने का अवसर दे सकता है।",
   "चंद्र की "+(moon?sig(moon.sign):"अज्ञात")+" राशि का संबंध प्रतीकात्मक रूप से "+(moon?themed[moon.sign]:"भावनाओं")+" से माना जाता है। असली रिश्तों में स्पष्ट संवाद, आपसी सम्मान और सीमाएँ किसी ग्रह से अधिक महत्वपूर्ण हैं।",
   "कुंडली यह निश्चित नहीं बता सकती कि विवाह खुशहाल, मुश्किल, जल्दी या देर से होगा। यह सिर्फ पारंपरिक प्रतीकों को समझाने का तरीका है।",
  ],
  evidence:[
   "आपका सत्यापित लग्न "+sig(p.rising)+" है। लाहिड़ी निरयण राशि-चक्र के आधार पर पूरे-राशि वाले भाव निकाले गए हैं। पंचम भाव "+sig(p.fifth)+" और सप्तम भाव "+sig(p.seventh)+" में है।",
   "शुक्र: "+(venus?sig(venus.sign):"अज्ञात")+" (भाव "+house(venus?.wholeSignHouse)+"); चंद्र: "+(moon?sig(moon.sign):"अज्ञात")+" (भाव "+house(moon?.wholeSignHouse)+"); सप्तम स्वामी "+pl(p.seventhLord)+": "+(seventh?sig(seventh.sign):"अज्ञात")+"। इन ग्रह स्थितियों का स्रोत ज्योतिष API है।",
   "इस रिपोर्ट में काल्पनिक विवाह प्रतिशत, निश्चित सफलता दर या मनगढ़ंत समय नहीं हैं। नीचे वास्तविक गणना-आधारित संकेतों की व्याख्या देख सकते हैं।",
  ],
  keepsake:[
   "आपकी इस रिपोर्ट का मुख्य प्रतीकात्मक विषय है: "+headline+"।",
   "आपकी मुख्य रुचि थी: "+({path:"लव या अरेंज मैरिज",timing:"पारंपरिक विवाह समय",partner:"भविष्य के रिश्तों के विषय"}[r.context.interest])+"। उपयोगी लगे तो विचार करें; जीवन का अनुभव और चुनाव किसी भी ज्योतिषीय संकेत से ज्यादा अहम हैं।",
   "इस रिपोर्ट को PDF के रूप में सुरक्षित रख सकते हैं। यह पारंपरिक व्याख्या है, भविष्य के साथी या शादी की पक्की जानकारी नहीं।",
  ],
 };
 const meta:Record<string,[string,string,string,string?]>={
  path:["आपके विवाह का रास्ता",headline,"आपकी पसंद","ये पारंपरिक प्रतीक हैं, निजी निर्णय या निश्चित भविष्यवाणी नहीं।"],
  love:["आपका प्रेम स्वभाव","शुक्र और चंद्र के संकेत","आपका दिल"],
  partner:["भविष्य के रिश्तों के विषय","किसी व्यक्ति की पहचान नहीं, बस प्रतीक","साझेदारी","कुंडली से किसी वास्तविक भविष्य के व्यक्ति की पहचान या व्यक्तिगत गुण निश्चित नहीं किए जा सकते।"],
  timing:["प्रतिबद्धता के पारंपरिक समय","दशा-अवधियाँ शादी की निश्चित तारीख नहीं हैं।","समय","दशा केवल पारंपरिक संदर्भ है; इसे शादी की भविष्यवाणी न मानें।"],
  "married-life":["साथ मिलकर जीवन बनाना","सम्मान, समझ और सहयोग","साथ"],
  evidence:["इन संकेतों का आधार","हर व्याख्या के पीछे वास्तविक गणना","प्रमाण"],
  keepsake:["आपकी निजी कहानी","आपकी कहानी के अगले पन्ने आपके हाथ में हैं","आपका स्मृति-पत्र","यह रिपोर्ट व्यक्तिगत चिंतन और मनोरंजन के लिए है।"],
 };
 const chapters:Chapter[]=r.chapters.map(ch=>{
  const m=meta[ch.id];
  return {...ch,title:m?.[0]||ch.title,introduction:m?.[1]||ch.introduction,eyebrow:m?.[2]||ch.eyebrow,paragraphs:paragraphs[ch.id]||ch.paragraphs,note:m?.[3]};
 });
 const evidence:ChartEvidence[]=r.evidence.map(item=>{
  const titleById:Record<string,string>={
   asc:"जन्म लग्न",houses:"पंचम और सप्तम भाव",rulers:"भाव स्वामियों की स्थिति",
   cross:"प्रेम-विवाह भाव संबंध",venus:"शुक्र का संकेत",moon:"चंद्र का संकेत",
   seven:"सप्तम भाव स्वामी",d9:"नवांश संबंध",timing:"दशा-अवधि का स्रोत",
  };
  const observationById:Record<string,string>={
   asc:"लग्न: "+sig(p.rising),
   houses:"पंचम: "+sig(p.fifth)+" ("+pl(p.fifthLord)+"); सप्तम: "+sig(p.seventh)+" ("+pl(p.seventhLord)+")",
   rulers:pl(p.fifthLord)+" भाव "+house(fifth?.wholeSignHouse)+"; "+pl(p.seventhLord)+" भाव "+house(seventh?.wholeSignHouse),
   cross:"पंचम और सप्तम स्वामियों की वास्तविक भाव-स्थिति स्रोत में दर्ज है।",
   venus:"शुक्र: "+(venus?sig(venus.sign):"अज्ञात")+", भाव "+house(venus?.wholeSignHouse),
   moon:"चंद्र: "+(moon?sig(moon.sign):"अज्ञात")+", भाव "+house(moon?.wholeSignHouse),
   seven:"सप्तम स्वामी "+pl(p.seventhLord)+": "+(seventh?sig(seventh.sign):"अज्ञात")+", भाव "+house(seventh?.wholeSignHouse),
   d9:p.navamsa?"नवांश शुक्र: "+sig(p.navamsa.venus)+"; सप्तम स्वामी: "+sig(p.navamsa.seventhLord):"नवांश उपलब्ध नहीं",
   timing:r.timing.windows.map(w=>w.name+": "+w.start+" — "+w.end).join("; "),
  };
  const meaningById:Record<string,string>={
   asc:"लाहिड़ी राशि-चक्र के इस सत्यापित लग्न से पूरे राशि वाले भाव गिने जाते हैं।",
   houses:"पंचम भाव को पारंपरिक रूप से रोमांस और सप्तम भाव को प्रतिबद्ध साझेदारी से जोड़ा जाता है।",
   rulers:"ये भाव स्वामी अलग-अलग प्रतीकात्मक संबंध विषय दिखाते हैं; निश्चित विवाह प्रकार नहीं।",
   cross:"कुछ परंपराएँ पंचम-सप्तम संबंध को रोमांस और प्रतिबद्धता के बीच संकेत मानती हैं, यह भविष्यवाणी नहीं।",
   venus:"शुक्र को पारंपरिक रूप से आकर्षण और स्नेह से जोड़ा जाता है। यह वास्तविक विवाह परिणाम नहीं बताता।",
   moon:"चंद्र का प्रयोग भावनात्मक सहजता की प्रतीकात्मक व्याख्या के लिए किया जाता है।",
   seven:"सप्तम स्वामी की स्थिति एक पारंपरिक साझेदारी-विषय देती है, वास्तविक साथी की पहचान नहीं।",
   d9:"नवांश दूसरी पारंपरिक कुंडली का संदर्भ है; इससे किसी व्यक्ति का स्वभाव साबित नहीं होता।",
   timing:"ये प्रदाता द्वारा लौटाई गई वास्तविक दशा तिथियाँ हैं, विवाह की अनुमानित तिथि नहीं।",
  };
  return {...item,title:titleById[item.id]||item.title,observation:observationById[item.id]||item.observation,meaning:meaningById[item.id]||item.meaning};
 });
 return {...r,marriagePath:{...r.marriagePath,headline,summary,caveat:"विवाह का निश्चित प्रकार या प्रतिशत निकालने का दावा नहीं किया जाता।"},
  timing:{...r.timing,description:r.timing.status==="supported"?"यह सत्यापित दशा-अवधियों का पारंपरिक संदर्भ है, निश्चित विवाह समय नहीं।":"उचित दशा-अवधियाँ सत्यापित नहीं हो सकीं; कोई मनगढ़ंत समय नहीं दिखाया गया।",windows:r.timing.windows.map(w=>({...w,why:"यह संबंधित पारंपरिक ग्रह-दशा है, विवाह का अनुमान नहीं।"}))},
  evidence,chapters,source:{...r.source,
   methods:["सत्यापित निरयण ग्रह स्थितियाँ","पूरी-राशि के पारंपरिक भाव","पंचम-सप्तम स्वामी तुलना",...(p.navamsa?["नवांश ग्रह स्थितियाँ"]:[]),...(r.timing.status==="supported"?["सत्यापित दशा-अवधियाँ"]:[])],
   partial:[...(!p.navamsa?["नवांश की गणना उपलब्ध नहीं"]:[]),...(r.timing.status!=="supported"?["दशा के समय की गणना उपलब्ध नहीं"]:[])]},
  disclaimer:"LOVORA पारंपरिक वैदिक ज्योतिष के प्रतीकों पर आधारित व्यक्तिगत चिंतन और मनोरंजन है। ज्योतिष विवाह का प्रकार, साथी की पहचान, समय या जीवन के परिणाम वैज्ञानिक रूप से निश्चित नहीं बता सकता। आपकी सहमति, निर्णय और परिस्थितियाँ अधिक महत्वपूर्ण हैं।",
 };
}
