(function () {
  const DEFAULT_CLEANING = 1500;
  const DEFAULT_SERVICE = 2100;
  const NIGHTS = 3;
  const tourTimers = new WeakMap();

  function debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  function formatInr(n) {
    return Number(n || 0).toLocaleString("en-IN");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function checkoutPreview(listing) {
    const nightly = listing.price || 0;
    const subtotal = nightly * NIGHTS;
    const cleaning =
      listing.cleaningFee != null ? listing.cleaningFee : DEFAULT_CLEANING;
    const service =
      listing.serviceFee != null ? listing.serviceFee : DEFAULT_SERVICE;
    return { nightly, subtotal, cleaning, service, total: subtotal + cleaning + service };
  }

  async function fetchListings(params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && String(v).trim() !== "") qs.set(k, String(v).trim());
    });
    const res = await fetch(`/api/listings/search?${qs}`);
    if (!res.ok) throw new Error("Search failed");
    return res.json();
  }

  function mediaAttr(urls) {
    return encodeURIComponent(JSON.stringify(urls || []));
  }

  function videoTourHtml(media) {
    const urls = media?.length ? media : [];
    const slides = urls
      .map(
        (url, i) =>
          `<img src="${escapeHtml(url)}" class="ns-vid-slide${i === 0 ? " is-active" : ""}" alt="" loading="lazy" />`,
      )
      .join("");
    const ken = urls.length <= 1 ? " ns-vid-tour--kenburns" : "";
    return `<div class="ns-vid-tour${ken}" data-media="${mediaAttr(urls)}">
      <div class="ns-vid-tour__slides">${slides}</div>
    </div>`;
  }

  function listingCardHtml(listing) {
    const loc = `${listing.location}, ${listing.country}`;
    return `<a href="/listings/${listing._id}" class="ns-mock-card ns-mock-card--live">
      <div class="ns-mock-card__img">${videoTourHtml(listing.media)}</div>
      <div class="ns-mock-card__info">
        <div class="ns-mock-card__loc">${escapeHtml(loc)}</div>
        <div class="ns-mock-card__price">&#8377;${formatInr(listing.price)} <span>night</span></div>
      </div>
    </a>`;
  }

  function parseMedia(el) {
    try {
      return JSON.parse(decodeURIComponent(el.getAttribute("data-media") || "%5B%5D"));
    } catch {
      return [];
    }
  }

  function startVideoTours(root) {
    root.querySelectorAll(".ns-vid-tour").forEach((el) => {
      if (tourTimers.has(el)) return;
      const media = parseMedia(el);
      if (media.length <= 1) return;
      const slides = el.querySelectorAll(".ns-vid-slide");
      let idx = 0;
      const id = setInterval(() => {
        slides[idx]?.classList.remove("is-active");
        idx = (idx + 1) % slides.length;
        slides[idx]?.classList.add("is-active");
      }, 2400);
      tourTimers.set(el, id);
    });
  }

  function stopToursIn(root) {
    root.querySelectorAll(".ns-vid-tour").forEach((el) => {
      const id = tourTimers.get(el);
      if (id) clearInterval(id);
      tourTimers.delete(el);
    });
  }

  function renderListingsMock(mockEl, listings, cols) {
    const body = mockEl.querySelector("[data-ns-mock-body]");
    if (!body) return;
    stopToursIn(body);
    body.className = `ns-mock__body ns-mock__body--cols-${cols}`;
    if (!listings.length) {
      body.innerHTML = `<div class="ns-mock-empty">No stays found. Try another search.</div>`;
      return;
    }
    body.innerHTML = listings.map(listingCardHtml).join("");
    startVideoTours(body);
  }

  function renderCheckoutMock(mockEl, listing) {
    const body = mockEl.querySelector("[data-ns-mock-body]");
    if (!body || !listing) {
      if (body) {
        body.innerHTML = `<div class="ns-mock-empty">Search a stay to preview checkout</div>`;
      }
      return;
    }
    const p = checkoutPreview(listing);
    body.innerHTML = `
      <div class="ns-checkout-preview">
        <div class="ns-checkout-preview__stay">
          ${videoTourHtml(listing.media)}
          <div>
            <strong>${escapeHtml(listing.title)}</strong>
            <span>${escapeHtml(listing.location)}, ${escapeHtml(listing.country)}</span>
          </div>
        </div>
        <div class="ns-checkout-line"><span>${NIGHTS} nights × &#8377;${formatInr(p.nightly)}</span><strong>&#8377;${formatInr(p.subtotal)}</strong></div>
        <div class="ns-checkout-line"><span>Service fee</span><strong>&#8377;${formatInr(p.service)}</strong></div>
        <div class="ns-checkout-line"><span>Cleaning</span><strong>&#8377;${formatInr(p.cleaning)}</strong></div>
        <div class="ns-checkout-total"><span>Total</span><span>&#8377;${formatInr(p.total)}</span></div>
        <a href="/listings/${listing._id}" class="ns-checkout-btn"><i class="fa-solid fa-lock"></i> Pay with Razorpay</a>
      </div>`;
    startVideoTours(body);
  }

  function renderMessagesMock(mockEl, listing) {
    const body = mockEl.querySelector("[data-ns-mock-body]");
    const searchInput = mockEl.querySelector(".ns-mock__search");
    if (!listing) {
      if (body) {
        body.innerHTML = `<div class="ns-mock-empty">Search a villa or city to start chatting</div>`;
      }
      if (searchInput) searchInput.placeholder = "Messages — search a stay…";
      return;
    }
    if (searchInput) {
      searchInput.placeholder = `Messages — ${listing.title}`;
    }
    body.innerHTML = `
      <div class="ns-chat-preview">
        <div class="ns-chat-preview__vid">${videoTourHtml(listing.media)}</div>
        <div class="ns-chat-preview__thread">
          <div class="ns-chat-bubble ns-chat-bubble--them">Hi! Check-in is from 2 PM for ${escapeHtml(listing.location)}. When do you arrive?</div>
          <div class="ns-chat-bubble ns-chat-bubble--me">We'll arrive around 4 PM. Is parking available?</div>
          <div class="ns-chat-bubble ns-chat-bubble--them">Yes — free parking at ${escapeHtml(listing.title)}.</div>
        </div>
      </div>`;
    startVideoTours(body);
  }

  function renderHostMock(mockEl, listing) {
    const body = mockEl.querySelector("[data-ns-mock-body]");
    if (!listing) {
      if (body) {
        body.innerHTML = `<div class="ns-mock-empty">Search a listing to see host requests</div>`;
      }
      return;
    }
    const guests = listing.guests || 2;
    body.innerHTML = `
      <div class="ns-host-panel">
        <div class="ns-host-panel__card">
          <div class="ns-host-panel__media">${videoTourHtml(listing.media)}</div>
          <div class="ns-host-panel__label">Pending request</div>
          <div class="ns-host-panel__title">${escapeHtml(listing.title)} · ${guests} guests · ${NIGHTS} nights</div>
          <div class="ns-host-panel__price">&#8377;${formatInr(checkoutPreview(listing).total)} total</div>
          <div class="ns-host-panel__actions">
            <span class="ns-host-btn ns-host-btn--accept">Accept</span>
            <span class="ns-host-btn">Decline</span>
          </div>
        </div>
      </div>`;
    startVideoTours(body);
  }

  function setStatus(mockEl, text) {
    const el = mockEl.querySelector("[data-ns-mock-status]");
    if (el) el.textContent = text || "";
  }

  async function runMockSearch(mockEl, query) {
    const type = mockEl.dataset.nsMock;
    const limit = mockEl.dataset.limit || "4";
    const category = mockEl.dataset.category || "";
    const guests = mockEl.dataset.guests || "";

    setStatus(mockEl, "Searching…");
    mockEl.classList.add("is-loading");

    try {
      const data = await fetchListings({
        q: query,
        category,
        guests,
        limit,
      });
      const list = data.listings || [];

      if (type === "listings") {
        renderListingsMock(mockEl, list, mockEl.dataset.cols || "4");
        setStatus(mockEl, list.length ? `${list.length} stay${list.length === 1 ? "" : "s"} found` : "");
      } else if (type === "checkout") {
        renderCheckoutMock(mockEl, list[0] || null);
        setStatus(mockEl, list[0] ? `Checkout for ${list[0].title}` : "");
      } else if (type === "messages") {
        renderMessagesMock(mockEl, list[0] || null);
        setStatus(mockEl, list[0] ? `Chat with host of ${list[0].title}` : "");
      } else if (type === "host") {
        renderHostMock(mockEl, list[0] || null);
        setStatus(mockEl, list[0] ? `New request · ${list[0].location}` : "");
      }
    } catch {
      setStatus(mockEl, "Could not load results");
    } finally {
      mockEl.classList.remove("is-loading");
    }
  }

  const debouncedByMock = new WeakMap();

  function bindMock(mockEl) {
    const input = mockEl.querySelector(".ns-mock__search");
    if (!input) return;

    const defaultQ = mockEl.dataset.defaultQ || "";
    if (defaultQ && !input.value) input.value = defaultQ;

    const run = () => runMockSearch(mockEl, input.value.trim());
    const debounced = debounce(run, 320);
    debouncedByMock.set(mockEl, debounced);

    input.addEventListener("input", debounced);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        run();
      }
    });

    run();
  }

  function init() {
    document.querySelectorAll("[data-ns-mock]").forEach(bindMock);

    const heroQ = document.getElementById("hero-q");
    const heroMock = document.querySelector('[data-ns-mock="listings"][data-mock-id="hero"]');
    if (heroQ && heroMock) {
      const heroInput = heroMock.querySelector(".ns-mock__search");
      const syncFromHero = debounce(() => {
        if (heroInput) heroInput.value = heroQ.value;
        runMockSearch(heroMock, heroQ.value.trim());
      }, 320);
      heroQ.addEventListener("input", syncFromHero);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.NullStayHomeMocks = { runMockSearch, fetchListings };
})();
