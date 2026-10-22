import "server-only";
import type { BirthPlace } from "./birth";

const HOST = "https://secure.geonames.org";

type GeoResponse = {
  geonames?: Array<{ geonameId: number; name: string; adminName1?: string; countryName?: string; lat: string; lng: string }>;
  geonameId?: number;
  name?: string;
  adminName1?: string;
  countryName?: string;
  lat?: string;
  lng?: string;
  timezone?: { timeZoneId?: string };
  timezoneId?: string;
  status?: { message?: string };
};

function user(): string {
  const name = process.env.GEONAMES_USERNAME?.trim();
  if (!name || !/^[\w.-]{2,50}$/.test(name)) {
    throw new Error("GEONAMES_USERNAME is not configured. Set up a free GeoNames account and enable web services.");
  }
  return name;
}

async function geoGet(path: string, params: Record<string, string>): Promise<GeoResponse> {
  const endpoint = new URL(HOST + path);
  Object.entries({ ...params, username: user() }).forEach(([name, value]) => endpoint.searchParams.set(name, value));
  const response = await fetch(endpoint.toString(), { cache: "no-store", signal: AbortSignal.timeout(7500) });
  if (!response.ok) throw new Error("Birthplace service is temporarily unavailable.");
  const data = await response.json() as GeoResponse;
  if (data.status) throw new Error(data.status.message || "Birthplace service is temporarily unavailable.");
  return data;
}

export type CitySuggestion = {
  id: number;
  name: string;
  region: string;
  country: string;
  display: string;
};

export async function searchCities(term: string): Promise<CitySuggestion[]> {
  const result = await geoGet("/searchJSON", {
    name_startsWith: term,
    featureClass: "P",
    maxRows: "8",
    orderby: "population",
    style: "MEDIUM",
    lang: "en",
  });
  return (result.geonames || []).filter((item) => Number.isSafeInteger(item.geonameId)).map((item) => {
    const region = item.adminName1 || "";
    const country = item.countryName || "";
    return {
      id: item.geonameId,
      name: item.name,
      region,
      country,
      display: [item.name, region, country].filter(Boolean).join(", "),
    };
  });
}

export async function getVerifiedPlace(id: number): Promise<BirthPlace> {
  const city = await geoGet("/getJSON", { geonameId: String(id) });
  if (city.geonameId !== id || !city.name) throw new Error("Could not verify the selected birthplace.");
  const latitude = Number(city.lat);
  const longitude = Number(city.lng);
  if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 || !Number.isFinite(longitude) || Math.abs(longitude) > 180) {
    throw new Error("The selected birthplace is missing valid coordinates.");
  }
  const timezoneData = await geoGet("/timezoneJSON", { lat: String(latitude), lng: String(longitude) });
  const timezone = timezoneData.timezoneId || city.timezone?.timeZoneId;
  if (!timezone) throw new Error("Could not determine the birthplace timezone.");
  try { new Intl.DateTimeFormat("en-US", { timeZone: timezone }); } catch { throw new Error("The selected birthplace has an unsupported timezone."); }
  return {
    id, name: city.name, region: city.adminName1 || "", country: city.countryName || "",
    latitude, longitude, timezone,
  };
}
