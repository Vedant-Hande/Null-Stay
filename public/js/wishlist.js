(function () {
  if (!window.__NULLSTAY_USER_ID__) return;

  function setHeartState(btn, saved) {
    btn.classList.toggle("is-saved", saved);

    const icon = btn.querySelector(".wishlist-heart__icon");
    if (icon) {
      icon.classList.toggle("fa-solid", saved);
      icon.classList.toggle("fa-regular", !saved);
    }

    const label = btn.querySelector("[data-wishlist-label]");
    if (label) {
      label.textContent = saved ? "Saved" : "Save";
    }

    btn.setAttribute("aria-pressed", saved ? "true" : "false");
    btn.setAttribute(
      "aria-label",
      saved ? "Remove from wishlist" : "Save to wishlist",
    );
  }

  function playLikeAnimation(btn) {
    btn.classList.remove("is-liked");
    void btn.offsetWidth;
    btn.classList.add("is-liked");

    const existing = btn.querySelector(".wishlist-heart__burst");
    if (existing) existing.remove();

    const burst = document.createElement("span");
    burst.className = "wishlist-heart__burst";
    burst.setAttribute("aria-hidden", "true");

    const count = 6;
    for (let i = 0; i < count; i += 1) {
      const p = document.createElement("span");
      p.className = "wishlist-heart__particle";
      const angle = (i / count) * Math.PI * 2;
      const dist = 14 + Math.random() * 6;
      p.style.setProperty("--tx", `${Math.cos(angle) * dist}px`);
      p.style.setProperty("--ty", `${Math.sin(angle) * dist}px`);
      burst.appendChild(p);
    }

    btn.appendChild(burst);
    setTimeout(() => {
      btn.classList.remove("is-liked");
      burst.remove();
    }, 600);
  }

  async function toggleWishlist(btn) {
    const listingId = btn.dataset.listingId;
    if (!listingId || btn.dataset.wishlistBusy === "1") return;

    btn.dataset.wishlistBusy = "1";

    try {
      const res = await fetch(`/wishlists/${listingId}/toggle`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        credentials: "same-origin",
      });

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!res.ok) throw new Error("toggle failed");

      const data = await res.json();
      const wasSaved = btn.classList.contains("is-saved");
      setHeartState(btn, data.saved);

      if (data.saved && !wasSaved) {
        playLikeAnimation(btn);
      }

      if (!data.saved && btn.dataset.wishlistRemoveCard === "1") {
        const card = btn.closest("[data-wishlist-card]");
        if (card) {
          card.style.transition = "opacity 0.3s ease, transform 0.3s ease";
          card.style.opacity = "0";
          card.style.transform = "scale(0.96)";
          setTimeout(() => card.remove(), 320);
        }
      }
    } catch {
      /* ignore */
    } finally {
      delete btn.dataset.wishlistBusy;
    }
  }

  document.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-wishlist-toggle]");
    if (!btn) return;

    event.preventDefault();
    event.stopPropagation();
    toggleWishlist(btn);
  });
})();
