(function () {
  const citySelect = document.getElementById("listingCity");
  const areaSelect = document.getElementById("listingArea");
  const dataEl = document.getElementById("areasByCityData");
  if (!citySelect || !areaSelect || !dataEl) return;

  let areasByCity = {};
  try {
    areasByCity = JSON.parse(dataEl.textContent || "{}");
  } catch {
    areasByCity = {};
  }

  const initialArea = areaSelect.dataset.initialArea || "";

  function fillAreas(cityId) {
    const areas = areasByCity[cityId] || [];
    areaSelect.innerHTML = "<option value=\"\">Select area (optional)</option>";
    areas.forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      if (name === initialArea) opt.selected = true;
      areaSelect.appendChild(opt);
    });
    if (initialArea && !areas.includes(initialArea) && initialArea.trim()) {
      const opt = document.createElement("option");
      opt.value = initialArea;
      opt.textContent = initialArea;
      opt.selected = true;
      areaSelect.appendChild(opt);
    }
  }

  citySelect.addEventListener("change", () => fillAreas(citySelect.value));
  if (citySelect.value) fillAreas(citySelect.value);
})();
