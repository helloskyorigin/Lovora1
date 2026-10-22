"use client";

import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import "./birth-details.css";

type City = { id: number; name: string; region: string; country: string; display: string };
type Lang = "en" | "hi";

const messages = {
  en: {
    back: "Back to LOVORA", eyebrow: "CHAPTER 01 / YOUR BEGINNING",
    title: "Every story begins", titleAccent: "with a moment.",
    subtitle: "Tell us where and when your story began.",
    name: "What should we call you?", nameHint: "First name · optional",
    date: "Date of birth", time: "Time of birth", unknown: "I don't know my birth time",
    city: "Where were you born?", cityPlaceholder: "Search for your birth city...",
    cityHint: "Select your city from the suggestions — location and timezone are verified.",
    whenUnknown: "An exact birth time is required for the current free glimpse. You may save your details, but you'll need to add a birth time before calculation. No time will be invented.",
    privacy: "Private by design. Your details are saved in an encrypted 24-hour browser session, not an account.",
    age: "This experience is for adults aged 18+.",
    action: "Continue my story", saving: "Saving your birth moment...",
    locationWait: "Searching for places...", locationEmpty: "No cities found. Try the nearest major city.",
    footer: "Traditional Vedic astrology for reflection, not certain predictions.",
    failed: "Something went wrong. Please try again.", requiredCity: "Please select your birthplace from the list.",
    language: "हिंदी",
  },
  hi: {
    back: "LOVORA पर वापस", eyebrow: "अध्याय 01 / आपकी शुरुआत",
    title: "हर कहानी शुरू होती है", titleAccent: "एक खास पल से।",
    subtitle: "बताइए, आपका जन्म कब और कहाँ हुआ था?",
    name: "आपको किस नाम से बुलाएँ?", nameHint: "पहला नाम · वैकल्पिक",
    date: "जन्मतिथि", time: "जन्म का समय", unknown: "मुझे जन्म का समय नहीं पता",
    city: "आपका जन्म कहाँ हुआ था?", cityPlaceholder: "जन्म का शहर खोजें...",
    cityHint: "सुझावों से सही शहर चुनें — स्थान और समय क्षेत्र की पुष्टि होती है।",
    whenUnknown: "अभी मुफ़्त कुंडली संकेत निकालने के लिए सही जन्मसमय ज़रूरी है। आप विवरण सेव कर सकते हैं, लेकिन गणना से पहले समय देना होगा। हम कोई अनुमानित समय नहीं बनाएँगे।",
    privacy: "आपके विवरण 24 घंटे तक एन्क्रिप्टेड सेशन में रहते हैं, कोई अकाउंट नहीं बनता।",
    age: "यह अनुभव केवल 18 वर्ष या उससे अधिक उम्र के लोगों के लिए है।",
    action: "अपनी कहानी आगे बढ़ाएँ", saving: "विवरण सुरक्षित किए जा रहे हैं...",
    locationWait: "शहर खोज रहे हैं...", locationEmpty: "शहर नहीं मिला। नज़दीकी बड़े शहर से खोजें।",
    footer: "पारंपरिक वैदिक ज्योतिष व्यक्तिगत चिंतन के लिए है, पक्की भविष्यवाणी नहीं।",
    failed: "कुछ गड़बड़ हुई। दोबारा प्रयास करें।", requiredCity: "कृपया सूची से जन्मस्थान चुनें।",
    language: "English",
  },
} as const;

function BirthDetailsForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [language, setLanguage] = useState<Lang>(params.get("lang") === "hi" ? "hi" : "en");
  const c = messages[language];
  const [firstName, setFirstName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [timeKnown, setTimeKnown] = useState(true);
  const [birthTime, setBirthTime] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const requestId = useRef(0);
  const pickerRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const maxDOB = new Date(Date.UTC(today.getFullYear() - 18, today.getMonth(), today.getDate())).toISOString().slice(0, 10);
  const minDOB = new Date(Date.UTC(today.getFullYear() - 110, today.getMonth(), today.getDate())).toISOString().slice(0, 10);

  useEffect(() => {
    if (selectedCity || search.trim().length < 3) {
      setCities([]);
      setSearching(false);
      setSearchError("");
      return;
    }
    const current = ++requestId.current;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      setSearchError("");
      try {
        const res = await fetch("/api/places?q=" + encodeURIComponent(search.trim()), { signal: controller.signal });
        const data = await res.json() as { results?: City[]; error?: string };
        if (current !== requestId.current) return;
        if (!res.ok) throw new Error(data.error || "City lookup unavailable.");
        setCities(Array.isArray(data.results) ? data.results : []);
      } catch (e) {
        if (controller.signal.aborted || current !== requestId.current) return;
        setCities([]);
        setSearchError(e instanceof Error ? e.message : "City lookup unavailable.");
      } finally {
        if (current === requestId.current) setSearching(false);
      }
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [search, selectedCity]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) setCities([]);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setError("");
    if (!selectedCity) { setError(c.requiredCity); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/birth-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ firstName, dateOfBirth, timeKnown, birthTime: timeKnown ? birthTime : null, placeId: selectedCity.id }),
      });
      const json = await res.json() as { ok?: boolean; error?: string; next?: string };
      if (!res.ok || !json.ok) throw new Error(json.error || c.failed);
      router.push((json.next || "/birth-details/saved") + "?lang=" + language);
    } catch (e) {
      setError(e instanceof Error ? e.message : c.failed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className={"birth-page" + (language === "hi" ? " birth-page--hi" : "")}>
      <div className="birth-page__glow birth-page__glow--left" aria-hidden="true" />
      <div className="birth-page__glow birth-page__glow--right" aria-hidden="true" />
      <header className="birth-header">
        <Link className="birth-back" href="/"><span aria-hidden="true">←</span> {c.back}</Link>
        <Link href="/" className="birth-logo" aria-label="LOVORA home"><span className="birth-logo__spark">✦</span> LOVORA</Link>
        <button type="button" className="birth-language" onClick={() => setLanguage(language === "en" ? "hi" : "en")}>{c.language}</button>
      </header>
      <div className="birth-layout">
        <aside className="birth-story">
          <div className="birth-story__step">{c.eyebrow}</div>
          <div className="birth-story__art" aria-hidden="true">
            <div className="birth-story__orbit birth-story__orbit--one" />
            <div className="birth-story__orbit birth-story__orbit--two" />
            <div className="birth-story__moon">☾</div>
            <span className="birth-story__star birth-story__star--one">✧</span>
            <span className="birth-story__star birth-story__star--two">✦</span>
          </div>
          <h1>{c.title}<em>{c.titleAccent}</em></h1>
          <p>{c.subtitle}</p>
          <div className="birth-story__line" aria-hidden="true"><span /></div>
        </aside>
        <section className="birth-form-shell" aria-label={c.eyebrow}>
          <div className="birth-progress"><span className="birth-progress__active"/><span/></div>
          <div className="birth-form-heading"><span>✧</span>{c.eyebrow}</div>
          <form className="birth-form" onSubmit={submit}>
            <div className="birth-field">
              <label htmlFor="birth-name">{c.name}</label>
              <input id="birth-name" type="text" value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder={c.nameHint} autoComplete="given-name" maxLength={50} />
            </div>
            <div className="birth-field">
              <label htmlFor="birth-date">{c.date}</label>
              <input id="birth-date" type="date" value={dateOfBirth} onChange={e=>setDateOfBirth(e.target.value)} min={minDOB} max={maxDOB} required />
            </div>
            <div className="birth-field">
              <label htmlFor="birth-time">{c.time}</label>
              <input id="birth-time" type="time" value={birthTime} onChange={e=>setBirthTime(e.target.value)} disabled={!timeKnown} required={timeKnown} />
              <label className="birth-checkbox"><input type="checkbox" checked={!timeKnown} onChange={e => setTimeKnown(!e.target.checked)}/><span>{c.unknown}</span></label>
              {!timeKnown && <div className="birth-warning">{c.whenUnknown}</div>}
            </div>
            <div className="birth-field" ref={pickerRef}>
              <label htmlFor="birth-city">{c.city}</label>
              <div className="birth-city-wrap">
                <span className="birth-city-icon" aria-hidden="true">⌕</span>
                <input id="birth-city" value={search} placeholder={c.cityPlaceholder} autoComplete="off" onChange={e => { setSearch(e.target.value); setSelectedCity(null); setCities([]); }} aria-expanded={cities.length>0} aria-controls="birth-city-options" aria-autocomplete="list" role="combobox" required />
                {selectedCity && <span className="birth-city-verified" aria-label="Birthplace selected">✓</span>}
                {cities.length > 0 && <div className="birth-city-options" id="birth-city-options" role="listbox">
                  {cities.map(city => <button type="button" role="option" aria-selected={false} key={city.id} onClick={() => { setSelectedCity(city); setSearch(city.display); setCities([]); setSearchError(""); }}>{city.display}</button>)}
                </div>}
              </div>
              {searching && <p className="birth-hint" role="status">{c.locationWait}</p>}
              {searchError && <p className="birth-field-error" role="alert">{searchError}</p>}
              {!searching && search.length >= 3 && !selectedCity && cities.length===0 && !searchError && <p className="birth-hint">{c.locationEmpty}</p>}
              <p className="birth-hint">{c.cityHint} <a target="_blank" rel="noopener noreferrer" href="https://www.geonames.org/">GeoNames ↗</a></p>
            </div>
            {error && <div className="birth-error" role="alert">{error}</div>}
            <button className="birth-submit" type="submit" disabled={saving}>
              {saving ? c.saving : c.action} <span aria-hidden="true">↗</span>
            </button>
            <div className="birth-safe"><span aria-hidden="true">✧</span><p>{c.privacy} <strong>{c.age}</strong></p></div>
          </form>
        </section>
      </div>
      <footer className="birth-footer">{c.footer}</footer>
    </main>
  );
}

export default function BirthDetailsPage() {
  return <Suspense fallback={<main className="birth-page"><div className="birth-layout"><p>Preparing your birth story...</p></div></main>}><BirthDetailsForm /></Suspense>;
}
