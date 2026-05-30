const SITE_NAME = process.env.SITE_NAME?.trim() || "NullStay";
const DEFAULT_DESCRIPTION =
  "Discover unique stays across India on NullStay. Book beachfront villas, cabins, and city homes from trusted hosts.";

const DEFAULT_OG_IMAGE = "/img/nullstay-notification.svg";

export function getSiteUrl() {
  return (process.env.APP_URL || "http://localhost:8080").replace(/\/$/, "");
}

function truncate(text, max = 160) {
  if (!text || typeof text !== "string") return "";
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trim()}…`;
}

function absoluteUrl(pathOrUrl) {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = getSiteUrl();
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${path}`;
}

/**
 * Build SEO metadata for EJS layouts.
 * @param {object} options
 * @param {string} options.title - Page title without site suffix
 * @param {string} [options.description]
 * @param {string} [options.path] - Path only, e.g. "/listings"
 * @param {string} [options.image] - Absolute or relative image URL
 * @param {boolean} [options.noindex]
 * @param {string} [options.type] - Open Graph type
 * @param {object} [options.jsonLd] - Structured data object
 */
export function buildSeo({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  image = DEFAULT_OG_IMAGE,
  noindex = false,
  type = "website",
  jsonLd = null,
} = {}) {
  const safePath = path.startsWith("/") ? path : `/${path}`;
  const canonical = absoluteUrl(safePath);
  const ogImage = absoluteUrl(image) || absoluteUrl(DEFAULT_OG_IMAGE);
  const fullTitle = title ? `${title} · ${SITE_NAME}` : SITE_NAME;
  const metaDescription = truncate(description, 160);

  return {
    siteName: SITE_NAME,
    title: fullTitle,
    pageTitle: title || SITE_NAME,
    description: metaDescription,
    canonical,
    path: safePath,
    image: ogImage,
    noindex,
    robots: noindex ? "noindex, nofollow" : "index, follow",
    ogType: type,
    jsonLd,
  };
}

export function buildHomeSeo() {
  return buildSeo({
    title: "Vacation rentals and unique stays",
    description:
      "NullStay — book unique homes and stays across India. Search by location, price, and guests. Instant book or request to stay.",
    path: "/",
    type: "website",
  });
}

export function buildListingsIndexSeo(query = {}) {
  const parts = [];
  if (query.q) parts.push(`"${query.q}"`);
  if (query.country) parts.push(query.country);
  if (query.category) parts.push(query.category);
  if (query.minPrice || query.maxPrice) {
    parts.push(
      [query.minPrice && `from ₹${query.minPrice}`, query.maxPrice && `to ₹${query.maxPrice}`]
        .filter(Boolean)
        .join(" "),
    );
  }

  const filterHint = parts.length ? ` ${parts.join(" · ")}` : "";
  const hasFilters = Object.keys(query).some((k) =>
    ["q", "country", "category", "minPrice", "maxPrice", "guests"].includes(k) &&
    query[k],
  );

  return buildSeo({
    title: parts.length ? `Stays${filterHint}` : "Explore stays",
    description: parts.length
      ? `Browse vacation rentals${filterHint} on NullStay. Compare prices, amenities, and book your next trip.`
      : "Browse vacation rentals and unique stays on NullStay. Filter by location, price, category, and guests.",
    path: hasFilters ? `/listings?${new URLSearchParams(query).toString()}` : "/listings",
  });
}

export function buildListingDetailSeo(listing, avgRating = null) {
  const location = [listing.location, listing.country].filter(Boolean).join(", ");
  const desc = listing.desc
    ? truncate(listing.desc, 140)
    : `Book ${listing.title}${location ? ` in ${location}` : ""} on NullStay.`;
  const image =
    listing.image?.url || listing.images?.[0]?.url || DEFAULT_OG_IMAGE;

  let jsonLd = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: listing.title,
    description: truncate(listing.desc || desc, 300),
    url: absoluteUrl(`/listings/${listing._id}`),
    image: absoluteUrl(image),
  };

  if (location) {
    jsonLd.address = {
      "@type": "PostalAddress",
      addressLocality: listing.location,
      addressCountry: listing.country,
    };
  }

  if (listing.price != null) {
    jsonLd.priceRange = `₹${listing.price}+`;
  }

  if (avgRating && listing.reviews?.length > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: avgRating,
      reviewCount: listing.reviews.length,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return buildSeo({
    title: listing.title,
    description: desc,
    path: `/listings/${listing._id}`,
    image,
    type: "website",
    jsonLd,
  });
}

export function buildInfoPageSeo({ pageTitle, metaDescription, path }) {
  return buildSeo({
    title: pageTitle,
    description: metaDescription || `${pageTitle} — ${SITE_NAME}`,
    path,
  });
}

export function buildPrivatePageSeo(title) {
  return buildSeo({
    title,
    description: DEFAULT_DESCRIPTION,
    path: "/",
    noindex: true,
  });
}

const PRIVATE_PATH_PREFIXES = [
  "/login",
  "/signup",
  "/bookings",
  "/messages",
  "/notifications",
  "/push",
  "/user",
  "/wishlists",
  "/dev",
  "/listings/new",
];

export function shouldNoindexPath(pathname) {
  if (!pathname) return false;
  if (pathname.includes("/edit")) return true;
  return PRIVATE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function buildDefaultSeo(req) {
  const pathOnly = req.originalUrl.split("?")[0] || "/";
  return buildSeo({
    title: "NullStay",
    path: pathOnly,
    noindex: shouldNoindexPath(pathOnly),
  });
}

export function assignSeo(res, seo) {
  res.locals.seo = seo;
}

export const SEO_DEFAULTS = {
  SITE_NAME,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
};
