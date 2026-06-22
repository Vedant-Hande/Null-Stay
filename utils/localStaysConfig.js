/** Local stays (PG, flats, rooms) — cities, filters, labels */

export const CITIES = [
  { id: "pune", label: "Pune" },
  { id: "nashik", label: "Nashik" },
  { id: "mumbai", label: "Mumbai" },
  { id: "nagpur", label: "Nagpur" },
  { id: "aurangabad", label: "Aurangabad" },
];

export const AREAS_BY_CITY = {
  pune: [
    "Hinjewadi",
    "Wakad",
    "Kothrud",
    "Baner",
    "Viman Nagar",
    "Hadapsar",
    "Pimpri",
    "Kharadi",
    "Magarpatta",
  ],
  nashik: [
    "College Road",
    "Gangapur",
    "CBS",
    "Panchavati",
    "Satpur",
    "Nashik Road",
    "Indira Nagar",
    "Ambad",
  ],
  mumbai: [
    "Andheri",
    "Borivali",
    "Thane",
    "Navi Mumbai",
    "Powai",
    "Malad",
  ],
  nagpur: ["Dharampeth", "Sadar", "Manish Nagar", "Hingna"],
  aurangabad: ["CIDCO", "Garkheda", "Osmanpura"],
};

export const PROPERTY_TYPES = [
  { id: "pg", label: "PG / Paying guest" },
  { id: "shared_room", label: "Shared room" },
  { id: "private_room", label: "Private room" },
  { id: "1bhk", label: "1 BHK flat" },
  { id: "2bhk", label: "2 BHK flat" },
  { id: "3bhk", label: "3+ BHK" },
  { id: "hostel", label: "Hostel" },
  { id: "family_house", label: "Family house" },
];

export const PROPERTY_TYPE_IDS = PROPERTY_TYPES.map((p) => p.id);

export const SUITABLE_FOR_OPTIONS = [
  { id: "students", label: "Students" },
  { id: "working_professionals", label: "Working professionals" },
  { id: "family", label: "Family" },
  { id: "bachelors", label: "Bachelors" },
  { id: "girls_only", label: "Girls only (PG)" },
  { id: "boys_only", label: "Boys only (PG)" },
];

export const PRICE_UNITS = [
  { id: "month", label: "Per month" },
  { id: "night", label: "Per night (short stay)" },
];

export const LOCAL_AMENITIES = [
  "Wifi",
  "AC",
  "Food included",
  "Laundry",
  "Parking",
  "Attached bathroom",
  "Furnished",
  "Power backup",
  "Near college",
  "Near IT park",
  "Kitchen",
  "Geyser",
];

/** Legacy vacation categories — still supported in search */
export const CATEGORY_KEYWORDS = {
  pools: ["pool", "swim"],
  beachfront: ["beach", "ocean", "sea", "coast"],
  castles: ["castle", "fort"],
  treehouses: ["treehouse", "tree house", "tree-house"],
  cabins: ["cabin", "cottage", "lodge"],
  cities: ["city", "apartment", "downtown", "urban"],
};

export function getCityLabel(cityId) {
  return CITIES.find((c) => c.id === cityId)?.label || cityId || "";
}

export function getPropertyTypeLabel(typeId) {
  return PROPERTY_TYPES.find((p) => p.id === typeId)?.label || typeId || "";
}

export function getSuitableForLabel(id) {
  return SUITABLE_FOR_OPTIONS.find((s) => s.id === id)?.label || id;
}

export function formatPriceLabel(price, priceUnit = "month") {
  if (price === null || price === undefined) return "N/A";
  const formatted = Number(price).toLocaleString("en-IN");
  return priceUnit === "night"
    ? `₹ ${formatted} / night`
    : `₹ ${formatted} / month`;
}

export function formatPriceShort(price, priceUnit = "month") {
  if (price === null || price === undefined) return "N/A";
  const formatted = Number(price).toLocaleString("en-IN");
  return priceUnit === "night" ? `₹${formatted}/night` : `₹${formatted}/mo`;
}

export function getAreasForCity(cityId) {
  return AREAS_BY_CITY[cityId] || [];
}
