import type {MarriageStoryReport, DeepDive, SignName, PlanetName} from "./types";
type Lang="en"|"hi";
type Bi={en:string;hi:string};
const sign:Record<SignName,Bi>={
 Aries:{en:"independence and clear initiative",hi:"स्वतंत्रता और साफ पहल"},
 Taurus:{en:"stability, affection and reliability",hi:"स्थिरता, अपनापन और भरोसा"},
 Gemini:{en:"curiosity and open conversation",hi:"जिज्ञासा और खुली बातचीत"},
 Cancer:{en:"emotional security and nurturing care",hi:"भावनात्मक सुरक्षा और देखभाल"},
 Leo:{en:"warmth, visibility and appreciation",hi:"गर्मजोशी और सराहना"},
 Virgo:{en:"thoughtful support and practical care",hi:"समझदारी और व्यावहारिक देखभाल"},
 Libra:{en:"fairness and shared decisions",hi:"निष्पक्षता और साझा फैसले"},
 Scorpio:{en:"trust, depth and private boundaries",hi:"भरोसा, गहराई और निजी सीमाएँ"},
 Sagittarius:{en:"shared learning and freedom",hi:"साझा सीख और स्वतंत्रता"},
 Capricorn:{en:"patient commitment and responsibility",hi:"धैर्य, प्रतिबद्धता और जिम्मेदारी"},
 Aquarius:{en:"friendship and respect for individuality",hi:"दोस्ती और अलग पहचान का सम्मान"},
 Pisces:{en:"empathy and imagination",hi:"सहानुभूति और कल्पना"}
};
const house:Record<number,Bi>={
 1:{en:"self-expression and independence",hi:"अपनी पहचान और स्वतंत्रता"},
 2:{en:"shared finances and family values",hi:"साझा वित्त और पारिवारिक मूल्य"},
 3:{en:"communication and daily listening",hi:"संवाद और रोज़मर्रा में सुनना"},
 4:{en:"home and emotional security",hi:"घर और भावनात्मक सुरक्षा"},
 5:{en:"romance and personal creativity",hi:"प्रेम और रचनात्मकता"},
 6:{en:"shared chores, routines and repair after conflict",hi:"दिनचर्या, घरेलू जिम्मेदारियाँ और मतभेद सुलझाना"},
 7:{en:"commitment, consent and mutual agreements",hi:"प्रतिबद्धता, सहमति और आपसी फैसले"},
 8:{en:"trust and difficult conversations",hi:"भरोसा और कठिन बातचीत"},
 9:{en:"shared beliefs and learning",hi:"साझा विश्वास और सीख"},
 10:{en:"work and public responsibilities",hi:"काम और सामाजिक जिम्मेदारियाँ"},
 11:{en:"friendship and community support",hi:"दोस्ती और सामाजिक सहयोग"},
 12:{en:"privacy, rest and personal space",hi:"निजता, आराम और व्यक्तिगत जगह"}
};
const statuses:Record<MarriageStoryReport["context"]["status"],Bi>={
 single:{en:"Because you chose single, these themes are prompts for deciding what you value before a relationship starts; they describe no future person.",hi:"आपने सिंगल चुना है। ये संकेत अपनी अपेक्षाओं पर सोचने के लिए हैं; किसी अनजान व्यक्ति का वर्णन नहीं।"},
 dating:{en:"Because you are dating, compare symbolic themes with your real conversations and the other person's actions.",hi:"आप डेट कर रहे हैं, इसलिए प्रतीकात्मक संकेतों की तुलना वास्तविक बातचीत और व्यवहार से करें।"},
 relationship:{en:"Because you are in a relationship, use these themes to talk openly with your partner, not to judge them.",hi:"आप रिश्ते में हैं। इन बातों से साथी के साथ खुलकर बातचीत करें, किसी को परखने का फैसला न सुनाएँ।"},
 engaged:{en:"Because you are engaged, discuss finances, family expectations and mutual decisions explicitly; symbols do not replace consent.",hi:"आपकी सगाई हुई है। खर्च, परिवार की अपेक्षाएँ और आपसी फैसलों पर साफ बात करें; प्रतीक सहमति की जगह नहीं लेते।"},
 private:{en:"You kept your relationship status private, so no assumptions about your current partner or circumstances are made.",hi:"आपने रिश्ते की स्थिति निजी रखी है, इसलिए वर्तमान साथी या परिस्थितियों पर कोई अनुमान नहीं लगाया गया।"}
};
const interests:Record<MarriageStoryReport["context"]["interest"],Bi>={
 path:{en:"You asked about love versus arranged marriage. A chart cannot decide how choice, family involvement and mutual consent will unfold.",hi:"आपने लव या अरेंज मैरिज पूछा। पसंद, परिवार की भूमिका और आपसी सहमति कैसे होगी, यह चार्ट तय नहीं कर सकता।"},
 timing:{en:"You asked about timing. A verified Dasha interval is still not a wedding date or a deadline for commitment.",hi:"आपने समय पूछा। सत्यापित दशा-अवधि भी शादी की तारीख या किसी फैसले की समय-सीमा नहीं है।"},
 partner:{en:"You asked about a future partner. These placements cannot reveal a real person's identity, appearance or conduct.",hi:"आपने भावी साथी के बारे में पूछा। ये ग्रह स्थितियाँ किसी वास्तविक व्यक्ति की पहचान, रूप या व्यवहार नहीं बतातीं।"}
};
const tr=(entry:Bi,l:Lang)=>entry[l];
function card(title:string,observation:string,meaning:string,reflection:string,evidenceIds:string[]):DeepDive{
 return {title,observation,meaning,reflection,evidenceIds};
}
export function addNarrativeDepth(report:MarriageStoryReport,lang:Lang):MarriageStoryReport{
 const c=report.chart,hi=lang==="hi",ctx=report.context;
 const get=(name:PlanetName)=>{const found=c.planets.find(p=>p.name===name);if(!found)throw new Error("MISSING_CHART_POSITION");return found;};
 const venus=get("Venus"),moon=get("Moon"),r5=get(c.fifthLord),r7=get(c.seventhLord);
 const s=(name:SignName)=>tr(sign[name],lang),h=(n:number)=>tr(house[n],lang);
 const st=tr(statuses[ctx.status],lang),interest=tr(interests[ctx.interest],lang);
 const context=hi?"आपने "+ctx.status+" स्थिति और "+ctx.interest+" मुख्य विषय चुना है।":"Your chosen status is "+ctx.status+" and your priority is "+ctx.interest+".";
 const linked=report.marriagePath.signals.love>=2;
 const rulersLink=c.fifthLord===c.seventhLord||r5.sign===r7.sign||r5.wholeSignHouse===7||r7.wholeSignHouse===5;
 const sections:Record<string,DeepDive[]>={
 path:[
  card(hi?"प्रेम और प्रतिबद्धता के भाव":"Romance and commitment in this chart",
   hi?"पंचम "+c.fifth+" का स्वामी "+c.fifthLord+" भाव "+r5.wholeSignHouse+" में; सप्तम "+c.seventh+" का स्वामी "+c.seventhLord+" भाव "+r7.wholeSignHouse+" में है।":"The 5th house is "+c.fifth+", ruled by "+c.fifthLord+" in house "+r5.wholeSignHouse+". The 7th is "+c.seventh+", ruled by "+c.seventhLord+" in house "+r7.wholeSignHouse+".",
   linked?(hi?"इन पारंपरिक संकेतों में रोमांस और साझेदारी का कुछ संबंध है। "+(rulersLink?"इसमें भाव-स्वामियों की स्थिति योगदान देती है।":"शुक्र की स्थिति इसका आधार है।")+" इससे लव मैरिज की गारंटी नहीं होती।":"The verified placements suggest a symbolic overlap between romance and commitment. "+(rulersLink?"The house rulers contribute to that overlap.":"Venus contributes to the pattern.")+" An overlap is not a marriage-type prediction."):(hi?"इन सीमित पारंपरिक संकेतों में ऐसा स्पष्ट संबंध नहीं मिला। इससे अरेंज मैरिज का निष्कर्ष निकालना गलत होगा।":"These limited traditional indicators do not establish a clear 5th–7th connection. That is not evidence for an arranged marriage either."),
   hi?"आप प्रेम, परिवार और अपनी सहमति के बीच क्या प्राथमिकता रखेंगे?":"What balance of attraction, family support and consent would feel right for you?",["houses","rulers"]),
  card(hi?"विवाह के अलग संकेत":"What different symbols contribute",
   hi?"शुक्र "+venus.sign+" राशि में भाव "+venus.wholeSignHouse+" और सप्तम स्वामी "+r7.sign+" राशि में भाव "+r7.wholeSignHouse+" पर है।":"Venus is in "+venus.sign+" in house "+venus.wholeSignHouse+"; the partnership ruler is in "+r7.sign+" in house "+r7.wholeSignHouse+".",
   hi?"शुक्र "+s(venus.sign)+" से जुड़ा है, जबकि सप्तम स्वामी "+h(r7.wholeSignHouse)+" से। इन दोनों को जोड़कर सोचें, एक के आधार पर निश्चित निष्कर्ष न बनाएँ।":"Venus invites reflection on "+s(venus.sign)+" while the 7th ruler adds "+h(r7.wholeSignHouse)+". These are different symbolic dimensions, not votes for a predetermined outcome.",
   hi?"कौन-सा वास्तविक संबंध-मूल्य हर तरह की शादी में जरूरी रहेगा?":"Which relationship value matters regardless of how two people meet?",["venus","seven"]),
  card(hi?"आपके चुने सवाल का संदर्भ":"Your own question and life stage",context,interest+" "+st,
   hi?"आप अपने अगले बड़े निर्णय से पहले किस बातचीत को प्राथमिकता देंगे?":"What important conversation would you want before a major relationship decision?",["houses"])
 ],
 love:[
  card(hi?"शुक्र की व्यक्तिगत व्याख्या":"A closer Venus reading",
   hi?"शुक्र "+venus.sign+" राशि में, भाव "+venus.wholeSignHouse+" पर है।":"Venus is in "+venus.sign+", whole-sign house "+venus.wholeSignHouse+".",
   hi?"इस राशि में "+s(venus.sign)+" और इस भाव में "+h(venus.wholeSignHouse)+" की प्रतीकात्मक थीम मिलती हैं। इससे स्वभाव का वैज्ञानिक निष्कर्ष नहीं निकलता।":"This combines traditional "+s(venus.sign)+" symbolism with the house theme of "+h(venus.wholeSignHouse)+". It is a precise chart-based prompt, not a personality diagnosis.",
   hi?"आप स्नेह देने और पाने के अपने तरीके को कैसे समझाते हैं?":"How would you explain what giving and receiving affection means to you?",["venus"]),
  card(hi?"आकर्षण और भावनात्मक सहारा":"Venus meets the Moon",
   hi?"शुक्र "+venus.sign+" (भाव "+venus.wholeSignHouse+") में और चंद्र "+moon.sign+" (भाव "+moon.wholeSignHouse+") में है।":"Venus is in "+venus.sign+" (house "+venus.wholeSignHouse+"); Moon is in "+moon.sign+" (house "+moon.wholeSignHouse+").",
   venus.sign===moon.sign?(hi?"दोनों ग्रह एक ही राशि में हैं। इस प्रतीकात्मक समानता से वास्तविक भावनात्मक मेल साबित नहीं होता।":"Both share a sign, highlighting a common traditional theme without proving real-life emotional compatibility."):(hi?"शुक्र की "+s(venus.sign)+" और चंद्र की "+s(moon.sign)+" थीम अलग हैं। यह बातचीत के दो पहलू हैं, किसी आंतरिक संघर्ष का प्रमाण नहीं।":"Venus brings "+s(venus.sign)+" and the Moon brings "+s(moon.sign)+". Read them as two different areas for reflection, not evidence of inner conflict."),
   hi?"आपको कब अपनापन और कब व्यक्तिगत जगह चाहिए होती है?":"When do you value reassurance, and when do you need personal space?",["moon","venus"]),
  card(hi?"आपके अभी के जीवन में प्रेम":"What affection means in your present life",context,st+" "+interest,
   hi?"सामने वाले के व्यवहार और अपनी जरूरतों पर बात करने का कौन-सा तरीका सबसे अच्छा होगा?":"What is one kind way to communicate a need instead of hoping it is guessed?",["venus","moon"])
 ],
 partner:[
  card(hi?"साझेदारी के पारंपरिक विषय":"The partnership-house foundation",
   hi?"सप्तम भाव "+c.seventh+" है; उसका स्वामी "+c.seventhLord+" "+r7.sign+" में भाव "+r7.wholeSignHouse+" पर है।":"The 7th house is "+c.seventh+"; its ruler "+c.seventhLord+" is in "+r7.sign+", house "+r7.wholeSignHouse+".",
   hi?"यह "+s(c.seventh)+" और "+h(r7.wholeSignHouse)+" की दो परतें दिखाता है। किसी असली व्यक्ति का नाम, रूप या व्यवहार इससे नहीं पता चलता।":"Taken together, these show symbolic themes of "+s(c.seventh)+" and "+h(r7.wholeSignHouse)+". They cannot identify a future person or forecast their behavior.",
   hi?"किस साझेदारी में आप दोनों की अलग पहचान का सम्मान होगा?":"What would a partnership look like where both people retain their individuality?",["houses","seven"]),
  card(hi?"नवांश का अलग आधार":"The Navamsa cross-check",
   hi?"जन्म चार्ट में सप्तम स्वामी "+c.seventhLord+" "+r7.sign+" में है।":"The birth chart places the 7th ruler "+c.seventhLord+" in "+r7.sign+".",
   c.navamsa?(hi?"सत्यापित नवांश डेटा में शुक्र "+c.navamsa.venus+" और सप्तम स्वामी "+c.navamsa.seventhLord+" में हैं। यह अलग पारंपरिक संदर्भ है, भावी साथी का विवरण नहीं।":"Verified Navamsa (D9) data puts Venus in "+c.navamsa.venus+" and the 7th ruler in "+c.navamsa.seventhLord+". This is an independent symbolic reference, not a real partner profile."):(hi?"नवांश का पुष्ट डेटा नहीं मिला। रिपोर्ट में उसकी जगह कोई काल्पनिक ग्रह नहीं जोड़ा गया है।":"Validated D9 positions are unavailable, so a secondary chart is not invented or filled with guessed placements."),
   hi?"वास्तविक व्यवहार देखकर साथी की कौन-सी बात आप जाँचना चाहेंगे?":"Which partner qualities would you rather evaluate through real actions?",c.navamsa?["seven","d9"]:["seven"]),
  card(hi?"अपने संबंध के मानक":"Practical standards for partnership",context,st+" "+interest,
   hi?"दो ऐसे मूल्य कौन-से हैं जिन पर आप समझौता नहीं करेंगे?":"Which two values would you want to protect in any partnership?",["seven"])
 ],
 timing:[
  card(hi?"दशा के डेटा की सीमा":"What timing data actually shows",
   hi?"समय स्रोत: "+(report.timing.status==="supported"?"सत्यापित दशा-अवधियाँ मिलीं।":"सत्यापित दशा उपलब्ध नहीं।"):"Dasha data: "+(report.timing.status==="supported"?"verified periods returned.":"no verified periods available."),
   report.timing.status==="supported"?(hi?"प्रदाता ने "+report.timing.windows.map(w=>w.name+" "+w.start+"–"+w.end).join("; ")+" लौटाए हैं। ये दशा अवधि हैं, शादी की तारीख नहीं।":"Provider-returned intervals: "+report.timing.windows.map(w=>w.name+" "+w.start+"–"+w.end).join("; ")+". They are traditional Dasha periods, not wedding dates."):(hi?"विश्वसनीय अवधि उपलब्ध नहीं होने पर यह रिपोर्ट कोई वर्ष नहीं गढ़ती।":"With no reliably parsed timing data, the report does not fabricate years or wedding windows."),
   hi?"किस चीज की तैयारी आप बिना अनुमानित तारीख के कर सकते हैं?":"What would you prepare for even without a predicted date?",report.timing.status==="supported"?["timing"]:["houses"]),
  card(hi?"वास्तविक तैयारी की अहमियत":"Readiness is not a planetary deadline",context,interest+" "+st,
   hi?"किस फैसले की गति आपके अपने हाथ में रहनी चाहिए?":"Which important decision deserves to happen at your own pace?",["houses"]),
  card(hi?"आज के लिए एक वास्तविक प्राथमिकता":"What matters in the present",
   hi?"सप्तम स्वामी भाव "+r7.wholeSignHouse+" और चंद्र भाव "+moon.wholeSignHouse+" में है।":"The 7th ruler is in house "+r7.wholeSignHouse+" and Moon is in house "+moon.wholeSignHouse+".",
   hi?"इन भावों में "+h(r7.wholeSignHouse)+" और "+h(moon.wholeSignHouse)+" के विषय आते हैं। इनसे तय समय नहीं, बल्कि संवाद के विषय निकलते हैं।":"These houses traditionally emphasize "+h(r7.wholeSignHouse)+" and "+h(moon.wholeSignHouse)+". They are prompts for practical conversations, not a schedule for your life.",
   hi?"कौन-सी जरूरी बात आप जल्द स्पष्ट करना चाहेंगे?":"Which necessary conversation could you clarify soon?",["seven","moon"])
 ],
 "married-life":[
  card(hi?"दिनचर्या और साझा जिम्मेदारियाँ":"Everyday partnership responsibilities",
   hi?"सप्तम स्वामी "+c.seventhLord+" भाव "+r7.wholeSignHouse+" में है।":"The 7th ruler "+c.seventhLord+" occupies house "+r7.wholeSignHouse+".",
   hi?"इस भाव का पारंपरिक विषय "+h(r7.wholeSignHouse)+" है। यह विवाहित जीवन का नतीजा नहीं बताता, लेकिन जिम्मेदारियाँ तय करने का सवाल देता है।":"Its traditional theme is "+h(r7.wholeSignHouse)+". That is not a prediction of married-life success, but it provides a focused conversation about shared expectations.",
   hi?"घर और जिम्मेदारियों में बराबरी कैसे तय करेंगे?":"How could two partners divide daily responsibilities fairly?",["seven"]),
  card(hi?"मतभेद के बाद जुड़ना":"Affection when life gets difficult",
   hi?"शुक्र "+venus.sign+" (भाव "+venus.wholeSignHouse+") और चंद्र "+moon.sign+" (भाव "+moon.wholeSignHouse+") में हैं।":"Venus is "+venus.sign+" (house "+venus.wholeSignHouse+"); Moon is "+moon.sign+" (house "+moon.wholeSignHouse+").",
   hi?"शुक्र की "+s(venus.sign)+" और चंद्र की "+s(moon.sign)+" थीम पारंपरिक रूप से अलग भूमिका निभाती हैं। असल जीवन में सुनना और गलती सुधारना ज्यादा महत्वपूर्ण है।":"Venus symbolizes "+s(venus.sign)+" while Moon symbolizes "+s(moon.sign)+". In real life, listening after disagreement and rebuilding trust are skills that matter more.",
   hi?"बहस के बाद आपको कैसा व्यवहार भरोसा देता है?":"What helps you feel heard and safe after a disagreement?",["venus","moon"]),
  card(hi?"आपके जीवन की अवस्था":"Your real-life context",context,st+" "+interest,
   hi?"कौन-सी एक उम्मीद आप साथी के साथ साफ तौर पर बाँटना चाहेंगे?":"Which one expectation would you want to communicate clearly to a partner?",["houses","seven"])
 ]
 };
 const chapters=report.chapters.map(ch=>({...ch,deepDive:sections[ch.id]||[]}));
 for(const ch of chapters)for(const item of ch.deepDive){
  if(item.evidenceIds.some(id=>!report.evidence.some(x=>x.id===id)))throw new Error("DEPTH_EVIDENCE_MISSING");
  if(!item.meaning||!item.reflection||!item.observation)throw new Error("DEPTH_CONTENT_MISSING");
 }
 return {...report,chapters};
}
