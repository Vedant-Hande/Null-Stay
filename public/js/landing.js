(function () {
  const nav = document.getElementById("nsNav");
  if (nav) {
    window.addEventListener(
      "scroll",
      () => nav.classList.toggle("is-scrolled", window.scrollY > 20),
      { passive: true },
    );
  }

  const fades = document.querySelectorAll(".ns-static .ns-help-card, .ns-static-prose-card, .ns-host-step, .ns-host-benefit, .ns-status-card, .ns-sitemap-link");
  if (fades.length && "IntersectionObserver" in window) {
    fades.forEach((el, i) => {
      el.classList.add("ns-fade");
      el.style.setProperty("--i", String(i % 8));
    });
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -24px 0px" },
    );
    fades.forEach((el) => io.observe(el));
  }
})();
