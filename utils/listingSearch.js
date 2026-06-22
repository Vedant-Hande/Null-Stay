import {
  CATEGORY_KEYWORDS,
  PROPERTY_TYPE_IDS,
} from "./localStaysConfig.js";

export { CATEGORY_KEYWORDS };

export function buildListingFilter(query = {}) {
  const {
    q,
    minPrice,
    maxPrice,
    country,
    guests,
    category,
    city,
    area,
    propertyType,
    suitableFor,
    priceUnit,
  } = query;
  const filter = {};

  const terms = [];
  if (q?.trim()) {
    terms.push(q.trim());
  }
  if (category && CATEGORY_KEYWORDS[category]) {
    terms.push(...CATEGORY_KEYWORDS[category]);
  }

  if (terms.length) {
    const pattern = terms
      .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");
    filter.$or = [
      { title: { $regex: pattern, $options: "i" } },
      { desc: { $regex: pattern, $options: "i" } },
      { location: { $regex: pattern, $options: "i" } },
      { country: { $regex: pattern, $options: "i" } },
      { city: { $regex: pattern, $options: "i" } },
      { area: { $regex: pattern, $options: "i" } },
    ];
  }

  if (city?.trim()) {
    filter.city = city.trim().toLowerCase();
  }

  if (area?.trim()) {
    filter.area = { $regex: area.trim(), $options: "i" };
  }

  if (propertyType?.trim() && PROPERTY_TYPE_IDS.includes(propertyType.trim())) {
    filter.propertyType = propertyType.trim();
  }

  if (suitableFor?.trim()) {
    filter.suitableFor = suitableFor.trim();
  }

  if (priceUnit === "night" || priceUnit === "month") {
    filter.priceUnit = priceUnit;
  }

  if (country?.trim()) {
    filter.country = { $regex: country.trim(), $options: "i" };
  }

  if (guests) {
    const n = parseInt(guests, 10);
    if (!Number.isNaN(n) && n > 0) {
      filter.guests = { $gte: n };
    }
  }

  const price = {};
  if (minPrice) {
    const n = Number(minPrice);
    if (!Number.isNaN(n)) price.$gte = n;
  }
  if (maxPrice) {
    const n = Number(maxPrice);
    if (!Number.isNaN(n)) price.$lte = n;
  }
  if (Object.keys(price).length) {
    filter.price = price;
  }

  return filter;
}
