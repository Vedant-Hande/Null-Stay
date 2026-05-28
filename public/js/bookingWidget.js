(function () {
  function initBookingWidget() {
    const card = document.getElementById("bookingCard");
    if (!card || card.dataset.isOwner === "true") return;

    if (typeof flatpickr === "undefined") {
      console.error("Flatpickr failed to load — date picker unavailable.");
      return;
    }

    const price = Number(card.dataset.price) || 0;
    const maxGuests = Number(card.dataset.maxGuests) || 1;
    const cleaningFee = Number(card.dataset.cleaningFee) || 0;
    const serviceFee = Number(card.dataset.serviceFee) || 0;
    const listingId = card.dataset.listingId;
    const bookedUrl = card.dataset.bookedDatesUrl;
    const isLoggedIn = card.dataset.isLoggedIn === "true";
    const instantBook = card.dataset.instantBook !== "false";

    const fieldsWrap = document.getElementById("bookingFields");
    const calendarPanel = document.getElementById("bookingCalendarPanel");
    const calendarMount = document.getElementById("bookingCalendarMount");
    const calendarHintText = document.getElementById("calendarHintText");
    const checkInEl = document.getElementById("bookingCheckIn");
    const checkOutEl = document.getElementById("bookingCheckOut");
    const checkInDisplay = document.getElementById("checkInDisplay");
    const checkOutDisplay = document.getElementById("checkOutDisplay");
    const checkInCell = document.getElementById("checkInCell");
    const checkOutCell = document.getElementById("checkOutCell");
    const guestsRow = document.querySelector(".booking-card__row--guests");

    const reserveBtn = document.getElementById("reserveBtn");
    const reserveBtnText = document.getElementById("reserveBtnText");
    const priceBreakdown = document.getElementById("priceBreakdown");
    const bookingHint = document.getElementById("bookingHint");
    const bookingHintText = document.getElementById("bookingHintText");
    const nightsLine = document.getElementById("nightsLine");
    const subtotalAmount = document.getElementById("subtotalAmount");
    const totalAmount = document.getElementById("totalAmount");

    const guestsToggle = document.getElementById("guestsToggle");
    const guestsDropdown = document.getElementById("guestsDropdown");
    const guestsChevron = document.getElementById("guestsChevron");
    const guestsLabel = document.getElementById("guestsLabel");
    const guestsCountEl = document.getElementById("guestsCount");
    const guestsMinus = document.getElementById("guestsMinus");
    const guestsPlus = document.getElementById("guestsPlus");

    let guestCount = 1;
    let disabledDates = [];
    let rangePicker = null;
    let calendarOpen = false;
    let guestsOpen = false;

    const MONTHS_SHORT = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    if (reserveBtnText) {
      reserveBtnText.textContent = instantBook ? "Reserve" : "Request to book";
    }

    function notify(msg, isError) {
      const ui = window.NullStayUI;
      if (ui) {
        if (isError) ui.error(msg);
        else ui.warning(msg);
      }
    }

    function formatInr(n) {
      return "₹ " + n.toLocaleString("en-IN");
    }

    function guestLabel(n) {
      return n === 1 ? "1 guest" : n + " guests";
    }

    function parseYmd(str) {
      const parts = str.split("-").map(Number);
      return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    }

    function formatDisplayDate(ymd) {
      if (!ymd) return "";
      const d = parseYmd(ymd);
      return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
    }

    function nightsBetween(inStr, outStr) {
      if (!inStr || !outStr) return 0;
      return Math.round((parseYmd(outStr) - parseYmd(inStr)) / 86400000);
    }

    function syncDateUI() {
      updateCalendarHint();
      const inVal = checkInEl?.value || "";
      const outVal = checkOutEl?.value || "";

      if (checkInDisplay) {
        if (inVal) {
          checkInDisplay.textContent = formatDisplayDate(inVal);
          checkInDisplay.classList.remove("booking-card__value--placeholder");
        } else {
          checkInDisplay.textContent = "Add date";
          checkInDisplay.classList.add("booking-card__value--placeholder");
        }
      }

      if (checkOutDisplay) {
        if (outVal) {
          checkOutDisplay.textContent = formatDisplayDate(outVal);
          checkOutDisplay.classList.remove("booking-card__value--placeholder");
        } else {
          checkOutDisplay.textContent = "Add date";
          checkOutDisplay.classList.add("booking-card__value--placeholder");
        }
      }

      checkInCell?.classList.toggle("booking-card__cell--filled", Boolean(inVal));
      checkOutCell?.classList.toggle("booking-card__cell--filled", Boolean(outVal));
    }

    function updatePricing() {
      syncDateUI();

      const inVal = checkInEl?.value;
      const outVal = checkOutEl?.value;
      const nights = nightsBetween(inVal, outVal);

      if (nights < 1) {
        priceBreakdown?.classList.add("hidden");
        bookingHint?.classList.remove("hidden");
        if (bookingHintText) {
          bookingHintText.textContent = inVal && !outVal
            ? "Select check-out date"
            : "Select dates to see pricing";
        }
        if (reserveBtn) reserveBtn.disabled = true;
        return;
      }

      const subtotal = price * nights;
      const total = subtotal + cleaningFee + serviceFee;

      if (nightsLine) {
        nightsLine.textContent =
          "₹ " + price.toLocaleString("en-IN") + " × " + nights +
          " night" + (nights > 1 ? "s" : "");
      }
      if (subtotalAmount) subtotalAmount.textContent = formatInr(subtotal);
      if (totalAmount) totalAmount.textContent = formatInr(total);

      priceBreakdown?.classList.remove("hidden");
      bookingHint?.classList.add("hidden");
      if (reserveBtn) reserveBtn.disabled = false;
    }

    function setGuestCount(n) {
      guestCount = Math.min(maxGuests, Math.max(1, n));
      if (guestsCountEl) guestsCountEl.textContent = String(guestCount);
      if (guestsLabel) guestsLabel.textContent = guestLabel(guestCount);
      if (guestsMinus) guestsMinus.disabled = guestCount <= 1;
      if (guestsPlus) guestsPlus.disabled = guestCount >= maxGuests;
    }

    function setGuestsOpen(open) {
      guestsOpen = open;
      guestsDropdown?.classList.toggle("hidden", !open);
      guestsChevron?.classList.toggle("booking-card__chevron--open", open);
      guestsToggle?.setAttribute("aria-expanded", open ? "true" : "false");
      guestsRow?.classList.toggle("booking-card__row--guests--open", open);
      if (open) closeCalendar();
    }

    function setCalendarOpen(open) {
      calendarOpen = open;
      calendarPanel?.classList.toggle("hidden", !open);
      fieldsWrap?.classList.toggle("booking-card__fields--calendar-open", open);
      fieldsWrap?.classList.toggle("booking-card__fields--open", open);
      if (open) {
        setGuestsOpen(false);
        rangePicker?.redraw();
      }
    }

    function openCalendar() {
      setCalendarOpen(true);
    }

    function closeCalendar() {
      setCalendarOpen(false);
    }

    function updateCalendarHint() {
      if (!calendarHintText) return;
      const inVal = checkInEl?.value;
      const outVal = checkOutEl?.value;
      if (inVal && outVal) {
        calendarHintText.textContent =
          formatDisplayDate(inVal) + " → " + formatDisplayDate(outVal);
      } else if (inVal) {
        calendarHintText.textContent = "Now choose checkout";
      } else {
        calendarHintText.textContent = "Add check-in and checkout";
      }
    }

    function initRangePicker() {
      const mount = calendarMount || calendarPanel;
      if (!mount) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      rangePicker = flatpickr(mount, {
        inline: true,
        mode: "range",
        minDate: today,
        dateFormat: "Y-m-d",
        disable: disabledDates,
        showMonths: 1,
        animate: false,
        monthSelectorType: "dropdown",
        locale: {
          weekdays: {
            shorthand: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
            longhand: [
              "Sunday", "Monday", "Tuesday", "Wednesday",
              "Thursday", "Friday", "Saturday",
            ],
          },
        },
        onChange(selected) {
          if (selected.length >= 1 && checkInEl) {
            checkInEl.value = flatpickr.formatDate(selected[0], "Y-m-d");
          } else if (checkInEl) {
            checkInEl.value = "";
          }

          if (selected.length >= 2 && checkOutEl) {
            checkOutEl.value = flatpickr.formatDate(selected[1], "Y-m-d");
          } else if (checkOutEl) {
            checkOutEl.value = "";
          }

          updateCalendarHint();
          updatePricing();
        },
      });
    }

    async function loadBookedDates() {
      try {
        const res = await fetch(bookedUrl);
        if (!res.ok) return;
        const data = await res.json();
        disabledDates = data.disabled || [];
        if (rangePicker) {
          rangePicker.set("disable", disabledDates);
        }
      } catch {
        /* keep calendar usable without blocked dates */
      }
    }

    checkInCell?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (calendarOpen) closeCalendar();
      else openCalendar();
    });

    checkOutCell?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openCalendar();
    });

    guestsToggle?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      setGuestsOpen(!guestsOpen);
    });

    guestsMinus?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      setGuestCount(guestCount - 1);
    });

    guestsPlus?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      setGuestCount(guestCount + 1);
    });

    guestsDropdown?.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    calendarPanel?.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    document.addEventListener("click", (e) => {
      if (!card.contains(e.target)) {
        setGuestsOpen(false);
        closeCalendar();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        setGuestsOpen(false);
        closeCalendar();
      }
    });

    if (reserveBtn) {
      reserveBtn.disabled = true;
      reserveBtn.addEventListener("click", () => {
        const checkIn = checkInEl?.value;
        const checkOut = checkOutEl?.value;

        if (!checkIn || !checkOut) {
          notify("Please select check-in and check-out dates.", true);
          openCalendar();
          return;
        }

        if (nightsBetween(checkIn, checkOut) < 1) {
          notify("Check-out must be after check-in.", true);
          return;
        }

        const params = new URLSearchParams({
          checkIn,
          checkOut,
          guests: String(guestCount),
        });

        const checkoutPath =
          "/listings/" + listingId + "/checkout?" + params.toString();

        if (!isLoggedIn) {
          window.location.href =
            "/login?redirect=" + encodeURIComponent(checkoutPath);
          return;
        }

        reserveBtn.disabled = true;
        if (reserveBtnText) reserveBtnText.textContent = "Loading…";
        window.location.href = checkoutPath;
      });
    }

    setGuestCount(1);
    syncDateUI();
    initRangePicker();
    loadBookedDates();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBookingWidget);
  } else {
    initBookingWidget();
  }
})();
