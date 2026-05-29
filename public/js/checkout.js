(function () {
  const form = document.getElementById("checkoutForm");
  if (!form) return;

  const submitBtn = document.getElementById("checkoutSubmit");
  const errorEl = document.getElementById("checkoutPaymentError");
  const stripeEnabled = form.dataset.stripeEnabled === "true";
  const submitLabel =
    form.dataset.submitLabel || "Pay and confirm";
  const submitIcon =
    '<i class="fa-solid fa-arrow-right text-sm"></i>';

  function showError(message) {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.classList.remove("hidden");
  }

  function clearError() {
    if (!errorEl) return;
    errorEl.textContent = "";
    errorEl.classList.add("hidden");
  }

  function setLoading(loading) {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    if (loading) {
      submitBtn.innerHTML =
        '<span class="booking-spinner inline-block mr-2"></span> Processing…';
    }
  }

  function formatDemoCardInputs() {
    const cardNumber = document.getElementById("cardNumber");
    const cardExpiry = document.getElementById("cardExpiry");

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
  }

  async function initStripeCheckout() {
    const publishableKey = form.dataset.stripeKey;
    if (!publishableKey || typeof Stripe === "undefined") {
      showError("Payment system failed to load. Refresh and try again.");
      if (submitBtn) submitBtn.disabled = true;
      return null;
    }

    const stripe = Stripe(publishableKey);
    let clientSecret;

    try {
      const res = await fetch("/bookings/payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          listingId: form.dataset.listingId,
          checkIn: form.dataset.checkIn,
          checkOut: form.dataset.checkOut,
          guests: Number(form.dataset.guests),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not start payment.");
      }
      clientSecret = data.clientSecret;
    } catch (err) {
      showError(err.message || "Could not start payment.");
      if (submitBtn) submitBtn.disabled = true;
      return null;
    }

    const elements = stripe.elements({
      clientSecret,
      appearance: {
        theme: "stripe",
        variables: {
          colorPrimary: "#FF385C",
          borderRadius: "12px",
        },
      },
    });

    const paymentElement = elements.create("payment");
    paymentElement.mount("#payment-element");

    return { stripe, elements };
  }

  if (!stripeEnabled) {
    formatDemoCardInputs();
    form.addEventListener("submit", () => setLoading(true));
    return;
  }

  let stripeCheckout = null;

  initStripeCheckout().then((ctx) => {
    stripeCheckout = ctx;
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError();

    if (!stripeCheckout) {
      showError("Payment is still loading. Please wait a moment.");
      return;
    }

    setLoading(true);

    const { stripe, elements } = stripeCheckout;

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      setLoading(false);
      showError(error.message || "Payment failed.");
      submitBtn.innerHTML = `<span>${submitLabel}</span>${submitIcon}`;
      return;
    }

    if (!paymentIntent || paymentIntent.status !== "succeeded") {
      setLoading(false);
      showError("Payment was not completed.");
      submitBtn.innerHTML = `<span>${submitLabel}</span>${submitIcon}`;
      return;
    }

    document.getElementById("paymentIntentId").value = paymentIntent.id;
    form.submit();
  });
})();
