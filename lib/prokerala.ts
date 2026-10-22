import "server-only";
import type { JourneyDraft, PreviewInsight } from "./context";
import { resolveBirthUTC } from "./birth-time";

type OAuthToken = { access_token?: unknown; expires_in?: unknown };
type Position = { id?: unknown; name?: unknown; rasi?: { id?: unknown; name?: unknown } };
type PlanetPayload = { status?: string; data?: { planet_position?: Position[] } };

let cachedToken: { token: string; expires: number } | null = null;
const pending = new Map<string, Promise<PreviewInsight>>();
const previewCache = new Map<string, { expires: number; insight: PreviewInsight }>();

const ZODIAC = [
  ["Aries","Expression of affection may be associated with openness and initiative.","स्नेह की अभिव्यक्ति को पहल और सीधेपन से जोड़ा जाता है।"],
  ["Taurus","Traditional readings associate affection with steadiness and a desire for comfort.","पारंपरिक व्याख्याएँ स्नेह को स्थिरता और सहजता से जोड़ती हैं।"],
  ["Gemini","Communication and curiosity are often emphasized in symbolic relationship readings.","पारंपरिक संकेत रिश्तों में संवाद और जिज्ञासा पर ज़ोर देते हैं।"],
  ["Cancer","Emotional security and caring bonds are common symbolic themes.","भावनात्मक सुरक्षा और देखभाल को पारंपरिक विषय माना जाता है।"],
  ["Leo","Warmth, self-expression and appreciation are often highlighted symbolically.","अपनापन, अभिव्यक्ति और सराहना को प्रतीकात्मक रूप से महत्व दिया जाता है।"],
  ["Virgo","Thoughtful care and attention to everyday details may be emphasized.","सोच-समझकर देखभाल और छोटी बातों पर ध्यान देने का प्रतीक माना जाता है।"],
  ["Libra","Balance and mutual understanding are traditional symbolic partnership themes.","संतुलन और आपसी समझ को पारंपरिक साझेदारी के संकेत माना जाता है।"],
  ["Scorpio","Depth, emotional intensity and trust may feature in traditional interpretations.","गहराई, भावनात्मक तीव्रता और विश्वास को प्रमुख प्रतीक माना जाता है।"],
  ["Sagittarius","Shared exploration, independence and openness may be highlighted.","साझा अनुभव, स्वतंत्रता और खुलेपन को रिश्तों से जोड़ा जाता है।"],
  ["Capricorn","Commitment, patience and long-term effort are common symbolic themes.","प्रतिबद्धता, धैर्य और दीर्घकालीन प्रयास को पारंपरिक विषय माना जाता है।"],
  ["Aquarius","Friendship, individuality and shared ideas are often emphasized.","दोस्ती, व्यक्तित्व और साझा विचारों को पारंपरिक संकेत माना जाता है।"],
  ["Pisces","Sensitivity, imagination and emotional empathy are common symbolic themes.","संवेदनशीलता, कल्पनाशीलता और सहानुभूति को प्रमुख प्रतीक माना जाता है।"],
] as const;

function credentials(): { id: string; secret: string } {
  const id = process.env.PROKERALA_CLIENT_ID?.trim();
  const secret = process.env.PROKERALA_CLIENT_SECRET?.trim();
  if (!id || !secret) throw new Error("PROKERALA_NOT_CONFIGURED");
  return { id, secret };
}

async function accessToken(): Promise<string> {
  if (cachedToken && cachedToken.expires > Date.now() + 60_000) return cachedToken.token;
  const { id, secret } = credentials();
  const response = await fetch("https://api.prokerala.com/token", {
    method: "POST", cache: "no-store", signal: AbortSignal.timeout(12000),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: id, client_secret: secret }),
  });
  if (!response.ok) throw new Error("PROKERALA_AUTH_FAILED");
  const value = await response.json() as OAuthToken;
  if (typeof value.access_token !== "string" || !value.access_token) throw new Error("PROKERALA_AUTH_FAILED");
  const seconds = typeof value.expires_in === "number" && Number.isFinite(value.expires_in) ? value.expires_in : 3600;
  cachedToken = { token: value.access_token, expires: Date.now() + Math.max(120, seconds) * 1000 };
  return cachedToken.token;
}

export {resolveBirthUTC} from "./birth-time";

async function fetchPositions(draft: JourneyDraft, token: string): Promise<PlanetPayload> {
  if (!draft.birthTime || !draft.timeKnown) throw new Error("BIRTH_TIME_REQUIRED");
  const datetime = resolveBirthUTC(draft.dateOfBirth, draft.birthTime, draft.place.timezone).toISOString();
  const url = new URL("https://api.prokerala.com/v2/astrology/planet-position");
  url.searchParams.set("ayanamsa", "1");
  url.searchParams.set("coordinates", draft.place.latitude + "," + draft.place.longitude);
  url.searchParams.set("datetime", datetime);
  url.searchParams.set("la", "en");
  const response = await fetch(url.toString(), {
    cache: "no-store", signal: AbortSignal.timeout(14000),
    headers: { Authorization: "Bearer " + token, Accept: "application/json" },
  });
  if (response.status === 401) { cachedToken = null; throw new Error("PROKERALA_AUTH_FAILED"); }
  if (response.status === 429) throw new Error("ASTROLOGY_RATE_LIMIT");
  if (!response.ok) throw new Error("ASTROLOGY_UNAVAILABLE");
  return await response.json() as PlanetPayload;
}

function extractVenus(value: PlanetPayload): PreviewInsight {
  const planets = value.data?.planet_position;
  if (value.status !== "ok" || !Array.isArray(planets)) throw new Error("UNSUPPORTED_CHART_RESPONSE");
  // Prefer the provider's explicit planet name; an ID-only fallback could
  // silently label a different planet as Venus if the API enumeration changes.
  const venus = planets.find(planet => typeof planet.name === "string" && planet.name.trim().toLowerCase() === "venus");
  if (!venus?.rasi || typeof venus.rasi.name !== "string") throw new Error("UNSUPPORTED_CHART_RESPONSE");
  const index = ZODIAC.findIndex(([name]) => name.toLowerCase() === (venus.rasi?.name as string).trim().toLowerCase());
  if (index < 0) throw new Error("UNSUPPORTED_CHART_RESPONSE");
  const [sign, descriptionEn, descriptionHi] = ZODIAC[index];
  return { planet: "Venus", sign, signId: index + 1, descriptionEn, descriptionHi,
    source: "Prokerala planet-position", ayanamsa: "Lahiri", generatedAt: Date.now() };
}

export async function calculateFreeInsight(draft: JourneyDraft, cacheKey: string): Promise<PreviewInsight> {
  const hit = previewCache.get(cacheKey);
  if (hit && hit.expires > Date.now()) return hit.insight;
  const ongoing = pending.get(cacheKey);
  if (ongoing) return ongoing;
  if (previewCache.size > 500) previewCache.clear();
  const run = (async () => {
    const token = await accessToken();
    const data = await fetchPositions(draft, token);
    const insight = extractVenus(data);
    previewCache.set(cacheKey, { insight, expires: Date.now() + 10 * 60_000 });
    return insight;
  })();
  pending.set(cacheKey, run);
  try { return await run; } finally { pending.delete(cacheKey); }
}


// Paid-report input: one required planet-position call, plus optional cross-checks.
// Optional endpoints can fail independently; missing data is explicitly disclosed.
export async function fetchPaidChartData(draft: JourneyDraft): Promise<import("./report/types").RawChartData> {
  if (!draft.timeKnown || !draft.birthTime) throw new Error("BIRTH_TIME_REQUIRED");
  const token = await accessToken();
  const original = await fetchPositions(draft, token);
  if (original.status !== "ok" || !Array.isArray(original.data?.planet_position)) throw new Error("UNSUPPORTED_CHART_RESPONSE");
  const datetime = resolveBirthUTC(draft.dateOfBirth, draft.birthTime, draft.place.timezone).toISOString();
  const base = {
    ayanamsa: "1", coordinates: draft.place.latitude + "," + draft.place.longitude,
    datetime, la: "en",
  };
  async function optionalCall(endpoint: "divisional-planet-position"|"dasha-periods", extra:Record<string,string>) {
    const url = new URL("https://api.prokerala.com/v2/astrology/" + endpoint);
    Object.entries({...base,...extra}).forEach(([key,val])=>url.searchParams.set(key,val));
    const response=await fetch(url.toString(),{
      headers:{Authorization:"Bearer "+token,Accept:"application/json"},
      cache:"no-store",signal:AbortSignal.timeout(14000),
    });
    if (!response.ok) throw new Error("ASTROLOGY_OPTIONAL_UNAVAILABLE");
    return await response.json() as {status?:string;data?:unknown};
  }
  const [d9,dasha]=await Promise.allSettled([
    optionalCall("divisional-planet-position",{chart_type:"navamsa"}),
    optionalCall("dasha-periods",{year_length:"1"}),
  ]);
  const navamsaData=d9.status==="fulfilled"&&d9.value.status==="ok" ? d9.value.data : null;
  const dashaData=dasha.status==="fulfilled"&&dasha.value.status==="ok" ? {data:dasha.value.data} : null;
  if(d9.status==="rejected")console.warn("LOVORA optional Navamsa not available");
  if(dasha.status==="rejected")console.warn("LOVORA optional Dasha not available");
  return {
    planets: original.data.planet_position,
    navamsa: navamsaData && typeof navamsaData==="object" ? navamsaData as import("./report/types").RawChartData["navamsa"] : null,
    dasha: dashaData,
  };
}
