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
