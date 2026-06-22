(function () {
  const el = document.getElementById("listingMap");
  if (!el) return;

  const Lref = window.L;
  if (typeof Lref === "undefined") {
    renderMapError(el, "Map failed to load.");
    return;
  }

  const lat = Number(el.dataset.lat);
  const lng = Number(el.dataset.lng);
  const title = el.dataset.title || "Stay";
  const place = el.dataset.place || "";

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    renderMapError(el, "Map unavailable for this location.");
    return;
  }

  const loading = el.querySelector(".listing-map__loading");
  if (loading) loading.remove();

  const map = Lref.map(el, {
    scrollWheelZoom: false,
    zoomControl: true,
  }).setView([lat, lng], 13);

  const tiles = Lref.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution:
        "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
      maxZoom: 19,
    },
  ).addTo(map);

  tiles.on("tileerror", () => {
    if (window.NullStayUI?.warning) {
      window.NullStayUI.warning("Map tiles failed to load. Check your network.");
    }
  });

  const icon = Lref.divIcon({
    className: "listing-map-marker-wrap",
    html: "<div class=\"listing-map-marker\" aria-hidden=\"true\"><i class=\"fa-solid fa-house\"></i></div>",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });

  Lref.marker([lat, lng], { icon })
    .addTo(map)
    .bindPopup(
      `<strong>${escapeHtml(title)}</strong><br>${escapeHtml(place)}`,
    );

  setTimeout(() => map.invalidateSize(), 100);
})();

function renderMapError(root, message) {
  const loading = root.querySelector(".listing-map__loading");
  if (loading) loading.remove();
  root.classList.add("listing-map__error");
  const place = root.dataset.place || "";
  const url = place
    ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(place)}`
    : "https://www.openstreetmap.org/";
  root.innerHTML = `${escapeHtml(message)} ${
    place
      ? `Search <a href="${escapeHtml(url)}" class="underline font-medium" target="_blank" rel="noopener noreferrer">${escapeHtml(place)}</a> on OpenStreetMap.`
      : `<a href="${escapeHtml(url)}" class="underline font-medium" target="_blank" rel="noopener noreferrer">Open OpenStreetMap</a>.`
  }`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
