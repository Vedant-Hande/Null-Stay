(function () {
  if (!window.__NULLSTAY_USER_ID__) return;

  const DESKTOP_ASKED_KEY = "nullstay_desktop_notify_asked";
  const DESKTOP_DISMISSED_KEY = "nullstay_desktop_notify_dismissed";
  const ICON_URL = "/img/nullstay-notification.svg";

  const badge = document.getElementById("notificationBadge");
  const toastStack = document.getElementById("notificationToastStack");
  const bellBtn = document.getElementById("notificationBellBtn");
  const dropdown = document.getElementById("notificationDropdown");
  const listEl = document.getElementById("notificationDropdownList");
  const markAllBtn = document.getElementById("notificationMarkAllBtn");
  const enableDesktopBtn = document.getElementById("notificationEnableDesktopBtn");
  const panelRoot = document.getElementById("notificationPanelRoot");
  const desktopBanner = document.getElementById("desktopNotifyBanner");
  const desktopBannerEnable = document.getElementById("desktopNotifyBannerEnable");
  const desktopBannerDismiss = document.getElementById("desktopNotifyBannerDismiss");

  let dropdownOpen = false;
  let recentCache = [];
  let pushSubscribed = false;

  function desktopSupported() {
    return "Notification" in window;
  }

  function pushSupported() {
    return (
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    );
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const raw = window.atob(base64);
    return Uint8Array.from([...raw], (c) => c.charCodeAt(0));
  }

  async function getVapidPublicKey() {
    if (window.__NULLSTAY_VAPID_KEY__) {
      return window.__NULLSTAY_VAPID_KEY__;
    }
    try {
      const res = await fetch("/push/config", { credentials: "same-origin" });
      if (!res.ok) return null;
      const data = await res.json();
      return data.enabled ? data.publicKey : null;
    } catch {
      return null;
    }
  }

  async function registerPushSubscription() {
    if (!pushSupported()) return false;

    const publicKey = await getVapidPublicKey();
    if (!publicKey) return false;

    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    const res = await fetch("/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(sub),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      console.error(
        "[push] Subscribe failed:",
        errBody.error || res.statusText,
      );
      return false;
    }

    pushSubscribed = true;

    const testRes = await fetch("/push/test", {
      method: "POST",
      credentials: "same-origin",
    });
    if (!testRes.ok) {
      const testErr = await testRes.json().catch(() => ({}));
      console.warn("[push] Test delivery:", testErr.error || testRes.status);
    }

    return true;
  }

  function setBadgeCount(count) {
    if (!badge) return;
    const n = Number(count) || 0;
    if (n <= 0) {
      badge.classList.add("hidden");
      badge.textContent = "";
      return;
    }
    badge.classList.remove("hidden");
    badge.textContent = n > 99 ? "99+" : String(n);
  }

  function formatTime(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    if (diffMs < 60000) return "Just now";
    if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
    if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`;
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  }

  function renderDropdownList(notifications) {
    if (!listEl) return;
    recentCache = notifications || [];

    if (!recentCache.length) {
      listEl.innerHTML =
        "<li class=\"px-4 py-8 text-center text-sm text-gray-400\">No notifications yet</li>";
      if (markAllBtn) markAllBtn.classList.add("hidden");
      return;
    }

    const hasUnread = recentCache.some((n) => !n.read);
    if (markAllBtn) {
      markAllBtn.classList.toggle("hidden", !hasUnread);
    }

    listEl.innerHTML = recentCache
      .map(
        (n) => `
      <li>
        <a href="${n.link || "/notifications"}"
          class="notification-dropdown-item ${n.read ? "" : "is-unread"}"
          data-notification-id="${n._id}">
          <p class="notification-dropdown-item__title"></p>
          <p class="notification-dropdown-item__message"></p>
          <p class="notification-dropdown-item__time"></p>
        </a>
      </li>`,
      )
      .join("");

    listEl.querySelectorAll(".notification-dropdown-item").forEach((el, i) => {
      const n = recentCache[i];
      el.querySelector(".notification-dropdown-item__title").textContent =
        n.title || "Notification";
      el.querySelector(".notification-dropdown-item__message").textContent =
        n.message || "";
      el.querySelector(".notification-dropdown-item__time").textContent =
        formatTime(n.createdAt);

      el.addEventListener("click", () => {
        if (!n.read) {
          fetch(`/notifications/${n._id}/read`, {
            method: "PATCH",
            credentials: "same-origin",
          }).then(() => refreshCount());
        }
        closeDropdown();
      });
    });
  }

  async function fetchRecent() {
    try {
      const res = await fetch("/notifications/recent?limit=8", {
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      renderDropdownList(data.notifications);
    } catch {
      if (listEl) {
        listEl.innerHTML =
          "<li class=\"px-4 py-6 text-center text-sm text-rose-600\">Could not load notifications</li>";
      }
    }
  }

  function showToast(notification) {
    if (!toastStack || !notification) return;

    const el = document.createElement("a");
    el.href = notification.link || "/notifications";
    el.className = "notification-toast block hover:bg-gray-50 transition";
    el.innerHTML = `
      <p class="notification-toast__title"></p>
      <p class="notification-toast__message"></p>
    `;
    el.querySelector(".notification-toast__title").textContent =
      notification.title || "Notification";
    el.querySelector(".notification-toast__message").textContent =
      notification.message || "";

    toastStack.appendChild(el);

    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transition = "opacity 0.3s";
      setTimeout(() => el.remove(), 300);
    }, 7000);
  }

  function showDesktopNotification(notification) {
    if (!desktopSupported()) return;
    if (Notification.permission !== "granted") return;
    if (!notification) return;

    try {
      const n = new Notification(notification.title || "NullStay", {
        body: notification.message || "",
        tag: notification._id || "nullstay",
        icon: ICON_URL,
        badge: ICON_URL,
        requireInteraction: false,
      });
      n.onclick = () => {
        window.focus();
        window.location.href = notification.link || "/notifications";
        n.close();
      };
    } catch {
      /* ignore */
    }
  }

  function hideDesktopBanner() {
    if (desktopBanner) desktopBanner.classList.add("hidden");
  }

  function showDesktopBanner() {
    if (!desktopBanner || !desktopSupported()) return;
    if (Notification.permission !== "default") return;
    if (localStorage.getItem(DESKTOP_DISMISSED_KEY) === "1") return;
    desktopBanner.classList.remove("hidden");
  }

  async function requestDesktopPermission() {
    if (!desktopSupported()) return "unsupported";
    localStorage.setItem(DESKTOP_ASKED_KEY, "1");

    const result = await Notification.requestPermission();
    updateDesktopPrompt();
    hideDesktopBanner();

    if (result === "granted") {
      const pushOk = await registerPushSubscription();
      if (!pushOk) {
        showDesktopNotification({
          title: "Desktop alerts on",
          message: "In-browser alerts enabled. Add VAPID keys in .env for push when tab is closed.",
          link: "/notifications",
          _id: "welcome",
        });
      }
    }

    return result;
  }

  function handleIncoming(notification) {
    if (!notification) return;

    showToast(notification);

    if (
      Notification.permission === "granted" &&
      !pushSubscribed
    ) {
      showDesktopNotification(notification);
    } else if (
      Notification.permission === "default" &&
      localStorage.getItem(DESKTOP_DISMISSED_KEY) !== "1"
    ) {
      showDesktopBanner();
    }

    recentCache = [
      { ...notification, read: false },
      ...recentCache.filter((x) => x._id !== notification._id),
    ].slice(0, 8);

    if (dropdownOpen) {
      renderDropdownList(recentCache);
    }

    refreshCount();
  }

  async function refreshCount() {
    try {
      const res = await fetch("/notifications/unread-count", {
        credentials: "same-origin",
      });
      if (!res.ok) return;
      const data = await res.json();
      setBadgeCount(data.count);
    } catch {
      /* ignore */
    }
  }

  function openDropdown() {
    if (!dropdown || !bellBtn) return;
    dropdownOpen = true;
    dropdown.classList.add("is-open");
    bellBtn.setAttribute("aria-expanded", "true");
    fetchRecent();

    if (desktopSupported() && Notification.permission === "default") {
      if (enableDesktopBtn) {
        enableDesktopBtn.classList.remove("hidden");
        enableDesktopBtn.textContent = "Enable desktop alerts";
      }
    }
  }

  function closeDropdown() {
    if (!dropdown || !bellBtn) return;
    dropdownOpen = false;
    dropdown.classList.remove("is-open");
    bellBtn.setAttribute("aria-expanded", "false");
  }

  function toggleDropdown() {
    if (dropdownOpen) closeDropdown();
    else openDropdown();
  }

  function updateDesktopPrompt() {
    if (!enableDesktopBtn) return;
    if (!desktopSupported()) {
      enableDesktopBtn.classList.add("hidden");
      return;
    }
    enableDesktopBtn.disabled = false;
    if (Notification.permission === "default") {
      enableDesktopBtn.classList.remove("hidden");
      enableDesktopBtn.textContent = "Enable desktop alerts";
    } else if (Notification.permission === "denied") {
      enableDesktopBtn.classList.remove("hidden");
      enableDesktopBtn.textContent = "Alerts blocked in browser";
      enableDesktopBtn.disabled = true;
    } else {
      enableDesktopBtn.classList.add("hidden");
      hideDesktopBanner();
    }
  }

  if (bellBtn) {
    bellBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleDropdown();
    });
  }

  document.addEventListener("click", (e) => {
    if (!dropdownOpen) return;
    if (panelRoot && !panelRoot.contains(e.target)) {
      closeDropdown();
    }
  });

  if (markAllBtn) {
    markAllBtn.addEventListener("click", async () => {
      await fetch("/notifications/read-all", {
        method: "PATCH",
        credentials: "same-origin",
      });
      recentCache = recentCache.map((n) => ({ ...n, read: true }));
      renderDropdownList(recentCache);
      setBadgeCount(0);
    });
  }

  if (enableDesktopBtn) {
    enableDesktopBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (Notification.permission === "denied") return;
      await requestDesktopPermission();
    });
  }

  if (desktopBannerEnable) {
    desktopBannerEnable.addEventListener("click", () => {
      requestDesktopPermission();
    });
  }

  if (desktopBannerDismiss) {
    desktopBannerDismiss.addEventListener("click", () => {
      localStorage.setItem(DESKTOP_DISMISSED_KEY, "1");
      hideDesktopBanner();
    });
  }

  if (typeof io !== "undefined") {
    const socket = io({ withCredentials: true });

    socket.on("notification", handleIncoming);

    socket.on("new_message", (payload) => {
      document.dispatchEvent(
        new CustomEvent("nullstay:new_message", { detail: payload }),
      );
    });

    socket.on("connect", () => {
      refreshCount();
    });

    socket.on("connect_error", () => {
      /* session may have expired */
    });
  }

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refreshCount();
  });

  updateDesktopPrompt();

  if (desktopSupported() && Notification.permission === "default") {
    if (localStorage.getItem(DESKTOP_DISMISSED_KEY) !== "1") {
      setTimeout(showDesktopBanner, 1500);
    }
  }

  if (Notification.permission === "granted") {
    registerPushSubscription().catch(() => {});
  }

  refreshCount();
})();
