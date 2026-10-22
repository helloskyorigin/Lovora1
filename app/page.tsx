'use client';

import { useEffect, useState } from 'react';

type Lang = 'en' | 'hi';
const content = {
  en: {
    nav: ['The experience', 'Discover', 'How it works'], lang:'हिंदी',
    eyebrow:'A PERSONAL VEDIC MARRIAGE READING', title1:'Love Marriage', title2:'or Arranged?',
    tagline:'Your story is written in the stars.',
    description:'An intimate journey through the traditional signs of love, marriage, and the future you wonder about.',
    primary:'Explore my story', free:'A free glimpse first', account:'No account', priceHint:'Complete reading ₹299',
    previewKicker:'A LITTLE GLIMPSE', previewTitle:'A chapter that feels like yours.',
    previewDesc:'Thoughtfully interpreted from your actual birth chart. Never just another horoscope.',
    sample:'ILLUSTRATIVE PREVIEW', sampleHeading:'Your celestial love nature',
    sampleTabs:['Love','Timing','Connection'],
    sampleContent:[
      {h:'The way you love',p:'Explore what traditional relationship indicators symbolize about emotional expression and commitment.'},
      {h:'The seasons of your story',p:'Understand relevant planetary periods when precise birth data makes that possible.'},
      {h:'Your partnership patterns',p:'Read the symbolic themes of connection, harmony and growing together.'},
    ],
    sampleDisclaimer:'Sample interface, not a calculated prediction',
    benefitsKicker:'YOUR STORY, UNFOLDED', benefitsTitle:'More than a question. A whole story.',
    benefits:[
      {n:'01',k:'THE PATH',t:'Love or arranged?',d:'Explore traditional indications surrounding your marriage path.'},
      {n:'02',k:'THE WHEN',t:'Marriage timing',d:'Look into the symbolic planetary periods linked to partnership.'},
      {n:'03',k:'THE CONNECTION',t:'A future together',d:'Discover the relationship qualities associated with your chart.'},
    ],
    stepsKicker:'BEAUTIFULLY SIMPLE',stepsTitle:'Your stars. Your story.',
    steps:[{t:'Your birth moment',d:'Date, time and birthplace.'},{t:'Your free glimpse',d:'A personal chart-based insight.'},{t:'Your complete story',d:'Seven chapters, one-time ₹299.'}],
    chaptersKicker:'THE COMPLETE READING',chaptersTitle:'Seven chapters. One universe — yours.',
    chaptersDesc:'Beautifully written. Gently revealing. Rooted in traditional chart interpretation.',
    chapters:['Your marriage path','Your love nature','Your future partnership','Marriage timing','Life after marriage','Why your chart suggests this','Your keepsake & PDF'],
    chaptersNote:'Explores symbolic traditions. Does not guarantee future outcomes.',
    priceKicker:'EVERY STORY BEGINS SOMEWHERE',priceTitle:'Start with wonder. Go deeper when you choose.',
    priceDescription:'One personal reading. No subscription. No account.',
    priceSub:'one-time', priceFeatures:['Full seven-chapter reading','Traditional chart-based explanations','Beautiful downloadable report','Private report access'],
    priceButton:'See the experience',priceFooter:'Your first glimpse is free.',
    faqKicker:'GOOD TO KNOW', faqTitle:'A little clarity, before the stars.',
    faqs:[
      ['Is the first glimpse really free?','Yes. You can see a personal chart-based insight before deciding whether to unlock the complete ₹299 report.'],
      ['Do I need a partner’s name or details?','No. This reading uses your own birth information and cannot identify or reveal the feelings of a real future spouse.'],
      ['What if my birth time is unknown?','Certain house and timing interpretations may not be possible. The actual reading flow will disclose limitations before payment.'],
      ['Can astrology promise my marriage outcome?','No. LOVORA presents traditional astrology for reflection and entertainment, not scientifically verified future predictions.'],
    ],
    footerTag:'A little stardust. A story that is yours.', footerNote:'Traditional astrology for personal exploration, not certain predictions.', back:'Back to top',
  },
  hi: {
    nav:['एक झलक','क्या मिलेगा','कैसे काम करेगा'], lang:'English',
    eyebrow:'आपकी व्यक्तिगत वैदिक विवाह रीडिंग',title1:'लव मैरिज',title2:'या अरेंज मैरिज?',
    tagline:'आपकी कहानी, सितारों की ज़ुबानी।',
    description:'प्रेम, शादी और रिश्तों के पारंपरिक ज्योतिषीय संकेतों को अपनी जन्मकुंडली से जानें।',
    primary:'अपनी कहानी देखें',free:'पहली झलक मुफ़्त',account:'बिना अकाउंट',priceHint:'पूरी रीडिंग ₹299',
    previewKicker:'आपकी कहानी की झलक',previewTitle:'एक कहानी, जो सिर्फ़ आपकी है।',
    previewDesc:'आपकी वास्तविक जन्मकुंडली से जुड़ी पारंपरिक व्याख्या — सामान्य राशिफल नहीं।',
    sample:'सिर्फ़ उदाहरण',sampleHeading:'आपके प्रेम का स्वभाव',
    sampleTabs:['प्रेम','समय','रिश्ते'],
    sampleContent:[
      {h:'आपका प्रेम करने का अंदाज़',p:'भावनाओं और प्रतिबद्धता से जुड़े पारंपरिक ज्योतिषीय संकेत समझें।'},
      {h:'आपकी कहानी के पड़ाव',p:'जन्म विवरण पर्याप्त होने पर संबंधित पारंपरिक ग्रह-दशाओं को जानें।'},
      {h:'रिश्तों के संकेत',p:'साथ, समझ और साझेदारी से जुड़े प्रतीकात्मक विषयों को समझें।'},
    ],
    sampleDisclaimer:'केवल डिज़ाइन उदाहरण, गणना की गई भविष्यवाणी नहीं',
    benefitsKicker:'आपकी कहानी के अध्याय',benefitsTitle:'सिर्फ़ एक सवाल नहीं, पूरी कहानी।',
    benefits:[
      {n:'01',k:'आपका रास्ता',t:'लव या अरेंज?',d:'अपनी कुंडली में विवाह से जुड़े पारंपरिक संकेत समझें।'},
      {n:'02',k:'कब',t:'विवाह का समय',d:'साझेदारी से जुड़ी प्रतीकात्मक ग्रह-दशाओं को जानें।'},
      {n:'03',k:'रिश्ते',t:'भविष्य का साथ',d:'रिश्तों से जुड़े पारंपरिक गुणों और विषयों को समझें।'},
    ],
    stepsKicker:'बिल्कुल आसान',stepsTitle:'आपके सितारे। आपकी कहानी।',
    steps:[{t:'आपका जन्म विवरण',d:'तारीख, समय और जन्मस्थान।'},{t:'आपकी मुफ़्त झलक',d:'कुंडली पर आधारित एक संकेत।'},{t:'आपकी पूरी कहानी',d:'सात अध्याय, एक बार ₹299।'}],
    chaptersKicker:'पूरी रीडिंग',chaptersTitle:'सात अध्याय। आपकी अपनी कहानी।',
    chaptersDesc:'सुंदर लेखन और पारंपरिक ज्योतिषीय संकेतों की सरल व्याख्या।',
    chapters:['आपका विवाह मार्ग','आपका प्रेम स्वभाव','भविष्य की साझेदारी','विवाह का समय','विवाह के बाद जीवन','आपकी कुंडली के संकेत','आपका कार्ड और PDF'],
    chaptersNote:'प्रतीकात्मक परंपराओं की व्याख्या, भविष्य की गारंटी नहीं।',
    priceKicker:'हर कहानी की शुरुआत होती है',priceTitle:'मुफ़्त झलक से शुरू करें। आगे बढ़ना आपका फ़ैसला।',
    priceDescription:'एक निजी रीडिंग। कोई सब्सक्रिप्शन नहीं, कोई अकाउंट नहीं।',
    priceSub:'सिर्फ़ एक बार',priceFeatures:['सात अध्यायों की पूरी रीडिंग','पारंपरिक कुंडली आधारित व्याख्या','डाउनलोड करने योग्य रिपोर्ट','निजी रिपोर्ट एक्सेस'],
    priceButton:'अनुभव की झलक देखें',priceFooter:'आपकी पहली झलक मुफ़्त है।',
    faqKicker:'ज़रूरी बातें',faqTitle:'सितारों से पहले, कुछ जवाब।',
    faqs:[
      ['क्या पहली झलक मुफ़्त है?','हाँ। आप एक व्यक्तिगत संकेत देख सकते हैं और बाद में पूरी ₹299 रीडिंग लेने का निर्णय कर सकते हैं।'],
      ['क्या पार्टनर का नाम चाहिए?','नहीं। यह रीडिंग आपकी जन्मकुंडली पर आधारित है। इससे असली भविष्य के साथी की पहचान या भावनाएँ पता नहीं चलतीं।'],
      ['अगर जन्म का समय पता नहीं हो?','कुछ भाव और समय संबंधी व्याख्याएँ संभव नहीं होंगी। भुगतान से पहले सीमाएँ बताई जाएँगी।'],
      ['क्या ज्योतिष पक्का भविष्य बता सकता है?','नहीं। LOVORA पारंपरिक ज्योतिष को व्यक्तिगत चिंतन और मनोरंजन के लिए प्रस्तुत करता है।'],
    ],
    footerTag:'थोड़े से सितारे। आपकी अपनी कहानी।',footerNote:'पारंपरिक ज्योतिषीय अनुभव; पक्की भविष्यवाणी नहीं।',back:'ऊपर जाएँ',
  },
} as const;

const starPositions = [[14,22],[74,12],[88,48],[23,79],[56,93],[6,57],[96,77],[44,7],[70,74],[36,62],[92,20]];

function Mark({tiny=false}:{tiny?:boolean}) {
  return <svg className={tiny?'mark tiny':'mark'} viewBox="0 0 48 48" aria-hidden="true" fill="none">
    <circle cx="24" cy="24" r="22" stroke="#e1be8b" strokeOpacity=".75"/>
    <path d="M30 10a14.5 14.5 0 1 0 7.2 26.3A15.5 15.5 0 0 1 30 10Z" fill="#f0bfd6"/>
    <path d="m16 12 1.8 5 5 1.8-5 1.8-1.8 5-1.8-5-5-1.8 5-1.8 1.8-5Z" fill="#f3d299"/>
    <circle cx="34" cy="14" r="2.3" fill="#f3d299"/>
  </svg>;
}

function Orrery({small=false}:{small?:boolean}) {
  return <div className={small?'orrery small':'orrery'} aria-hidden="true">
    <div className="orrery-glow"/>
    {starPositions.map(([x,y],i)=><i className="point-star" key={i} style={{left:`${x}%`,top:`${y}%`,animationDelay:`${i*0.57}s`}}/>)}
    <svg className="orrery-art" viewBox="0 0 640 640">
      <defs>
        <radialGradient id="coreGlow"><stop stopColor="#b876a8" stopOpacity=".36"/><stop offset="1" stopColor="#5b347c" stopOpacity="0"/></radialGradient>
        <linearGradient id="orbitGold" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffebbf"/><stop offset=".52" stopColor="#d2a36e"/><stop offset="1" stopColor="#ffdfaa"/></linearGradient>
        <linearGradient id="pinkHeart" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffd9df"/><stop offset=".6" stopColor="#d99fc4"/><stop offset="1" stopColor="#9e75b8"/></linearGradient>
      </defs>
      <circle cx="320" cy="320" r="300" fill="url(#coreGlow)"/>
      <g className="wheel-ring">
        <circle cx="320" cy="320" r="232" stroke="#c3a3c8" strokeOpacity=".34" fill="none"/>
        <circle cx="320" cy="320" r="218" stroke="#d7b98e" strokeOpacity=".45" strokeDasharray="2 8" fill="none"/>
        <circle cx="320" cy="320" r="195" stroke="#be93c9" strokeOpacity=".25" fill="none"/>
        {Array.from({length:12},(_,i)=>{const a=(i*30-90)*Math.PI/180;return <line key={i} x1={320+222*Math.cos(a)} y1={320+222*Math.sin(a)} x2={320+235*Math.cos(a)} y2={320+235*Math.sin(a)} stroke="#e2c494" strokeOpacity=".7"/>;})}
      </g>
      <g className="orbital-spin one"><ellipse cx="320" cy="320" rx="286" ry="109" transform="rotate(-29 320 320)" stroke="url(#orbitGold)" strokeOpacity=".85" strokeWidth="1.5" fill="none"/><circle cx="72" cy="463" r="9" fill="#e8b8c9"/></g>
      <g className="orbital-spin two"><ellipse cx="320" cy="320" rx="268" ry="108" transform="rotate(44 320 320)" stroke="#d6ade7" strokeOpacity=".65" strokeWidth="1.3" fill="none"/><circle cx="509" cy="509" r="7" fill="#ebc48a"/></g>
      <circle cx="320" cy="320" r="150" fill="#3b214c" fillOpacity=".82" stroke="#e4c393" strokeOpacity=".75" strokeWidth="1.4"/>
      <circle cx="320" cy="320" r="136" stroke="#ae82b8" strokeOpacity=".46" fill="none"/>
      <g className="inner-symbol">
        <path d="M335 223c-51 0-92 41-92 92s41 92 92 92c18 0 34-5 48-14-10 3-19 5-30 5-48 0-87-39-87-87 0-40 26-73 62-84l7-4Z" fill="#ffe9d5"/>
        <path d="M337 306c-18-26-57-12-57 16 0 27 57 65 57 65s57-38 57-65c0-28-39-42-57-16Z" fill="url(#pinkHeart)" stroke="#f6d6dc" strokeWidth="1.4"/>
        <path d="m339 266 4.5 11 11 4.5-11 4.5-4.5 11-4.5-11-11-4.5 11-4.5 4.5-11Z" fill="#ffdb99"/>
      </g>
      <g stroke="#e9d3a6" strokeLinecap="round"><path d="M112 160v22m-11-11h22M527 155v17m-8.5-8.5h17M543 420v17m-8.5-8.5h17M142 524v14m-7-7h14"/><circle cx="478" cy="83" r="2" fill="#e9d3a6"/></g>
    </svg>
  </div>;
}

function MiniStars({index}:{index:number}) {
  const shapes = ['M12 58 43 18 84 43 119 12','M14 19 51 51 80 18 116 43','M13 49 45 13 83 56 118 18'];
  return <svg viewBox="0 0 132 75" aria-hidden="true" className="mini-stars"><path d={shapes[index]} stroke="#bd91ad" strokeWidth="1.6" fill="none"/><circle cx="43" cy="18" r="4" fill="#e6ba88"/><circle cx="84" cy="43" r="3" fill="#e6ba88"/><path d="M111 61v12m-6-6h12" stroke="#dbb789"/></svg>;
}

export default function Home() {
  const [lang, setLang] = useState<Lang>('en');
  const [sample, setSample] = useState(0);
  const c = content[lang];
  useEffect(()=>{document.documentElement.lang=lang;},[lang]);
  useEffect(()=>{
    if(typeof IntersectionObserver==='undefined'||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const els=document.querySelectorAll('[data-reveal]');
    const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target);}}),{threshold:.12,rootMargin:'0px 0px -25px 0px'});
    els.forEach(e=>io.observe(e)); return ()=>io.disconnect();
  },[]);
  return <main id="top" className={lang==='hi'?'site hindi':'site'}>
    <div className="hero-shell">
      <div className="hero-light a"/><div className="hero-light b"/>
      <header className="header wrap">
        <a className="logo" href="#top" aria-label="LOVORA home"><Mark/><span>LOVORA</span></a>
        <nav className="nav" aria-label="Main navigation"><a href="#preview">{c.nav[0]}</a><a href="#discover">{c.nav[1]}</a><a href="#how">{c.nav[2]}</a></nav>
        <button className="language" onClick={()=>setLang(lang==='en'?'hi':'en')} aria-label={lang==='en'?'Switch to Hindi':'Switch to English'}>◎ &nbsp;{c.lang}</button>
      </header>
      <div className="hero wrap">
        <div className="hero-copy">
          <span className="eyebrow bright"><b>✦</b>{c.eyebrow}</span>
          <h1><span>{c.title1}</span><span className="hero-h1-second">{c.title2}</span></h1>
          <p className="hero-tagline">{c.tagline}</p>
          <p className="hero-description">{c.description}</p>
          <a href={`/birth-details?lang=${lang}`} className="cta primary">{c.primary}<span aria-hidden="true">↗</span></a>
          <div className="hero-notes"><span>✧ {c.free}</span><i/><span>{c.account}</span><i/><span>{c.priceHint}</span></div>
        </div>
        <div className="hero-art"><Orrery/><span className="orbital-caption">LOVE <i/> FATE <i/> CONNECTION</span></div>
      </div>
      <span className="hero-bottom-line"/>
    </div>

    <section className="section sample-section" id="preview">
      <div className="wrap preview-layout">
        <div className="preview-intro" data-reveal><span className="eyebrow"><b>✦</b>{c.previewKicker}</span><h2>{c.previewTitle}</h2><p>{c.previewDesc}</p><div className="flourish"><span>✦</span><i/><span>✧</span></div></div>
        <div className="sample-card" data-reveal>
          <div className="sample-head"><span>✦ &nbsp;{c.sample}</span><Mark tiny/></div>
          <h3>{c.sampleHeading}</h3>
          <div className="sample-tabs" role="tablist" aria-label="Reading examples">{c.sampleTabs.map((t,i)=><button key={t} role="tab" aria-selected={sample===i} aria-controls="sample-panel" className={sample===i?'selected':''} onClick={()=>setSample(i)}>{t}</button>)}</div>
          <div className="sample-body" id="sample-panel" role="tabpanel"><span className="sample-spark">✳</span><h4>{c.sampleContent[sample].h}</h4><p>{c.sampleContent[sample].p}</p></div>
          <p className="sample-foot">✦ &nbsp;{c.sampleDisclaimer}</p>
        </div>
      </div>
    </section>

    <section className="section benefits-section" id="discover"><div className="wrap">
      <div className="section-heading" data-reveal><span className="eyebrow"><b>✦</b>{c.benefitsKicker}</span><h2>{c.benefitsTitle}</h2></div>
      <div className="benefit-grid">{c.benefits.map((card,i)=><article className="benefit-card" key={card.n} data-reveal><div className="benefit-num"><span>{card.n} / 03</span><span>✧</span></div><MiniStars index={i}/><p className="benefit-kicker">{card.k}</p><h3>{card.t}</h3><p>{card.d}</p></article>)}</div>
    </div></section>

    <section className="section steps-section" id="how"><div className="wrap">
      <div className="section-heading" data-reveal><span className="eyebrow"><b>✦</b>{c.stepsKicker}</span><h2>{c.stepsTitle}</h2></div>
      <div className="step-grid">{c.steps.map((step,i)=><div className="step" key={step.t} data-reveal><span className="step-number">0{i+1}</span><h3>{step.t}</h3><p>{step.d}</p></div>)}</div>
    </div></section>

    <section className="section chapters-section"><div className="wrap chapters-layout">
      <div className="chapter-art"><Orrery small/></div>
      <div className="chapter-copy" data-reveal><span className="eyebrow bright"><b>✦</b>{c.chaptersKicker}</span><h2>{c.chaptersTitle}</h2><p className="chapter-intro">{c.chaptersDesc}</p>
        <ol className="chapter-list">{c.chapters.map((t,i)=><li key={t}><span>0{i+1}</span><p>{t}</p><span>✧</span></li>)}</ol>
        <p className="chapter-note">{c.chaptersNote}</p>
      </div>
    </div></section>

    <section className="section pricing-section" id="pricing"><div className="wrap pricing-layout">
      <div className="pricing-intro" data-reveal><span className="eyebrow"><b>✦</b>{c.priceKicker}</span><h2>{c.priceTitle}</h2><p>{c.priceDescription}</p></div>
      <div className="pricing-card" data-reveal><div className="pricing-star">✦</div><div className="pricing-amount">₹299</div><p className="pricing-once">{c.priceSub}</p><div className="pricing-divider"/><ul>{c.priceFeatures.map(t=><li key={t}><span>✓</span>{t}</li>)}</ul>
        <a className="cta primary pricing-cta" href={`/birth-details?lang=${lang}`}>{c.priceButton}<span aria-hidden="true">↗</span></a><p className="pricing-note">{c.priceFooter}</p>
      </div>
    </div></section>

    <section className="section faq-section"><div className="wrap faq-layout"><div data-reveal><span className="eyebrow"><b>✦</b>{c.faqKicker}</span><h2>{c.faqTitle}</h2></div><div className="faq-items">{c.faqs.map(([q,a])=><details key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div></div></section>
    <footer className="footer"><div className="wrap footer-top"><div><a className="logo" href="#top"><Mark/><span>LOVORA</span></a><p>{c.footerTag}</p></div><a className="back-top" href="#top">{c.back} ↑</a></div><div className="wrap footer-bottom"><p>{c.footerNote}</p><nav aria-label="Help and legal" className="lovora-legal-links"><a href="/recover">Recover My Story</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/refunds">Refunds</a><a href="/support">Support</a></nav><span>© {new Date().getFullYear()} LOVORA</span></div></footer>
  </main>;
}
