import { LISTINGS_PER_PAGE } from "./constants.js";

export { LISTINGS_PER_PAGE };

/**
 * Parse `?page=` from the query string (1-based). Invalid values become 1.
 */
export function parsePage(value) {
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n < 1) return 1;
  return n;
}

/**
 * Compute skip/limit and navigation flags for MongoDB + templates.
 */
export function getPaginationMeta(total, page, perPage = LISTINGS_PER_PAGE) {
  const totalPages = Math.max(1, Math.ceil(total / perPage) || 1);
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * perPage;

  return {
    page: currentPage,
    perPage,
    total,
    totalPages,
    skip,
    limit: perPage,
    hasPrev: currentPage > 1,
    hasNext: currentPage < totalPages,
    prevPage: currentPage > 1 ? currentPage - 1 : null,
    nextPage: currentPage < totalPages ? currentPage + 1 : null,
    rangeStart: total === 0 ? 0 : skip + 1,
    rangeEnd: Math.min(skip + perPage, total),
  };
}

/**
 * Build a URL that keeps search filters and sets `page`.
 * Omits `page` when page is 1 (cleaner URLs).
 */
export function buildPageUrl(basePath, query = {}, page = 1) {
  const params = new URLSearchParams();
  const allowed = [
    "q",
    "country",
    "minPrice",
    "maxPrice",
    "guests",
    "category",
  ];

  for (const key of allowed) {
    const val = query[key];
    if (val !== null && String(val).trim() !== "") {
      params.set(key, String(val).trim());
    }
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/**
 * Page numbers to render, with `null` for ellipsis gaps.
 */
export function getPageNumberItems(current, totalPages) {
  if (totalPages <= 1) return [];

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const items = [];
  const add = (p) => {
    if (p >= 1 && p <= totalPages && !items.includes(p)) items.push(p);
  };

  add(1);
  if (current > 3) items.push(null);
  for (let p = current - 1; p <= current + 1; p++) add(p);
  if (current < totalPages - 2) items.push(null);
  add(totalPages);

  return items;
}

/**
 * Attach `prevUrl`, `nextUrl`, and `pageItems` for EJS templates.
 */
export function enrichPagination(pagination, query, basePath = "/listings") {
  const pageItems = getPageNumberItems(
    pagination.page,
    pagination.totalPages,
  ).map((p) =>
    p === null
      ? { ellipsis: true }
      : {
          page: p,
          current: p === pagination.page,
          url: buildPageUrl(basePath, query, p),
        },
  );

  return {
    ...pagination,
    prevUrl: pagination.hasPrev
      ? buildPageUrl(basePath, query, pagination.prevPage)
      : null,
    nextUrl: pagination.hasNext
      ? buildPageUrl(basePath, query, pagination.nextPage)
      : null,
    pageItems,
  };
}
