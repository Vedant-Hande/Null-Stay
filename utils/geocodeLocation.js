const cache = new Map();
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

/**
 * Resolve listing location text to coordinates via OpenStreetMap Nominatim.
 * Returns null when lookup fails (map section is hidden).
 */
export async function geocodeLocation(location, country) {
  const normalizedLocation = String(location || "").trim();
  const normalizedCountry = String(country || "").trim();
  const includeCountry =
    normalizedCountry &&
    (!normalizedLocation ||
      !normalizedLocation.toLowerCase().includes(normalizedCountry.toLowerCase()));
  const place = [normalizedLocation, includeCountry ? normalizedCountry : ""]
    .filter(Boolean)
    .join(", ")
    .trim();
  if (!place) return null;

  if (cache.has(place)) return cache.get(place);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    try {
      const params = new URLSearchParams({
        q: place,
        format: "json",
        limit: "1",
      });
      const userAgent =
        process.env.NOMINATIM_USER_AGENT ||
        process.env.USER_AGENT ||
        "NullStay/1.0";
      const res = await fetch(`${NOMINATIM_URL}?${params}`, {
        headers: {
          "User-Agent": userAgent,
          Accept: "application/json",
          "Accept-Language": "en",
        },
        signal: controller.signal,
      });
      if (!res.ok) return null;

      const rows = await res.json();
      const hit = rows?.[0];
      if (!hit?.lat || !hit?.lon) {
        cache.set(place, null);
        return null;
      }

      const coords = {
        lat: Number(hit.lat),
        lng: Number(hit.lon),
        displayName: hit.display_name,
      };
      cache.set(place, coords);
      return coords;
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return null;
  }
}
