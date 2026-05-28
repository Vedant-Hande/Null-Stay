(function () {
  const form = document.getElementById("checkoutForm");
  if (!form) return;

  const cardNumber = document.getElementById("cardNumber");
  const cardExpiry = document.getElementById("cardExpiry");
  const submitBtn = document.getElementById("checkoutSubmit");

  if (cardNumber) {
    cardNumber.addEventListener("input", (e) => {
      let v = e.target.value.replace(/\D/g, "").slice(0, 16);
      e.target.value = v.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
    });
  }

  if (cardExpiry) {
    cardExpiry.addEventListener("input", (e) => {
      let v = e.target.value.replace(/\D/g, "").slice(0, 4);
      if (v.length >= 2) {
        v = v.slice(0, 2) + "/" + v.slice(2);
      }
      e.target.value = v;
    });
  }

  form.addEventListener("submit", () => {
    if (!submitBtn) return;
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<span class="booking-spinner inline-block mr-2"></span> Processing…';
  });
})();
