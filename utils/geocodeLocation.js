const cache = new Map();
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

/**
 * Resolve listing location text to coordinates via OpenStreetMap Nominatim.
 * Returns null when lookup fails (map section is hidden).
 */
export async function geocodeLocation(location, country) {
  const place = [location, country].filter(Boolean).join(", ").trim();
  if (!place) return null;

  if (cache.has(place)) return cache.get(place);

  try {
    const params = new URLSearchParams({
      q: place,
      format: "json",
      limit: "1",
    });
    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: {
        "User-Agent": "NullStay/1.0 (https://nullstay.local)",
        Accept: "application/json",
      },
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
  } catch {
    return null;
  }
}
