(function () {
  function qs(id) {
    return document.getElementById(id);
  }

  const modal = qs("shareModal");
  const titleEl = qs("shareModalTitle");
  const closeBtn = qs("shareModalClose");
  const backdrop = qs("shareModalBackdrop");
  const copyBtn = qs("shareCopyBtn");
  const linkWhatsapp = qs("shareLinkWhatsapp");
  const linkFacebook = qs("shareLinkFacebook");
  const linkX = qs("shareLinkX");
  const linkLinkedin = qs("shareLinkLinkedin");

  if (!modal) return;

  let current = { title: "", url: "" };

  function open({ title, url }) {
    current = { title: String(title || ""), url: String(url || "") };
    if (titleEl) titleEl.textContent = current.title || "";
    setLinks();
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function close() {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function setLinks() {
    const u = encodeURIComponent(current.url);
    const t = encodeURIComponent(current.title);
    if (linkWhatsapp) linkWhatsapp.href = `https://wa.me/?text=${t}%20${u}`;
    if (linkFacebook)
      linkFacebook.href = `https://www.facebook.com/sharer/sharer.php?u=${u}`;
    if (linkX) linkX.href = `https://twitter.com/intent/tweet?text=${t}&url=${u}`;
    if (linkLinkedin)
      linkLinkedin.href = `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
  }

  async function copy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(current.url);
      } else {
        const ta = document.createElement("textarea");
        ta.value = current.url;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      window.NullStayUI?.success?.("Link copied");
    } catch {
      window.NullStayUI?.error?.("Could not copy link");
    }
  }

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest?.("[data-share-trigger]");
    if (!trigger) return;
    e.preventDefault();

    const title = trigger.getAttribute("data-share-title") || document.title;
    const url = new URL(window.location.href);
    url.hash = "";
    open({ title, url: url.toString() });
  });

  closeBtn?.addEventListener("click", close);
  backdrop?.addEventListener("click", close);
  copyBtn?.addEventListener("click", copy);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) close();
  });
})();
