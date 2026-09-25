const CATEGORY_KEYWORDS = {
  pools: ["pool", "swim"],
  beachfront: ["beach", "ocean", "sea", "coast"],
  castles: ["castle", "fort"],
  treehouses: ["treehouse", "tree house", "tree-house"],
  cabins: ["cabin", "cottage", "lodge"],
  cities: ["city", "apartment", "downtown", "urban"],
};

export function buildListingFilter(query = {}) {
  const { q, minPrice, maxPrice, country, guests, category } = query;
  const filter = {};

  const terms = [];
  if (q?.trim()) {
    terms.push(q.trim());
  }
  if (category && CATEGORY_KEYWORDS[category]) {
    terms.push(...CATEGORY_KEYWORDS[category]);
  }

  if (terms.length) {
    const pattern = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    filter.$or = [
      { title: { $regex: pattern, $options: "i" } },
      { desc: { $regex: pattern, $options: "i" } },
      { location: { $regex: pattern, $options: "i" } },
      { country: { $regex: pattern, $options: "i" } },
    ];
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

export { CATEGORY_KEYWORDS };
