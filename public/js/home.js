(function () {
  const nav = document.getElementById("nsNav");
  if (nav) {
    window.addEventListener(
      "scroll",
      () => nav.classList.toggle("is-scrolled", window.scrollY > 20),
      { passive: true },
    );
  }

  const fades = document.querySelectorAll(".ns-fade");
  fades.forEach((el, i) => {
    if (!el.style.getPropertyValue("--i")) el.style.setProperty("--i", String(i % 6));
  });

  if (fades.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.06, rootMargin: "0px 0px -32px 0px" },
    );
    fades.forEach((el) => io.observe(el));
  } else {
    fades.forEach((el) => el.classList.add("is-in"));
  }

  const tabLinks = document.querySelectorAll(".ns-tabs a[href^=\"#\"]");
  const sections = ["discover", "book", "message", "host"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  tabLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href");
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      tabLinks.forEach((a) => a.classList.remove("is-active"));
      link.classList.add("is-active");
    });
  });

  document.querySelectorAll("[data-count]").forEach((el) => {
    const target = parseInt(el.getAttribute("data-count"), 10);
    if (Number.isNaN(target)) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        let n = 0;
        const step = Math.max(1, Math.ceil(target / 24));
        const tick = () => {
          n = Math.min(n + step, target);
          el.textContent = String(n);
          if (n < target) requestAnimationFrame(tick);
        };
        tick();
        io.disconnect();
      },
      { threshold: 0.5 },
    );
    io.observe(el);
  });

  if (sections.length && tabLinks.length && "IntersectionObserver" in window) {
    const tabIo = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const id = visible.target.id;
        tabLinks.forEach((a) => {
          a.classList.toggle("is-active", a.getAttribute("href") === `#${id}`);
        });
      },
      { rootMargin: "-40% 0px -45% 0px", threshold: [0, 0.2, 0.5] },
    );
    sections.forEach((s) => tabIo.observe(s));
  }
})();
