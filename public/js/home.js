(function () {
  const fades = document.querySelectorAll(".ns-fade");
  if (!fades.length) return;

  if (!("IntersectionObserver" in window)) {
    fades.forEach((el) => el.classList.add("is-in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -24px 0px" },
  );

  fades.forEach((el) => io.observe(el));
})();
