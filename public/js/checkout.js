(function () {
  const form = document.getElementById("checkoutForm");
  if (!form) return;

  const submitBtn = document.getElementById("checkoutSubmit");
  const errorEl = document.getElementById("checkoutPaymentError");
  const razorpayEnabled = form.dataset.razorpayEnabled === "true";
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
    } else {
      submitBtn.innerHTML = `<span>${submitLabel}</span>${submitIcon}`;
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

  async function openRazorpayCheckout() {
    const key = form.dataset.razorpayKey;
    if (!key || typeof Razorpay === "undefined") {
      showError("Payment system failed to load. Refresh and try again.");
      return;
    }

    setLoading(true);
    clearError();

    let order;
    try {
      const res = await fetch("/bookings/razorpay-order", {
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
      order = data;
    } catch (err) {
      setLoading(false);
      showError(err.message || "Could not start payment.");
      return;
    }

    const listingTitle = form.dataset.listingTitle || "NullStay booking";
    const userName = form.dataset.userName || "";
    const userEmail = form.dataset.userEmail || "";

    const options = {
      key,
      amount: order.amount,
      currency: order.currency,
      name: "NullStay",
      description: order.listingTitle || listingTitle,
      order_id: order.orderId,
      prefill: {
        name: userName,
        email: userEmail,
      },
      theme: { color: "#FF385C" },
      handler(response) {
        document.getElementById("razorpayOrderId").value =
          response.razorpay_order_id;
        document.getElementById("razorpayPaymentId").value =
          response.razorpay_payment_id;
        document.getElementById("razorpaySignature").value =
          response.razorpay_signature;
        setLoading(true);
        form.submit();
      },
      modal: {
        ondismiss() {
          setLoading(false);
        },
      },
    };

    setLoading(false);
    const rzp = new Razorpay(options);
    rzp.on("payment.failed", (response) => {
      showError(
        response.error?.description || "Payment failed. Please try again.",
      );
      setLoading(false);
    });
    rzp.open();
  }

  if (!razorpayEnabled) {
    formatDemoCardInputs();
    form.addEventListener("submit", () => setLoading(true));
    return;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    openRazorpayCheckout();
  });
})();
