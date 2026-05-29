(function () {
  const grid = document.getElementById("listingsGrid");
  const sentinel = document.getElementById("listingsScrollSentinel");
  const statusEl = document.getElementById("listingsScrollStatus");

  if (!grid || !sentinel) return;

  let currentPage = 1;
  let loading = false;
  let hasMore = grid.dataset.hasMore === "true";
  const loggedIn = grid.dataset.loggedIn === "true";

  let searchParams = {};
  try {
    searchParams = JSON.parse(decodeURIComponent(grid.dataset.search || "%7B%7D"));
  } catch {
    searchParams = {};
  }

  const defaultImage =
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

  function formatPrice(price) {
    if (price == null) return "N/A";
    return Number(price).toLocaleString("en-IN");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function buildCard(listing, saved) {
    const wrap = document.createElement("div");
    wrap.className = "col-span-1 group relative";

    const ratingHtml = listing.avgRating
      ? `<div class="flex flex-row items-center gap-1 font-light text-sm text-gray-900 shrink-0 whitespace-nowrap">
          <i class="fa-solid fa-star text-xs"></i>
          <span>${escapeHtml(listing.avgRating)}</span>
        </div>`
      : "";

    const heartHtml = loggedIn
      ? `<button type="button" data-wishlist-toggle data-listing-id="${listing._id}"
          class="wishlist-heart wishlist-heart--overlay absolute top-3 right-3 z-10 ${saved ? "is-saved" : ""}"
          aria-pressed="${saved ? "true" : "false"}"
          aria-label="${saved ? "Remove from wishlist" : "Save to wishlist"}">
          <span class="wishlist-heart__ring" aria-hidden="true"></span>
          <i class="wishlist-heart__icon fa-heart ${saved ? "fa-solid" : "fa-regular"}" aria-hidden="true"></i>
        </button>`
      : "";

    wrap.innerHTML = `
      <a href="/listings/${listing._id}" class="block cursor-pointer">
        <div class="aspect-square w-full relative overflow-hidden rounded-xl mb-3">
          <img src="${escapeHtml(listing.imageUrl || defaultImage)}" alt="${escapeHtml(listing.title)}"
            class="object-cover h-full w-full group-hover:scale-105 transition duration-300" loading="lazy" />
        </div>
        <div class="flex flex-col">
          <div class="flex flex-row justify-between items-start gap-2">
            <div class="font-semibold text-base text-gray-900 truncate pr-2 flex-1 min-w-0">
              ${escapeHtml(listing.location)}, ${escapeHtml(listing.country)}
            </div>
            ${ratingHtml}
          </div>
          <div class="font-light text-neutral-500 text-sm truncate">${escapeHtml(listing.title)}</div>
          <div class="font-light text-neutral-500 text-sm">Added recently</div>
          <div class="flex flex-row items-center gap-1 mt-1 text-gray-900">
            <div class="font-semibold">&#8377; ${formatPrice(listing.price)}</div>
            <div class="font-light text-sm">night</div>
          </div>
        </div>
      </a>
      ${heartHtml}`;

    return wrap;
  }

  function setStatus(type) {
    if (!statusEl) return;
    statusEl.classList.remove("hidden", "listings-scroll-status--error");

    if (type === "loading") {
      statusEl.innerHTML =
        '<span class="listings-scroll-spinner" aria-hidden="true"></span> Loading more stays…';
      statusEl.classList.remove("hidden");
    } else if (type === "end") {
      statusEl.textContent = "You’ve seen all listings";
      statusEl.classList.remove("hidden");
    } else if (type === "error") {
      statusEl.textContent = "Could not load more. Scroll to try again.";
      statusEl.classList.add("listings-scroll-status--error");
      statusEl.classList.remove("hidden");
    } else {
      statusEl.classList.add("hidden");
      statusEl.textContent = "";
    }
  }

  async function loadMore() {
    if (loading || !hasMore) return;

    loading = true;
    setStatus("loading");

    const nextPage = currentPage + 1;
    const qs = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v != null && String(v).trim() !== "") qs.set(k, String(v).trim());
    });
    qs.set("page", String(nextPage));
    qs.set("format", "grid");
    qs.set("limit", grid.dataset.perPage || "12");

    try {
      const res = await fetch(`/api/listings/search?${qs}`);
      if (!res.ok) throw new Error("fetch failed");

      const data = await res.json();
      const wishSet = new Set((data.wishlistedIds || []).map(String));

      if (!data.listings?.length) {
        hasMore = false;
        setStatus("end");
        return;
      }

      const frag = document.createDocumentFragment();
      data.listings.forEach((listing) => {
        frag.appendChild(buildCard(listing, wishSet.has(String(listing._id))));
      });
      grid.appendChild(frag);

      currentPage = data.page;
      hasMore = data.hasMore;
      grid.dataset.hasMore = hasMore ? "true" : "false";

      if (hasMore) {
        setStatus("idle");
      } else {
        setStatus("end");
      }
    } catch {
      setStatus("error");
    } finally {
      loading = false;
    }
  }

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "200px 0px 200px 0px", threshold: 0 },
    );
    io.observe(sentinel);
  } else {
    window.addEventListener(
      "scroll",
      () => {
        const rect = sentinel.getBoundingClientRect();
        if (rect.top < window.innerHeight + 200) loadMore();
      },
      { passive: true },
    );
  }

  if (!hasMore && parseInt(grid.dataset.total || "0", 10) > 0) {
    setStatus("end");
  }
})();
