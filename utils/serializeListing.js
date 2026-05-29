import { DEFAULTS } from "./constants.js";

export function getListingMediaUrls(listing) {
  const urls = [];
  const cover = listing.image?.url || DEFAULTS.IMAGE_URL;
  if (cover) urls.push(cover);
  for (const img of listing.images || []) {
    if (img?.url && !urls.includes(img.url)) urls.push(img.url);
  }
  return urls.length ? urls : [DEFAULTS.IMAGE_URL];
}

export function averageRating(reviews = []) {
  if (!reviews?.length) return null;
  const sum = reviews.reduce((a, r) => a + (r.rating || 0), 0);
  return (sum / reviews.length).toFixed(1);
}

export function serializeListingForApi(listing) {
  return {
    _id: listing._id,
    title: listing.title,
    location: listing.location,
    country: listing.country,
    price: listing.price,
    cleaningFee: listing.cleaningFee,
    serviceFee: listing.serviceFee,
    guests: listing.guests,
    image: { url: listing.image?.url || DEFAULTS.IMAGE_URL },
    media: getListingMediaUrls(listing),
  };
}

/** Payload for listings grid + infinite scroll */
export function serializeListingForGrid(listing) {
  return {
    _id: listing._id,
    title: listing.title,
    location: listing.location,
    country: listing.country,
    price: listing.price,
    imageUrl: listing.image?.url || DEFAULTS.IMAGE_URL,
    avgRating: averageRating(listing.reviews),
  };
}
