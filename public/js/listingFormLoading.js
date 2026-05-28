document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("multiStepForm");
  const submitBtn = document.getElementById("submitBtn");
  if (!form || !submitBtn) return;

  const defaultLabel = submitBtn.innerHTML;

  form.addEventListener(
    "submit",
    () => {
      if (!form.checkValidity()) return;
      submitBtn.disabled = true;
      submitBtn.classList.add("opacity-70", "pointer-events-none");
      submitBtn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    },
    true,
  );

  window.addEventListener("pageshow", () => {
    submitBtn.disabled = false;
    submitBtn.classList.remove("opacity-70", "pointer-events-none");
    submitBtn.innerHTML = defaultLabel;
  });
});
