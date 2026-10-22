"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import "../birth-details.css";

type Saved = { ok: boolean; draft?: { firstName: string; dateOfBirth: string; birthTime: string | null; timeKnown: boolean; place: { name: string; region: string; country: string; timezone: string }; savedAt: number } };

function SavedBirthContent() {
  const lang = useSearchParams().get("lang") === "hi" ? "hi" : "en";
  const [data, setData] = useState<Saved | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/birth-details", { cache: "no-store" })
      .then(async res => res.ok ? (await res.json() as Saved) : { ok: false })
      .then(setData)
      .catch(() => setData({ ok: false }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className={"birth-page" + (lang === "hi" ? " birth-page--hi" : "")}>
      <header className="birth-header">
        <Link href="/" className="birth-back">← {lang === "hi" ? "होम" : "Home"}</Link>
        <Link href="/" className="birth-logo">✦ LOVORA</Link>
        <Link href={"/birth-details?lang=" + lang} className="birth-language">{lang === "hi" ? "संपादित करें" : "Edit"}</Link>
      </header>
      <div className="birth-layout" style={{ maxWidth: 950, minHeight: "74vh" }}>
        <aside className="birth-story">
          <div className="birth-story__step">✦ {lang === "hi" ? "आपकी यात्रा" : "YOUR JOURNEY"}</div>
          <div className="birth-story__art" aria-hidden="true"><div className="birth-story__orbit birth-story__orbit--one"/><div className="birth-story__moon">☾</div></div>
          <h1>{lang === "hi" ? "शुरुआत हो गई।" : "Your story has"}<em>{lang === "hi" ? "आपकी कहानी की।" : "just begun."}</em></h1>
        </aside>
        <section className="birth-form-shell" style={{ alignSelf: "center" }}>
          <p className="birth-form-heading">✧ {lang === "hi" ? "सुरक्षित जन्म विवरण" : "YOUR BIRTH MOMENT"}</p>
          {loading ? <p>{lang === "hi" ? "आपका विवरण खोज रहे हैं..." : "Loading your details..."}</p> :
            data?.ok && data.draft ?
              <div>
                <h2 style={{ fontSize: 34, color: "#fff0e6", marginBottom: 20 }}>{data.draft.firstName ? (lang === "hi" ? "नमस्ते, " : "Hello, ") + data.draft.firstName : (lang === "hi" ? "आपका विवरण सुरक्षित है।" : "Your details are safe.")}</h2>
                <p style={{ color: "#dfc9df", lineHeight: 1.8, fontSize: 14 }}>
                  {data.draft.dateOfBirth} · {data.draft.timeKnown ? data.draft.birthTime : (lang === "hi" ? "समय अज्ञात" : "time unknown")}<br/>
                  {[data.draft.place.name, data.draft.place.region, data.draft.place.country].filter(Boolean).join(", ")}
                  <br/>{data.draft.place.timezone}
                </p>
                <p style={{ color: "#e9bf95", fontSize: 13, lineHeight: 1.7 }}>
                  {lang === "hi"
                    ? "जन्म विवरण सुरक्षित हैं। अब रिश्तों के बारे में दो सवाल चुनें और फिर कुंडली के वास्तविक ग्रह-आधारित संकेत देखें। अभी कोई ज्योतिषीय परिणाम नहीं बनाया गया है।"
                    : "Birth details are securely saved. Continue to the relationship questions, then calculate a real chart-based free insight. No astrology result has been generated yet."}
                </p>
                <Link className="birth-submit" href={"/relationship?lang=" + lang} style={{ marginTop: 25 }}>
                  {lang === "hi" ? "अपने रिश्ते के बारे में बताएँ" : "Continue to relationship questions"} <span>↗</span>
                </Link>
              </div> :
              <div>
                <p style={{ color: "#e9bf95", fontSize: 13 }}>{lang === "hi" ? "सेशन नहीं मिला या समाप्त हो गया।" : "No saved session was found or it has expired."}</p>
                <Link className="birth-submit" href={"/birth-details?lang=" + lang} style={{ marginTop: 20 }}>{lang === "hi" ? "फिर शुरू करें" : "Start again"} <span>↗</span></Link>
              </div>
          }
        </section>
      </div>
    </main>
  );
}

export default function SavedBirthPage() {
  return <Suspense fallback={<main className="birth-page"><div className="birth-layout"><p>Opening your saved details...</p></div></main>}><SavedBirthContent /></Suspense>;
}
