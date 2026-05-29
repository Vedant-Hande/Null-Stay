import Wishlist from "../models/wishlist.js";

export async function getWishlistedIdsForUser(userId, listingIds = []) {
  if (!userId) return [];
  const query = { user: userId };
  if (listingIds.length) {
    query.listing = { $in: listingIds };
  }
  const rows = await Wishlist.find(query).select("listing");
  return rows.map((w) => String(w.listing));
}
