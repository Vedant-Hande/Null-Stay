document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".image-upload-field").forEach(initImageUploadField);
});

function initImageUploadField(field) {
  const input = field.querySelector(".image-upload-input");
  const dropzone = field.querySelector(".image-upload-dropzone");
  const emptyState = field.querySelector(".upload-empty-state");
  const previewState = field.querySelector(".upload-preview-state");
  const previewImg = field.querySelector(".upload-preview-img");
  const previewName = field.querySelector(".upload-preview-name");
  const previewSize = field.querySelector(".upload-preview-size");
  const changeBtn = field.querySelector(".upload-change-btn");
  const removeBtn = field.querySelector(".upload-remove-btn");
  const initialUrl = field.dataset.initialUrl || "";

  if (!input || !dropzone) return;

  const showEmpty = () => {
    emptyState?.classList.remove("hidden");
    previewState?.classList.add("hidden");
    if (previewImg && !initialUrl) previewImg.removeAttribute("src");
  };

  const showPreview = (name, sizeText, src) => {
    emptyState?.classList.add("hidden");
    previewState?.classList.remove("hidden");
    if (previewImg && src) previewImg.src = src;
    if (previewName) previewName.textContent = name;
    if (previewSize) previewSize.textContent = sizeText;
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      showPreview(file.name, formatSize(file.size), e.target.result);
      input.classList.add("is-touched");
    };
    reader.readAsDataURL(file);
  };

  const openPicker = () => input.click();

  dropzone.addEventListener("click", (e) => {
    if (e.target.closest("button")) return;
    openPicker();
  });

  dropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPicker();
    }
  });

  changeBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    openPicker();
  });

  removeBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    input.value = "";
    input.classList.add("is-touched");

    if (initialUrl) {
      showPreview("Current photo", "Upload a new file to replace", initialUrl);
    } else {
      showEmpty();
    }
  });

  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (file) handleFile(file);
    else if (initialUrl) {
      showPreview("Current photo", "Upload a new file to replace", initialUrl);
    } else {
      showEmpty();
    }
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add("border-[#FF385C]", "bg-rose-50/50");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove("border-[#FF385C]", "bg-rose-50/50");
    });
  });

  dropzone.addEventListener("drop", (e) => {
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    input.files = dataTransfer.files;
    handleFile(file);
  });

  if (initialUrl && previewImg) {
    previewImg.src = initialUrl;
  }
}
