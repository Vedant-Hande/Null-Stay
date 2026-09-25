(function () {
  if (!window.__NULLSTAY_USER_ID__) return;

  const toastStack = document.getElementById("notificationToastStack");

  function showMessageToast(payload) {
    if (!toastStack || !payload) return;

    const link = `/messages/${payload.from}/${payload.listingId}`;
    const el = document.createElement("a");
    el.href = link;
    el.className = "notification-toast block hover:bg-gray-50 transition";
    el.innerHTML = `
      <p class="notification-toast__title">New message</p>
      <p class="notification-toast__message"></p>
    `;
    el.querySelector(".notification-toast__message").textContent =
      payload.body || "You have a new message";

    toastStack.appendChild(el);

    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transition = "opacity 0.3s";
      setTimeout(() => el.remove(), 300);
    }, 7000);
  }

  document.addEventListener("nullstay:new_message", (event) => {
    showMessageToast(event.detail);
  });
})();
