(function () {
  const el = document.getElementById("listingMap");
  if (!el || typeof L === "undefined") return;

  const lat = Number(el.dataset.lat);
  const lng = Number(el.dataset.lng);
  const title = el.dataset.title || "Stay";
  const place = el.dataset.place || "";

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

  const loading = el.querySelector(".listing-map__loading");
  if (loading) loading.remove();

  const map = L.map(el, {
    scrollWheelZoom: false,
    zoomControl: true,
  }).setView([lat, lng], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map);

  const icon = L.divIcon({
    className: "listing-map-marker-wrap",
    html: '<div class="listing-map-marker" aria-hidden="true"><i class="fa-solid fa-house"></i></div>',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });

  L.marker([lat, lng], { icon })
    .addTo(map)
    .bindPopup(
      `<strong>${escapeHtml(title)}</strong><br>${escapeHtml(place)}`,
    );

  setTimeout(() => map.invalidateSize(), 100);
})();

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
