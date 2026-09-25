/**
 * NullStay UI — toasts & confirm dialogs (replaces alert/confirm)
 */
(function () {
  const TOAST_ROOT_ID = "nullstayToastRoot";
  let confirmResolve = null;

  function ensureToastRoot() {
    let root = document.getElementById(TOAST_ROOT_ID);
    if (!root) {
      root = document.createElement("div");
      root.id = TOAST_ROOT_ID;
      root.setAttribute("aria-live", "polite");
      root.setAttribute("aria-atomic", "true");
      document.body.appendChild(root);
    }
    return root;
  }

  function toast(message, type = "info", duration = 4500) {
    const root = ensureToastRoot();
    const el = document.createElement("div");
    el.className = `nullstay-toast nullstay-toast--${type}`;
    el.setAttribute("role", type === "error" ? "alert" : "status");

    el.innerHTML = `
      <div class="nullstay-toast__accent" aria-hidden="true"></div>
      <div class="nullstay-toast__body">
        <p class="nullstay-toast__message"></p>
      </div>
      <button type="button" class="nullstay-toast__close" aria-label="Dismiss">&times;</button>
    `;

    el.querySelector(".nullstay-toast__message").textContent = String(message);
    const dismiss = () => removeToast(el);
    el.querySelector(".nullstay-toast__close").addEventListener("click", dismiss);

    root.appendChild(el);
    requestAnimationFrame(() => el.classList.add("nullstay-toast--visible"));

    const timer = setTimeout(dismiss, duration);
    el._toastTimer = timer;
    return el;
  }

  function removeToast(el) {
    if (!el || el._removed) return;
    el._removed = true;
    clearTimeout(el._toastTimer);
    el.classList.remove("nullstay-toast--visible");
    el.classList.add("nullstay-toast--leaving");
    setTimeout(() => el.remove(), 350);
  }

  function openConfirmModal(options) {
    const modal = document.getElementById("nullstayConfirmModal");
    const content = document.getElementById("nullstayConfirmModalContent");
    const titleEl = document.getElementById("nullstayConfirmTitle");
    const messageEl = document.getElementById("nullstayConfirmMessage");
    const okBtn = document.getElementById("nullstayConfirmOk");

    if (!modal || !content) {
      return Promise.resolve(window.confirm(options.message || "Continue?"));
    }

    const {
      title = "Are you sure?",
      message = "",
      confirmText = "Confirm",
      cancelText = "Cancel",
      danger = false,
    } = options;

    titleEl.textContent = title;
    messageEl.textContent = message;
    okBtn.textContent = confirmText;
    document.getElementById("nullstayConfirmCancel").textContent = cancelText;

    okBtn.className = danger
      ? "flex-1 py-3 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition duration-200"
      : "flex-1 py-3 text-sm font-bold text-white bg-gray-900 hover:bg-black rounded-xl shadow-md transition duration-200";

    modal.classList.remove("hidden");
    modal.classList.add("nullstay-confirm-open");
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => {
      content.classList.remove("scale-95", "opacity-0");
      content.classList.add("scale-100", "opacity-100");
    });

    return new Promise((resolve) => {
      confirmResolve = resolve;
    });
  }

  function closeConfirmModal(result) {
    const modal = document.getElementById("nullstayConfirmModal");
    const content = document.getElementById("nullstayConfirmModalContent");

    if (modal && content) {
      content.classList.remove("scale-100", "opacity-100");
      content.classList.add("scale-95", "opacity-0");
      setTimeout(() => {
        modal.classList.add("hidden");
        modal.classList.remove("nullstay-confirm-open");
        document.body.style.overflow = "";
      }, 200);
    }

    if (confirmResolve) {
      confirmResolve(result);
      confirmResolve = null;
    }
  }

  function confirm(options) {
    return openConfirmModal(typeof options === "string" ? { message: options } : options);
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("nullstayConfirmOk")?.addEventListener("click", () => {
      closeConfirmModal(true);
    });
    document.getElementById("nullstayConfirmCancel")?.addEventListener("click", () => {
      closeConfirmModal(false);
    });
    document.getElementById("nullstayConfirmModal")?.addEventListener("click", (e) => {
      if (e.target.id === "nullstayConfirmModal") closeConfirmModal(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && confirmResolve) closeConfirmModal(false);
    });

    document.addEventListener("submit", (e) => {
      const form = e.target;
      if (!(form instanceof HTMLFormElement)) return;
      const msg = form.getAttribute("data-confirm");
      if (!msg) return;

      e.preventDefault();
      confirm({
        title: form.getAttribute("data-confirm-title") || "Confirm action",
        message: msg,
        confirmText: form.getAttribute("data-confirm-ok") || "Yes, continue",
        cancelText: form.getAttribute("data-confirm-cancel") || "Cancel",
        danger: form.getAttribute("data-confirm-danger") === "true",
      }).then((ok) => {
        if (ok) {
          form.removeAttribute("data-confirm");
          form.removeAttribute("data-confirm-title");
          form.removeAttribute("data-confirm-ok");
          form.removeAttribute("data-confirm-cancel");
          form.removeAttribute("data-confirm-danger");
          form.submit();
        }
      });
    });
  });

  const api = {
    toast,
    success: (msg, d) => toast(msg, "success", d),
    error: (msg, d) => toast(msg, "error", d),
    warning: (msg, d) => toast(msg, "warning", d),
    info: (msg, d) => toast(msg, "info", d),
    confirm,
  };

  window.NullStayUI = api;
})();
