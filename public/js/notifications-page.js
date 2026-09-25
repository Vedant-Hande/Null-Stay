(function () {
  document.querySelectorAll(".notification-inbox-item").forEach((link) => {
    link.addEventListener("click", () => {
      const id = link.dataset.notificationId;
      if (!id || link.classList.contains("is-read")) return;
      fetch(`/notifications/${id}/read`, {
        method: "PATCH",
        credentials: "same-origin",
      }).catch(() => {});
    });
  });

  const markAllForm = document.querySelector(".js-mark-all-read");
  if (markAllForm) {
    markAllForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await fetch("/notifications/read-all", {
        method: "PATCH",
        credentials: "same-origin",
      });
      window.location.reload();
    });
  }
})();
