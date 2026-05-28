document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".gallery-upload-field").forEach(initGalleryUpload);
});

function initGalleryUpload(field) {
  const input = field.querySelector(".gallery-upload-input");
  const dropzone = field.querySelector(".gallery-upload-dropzone");
  const newPreviewWrap = field.querySelector(".gallery-new-preview");
  const newGrid = field.querySelector(".gallery-new-grid");
  const sizeError = field.querySelector(".gallery-size-error");
  const maxTotal = parseInt(field.dataset.max, 10) || 5;

  if (!input || !dropzone) return;

  const selectedFiles = [];

  const countExisting = () =>
    field.querySelectorAll(".existing-gallery-item:not(.marked-remove)").length;

  const countNew = () => selectedFiles.length;

  const hasRoomFor = (count = 1) => countExisting() + countNew() + count <= maxTotal;

  const showSizeError = (message) => {
    if (!sizeError) return;
    sizeError.textContent = message;
    sizeError.classList.remove("hidden");
    dropzone.classList.add("border-red-500", "bg-red-50");
  };

  const clearSizeError = () => {
    sizeError?.classList.add("hidden");
    dropzone.classList.remove("border-red-500", "bg-red-50");
  };

  const renderNewPreviews = () => {
    if (!newGrid || !newPreviewWrap) return;

    newGrid.innerHTML = "";
    if (selectedFiles.length === 0) {
      newPreviewWrap.classList.add("hidden");
      return;
    }

    newPreviewWrap.classList.remove("hidden");
    selectedFiles.forEach((file, index) => {
      const card = document.createElement("div");
      card.className =
        "relative rounded-xl overflow-hidden border border-gray-200 shadow-sm h-28";
      const img = document.createElement("img");
      img.className = "h-full w-full object-cover";
      img.alt = file.name;

      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className =
        "absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white hover:bg-red-600 transition";
      removeBtn.innerHTML = '<i class="fa-solid fa-xmark text-xs"></i>';
      removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        selectedFiles.splice(index, 1);
        syncInputFiles();
        renderNewPreviews();
        if (selectedFiles.length === 0) clearSizeError();
      });

      card.append(img, removeBtn);
      newGrid.appendChild(card);
    });
  };

  const syncInputFiles = () => {
    const dataTransfer = new DataTransfer();
    selectedFiles.forEach((file) => dataTransfer.items.add(file));
    input.files = dataTransfer.files;
  };

  const addFiles = async (fileList) => {
    const incoming = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    const rejected = [];

    for (const file of incoming) {
      if (typeof window.isImageFileTooLarge === "function" && window.isImageFileTooLarge(file)) {
        rejected.push(file);
        continue;
      }

      if (!hasRoomFor(1)) {
        alert(`You can upload at most ${maxTotal} additional photos.`);
        break;
      }

      let processed = file;
      if (typeof window.compressImage === "function") {
        try {
          processed = await window.compressImage(file);
        } catch {
          processed = file;
        }
      }

      const duplicate = selectedFiles.some(
        (f) => f.name === processed.name && f.size === processed.size,
      );
      if (!duplicate) selectedFiles.push(processed);
    }

    if (rejected.length) {
      const lines = rejected.map((f) =>
        typeof window.imageFileSizeError === "function"
          ? window.imageFileSizeError(f)
          : `${f.name} is too large (max 5 MB).`,
      );
      showSizeError(
        rejected.length === 1
          ? lines[0]
          : `${rejected.length} files skipped — max 5 MB each: ${rejected.map((f) => f.name).join(", ")}`,
      );
    } else {
      clearSizeError();
    }

    syncInputFiles();
    renderNewPreviews();
  };

  dropzone.addEventListener("click", () => input.click());

  dropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      input.click();
    }
  });

  input.addEventListener("change", () => {
    void addFiles(input.files);
    // Do NOT set input.value = "" — it clears files synced via DataTransfer before submit
  });

  const form = field.closest("form");
  if (form) {
    form.addEventListener(
      "submit",
      () => {
        if (selectedFiles.length > 0) syncInputFiles();
      },
      true,
    );
  }

  ["dragenter", "dragover"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.add("border-[#FF385C]", "bg-rose-50/50");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.remove("border-[#FF385C]", "bg-rose-50/50");
    });
  });

  dropzone.addEventListener("drop", (e) => {
    void addFiles(e.dataTransfer?.files);
  });

  field.querySelectorAll(".gallery-remove-existing").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const card = btn.closest(".existing-gallery-item");
      if (!card) return;

      const filename = card.dataset.filename;
      const marked = card.classList.toggle("marked-remove");

      if (marked) {
        card.classList.add("opacity-40", "ring-2", "ring-red-400");
        const hidden = document.createElement("input");
        hidden.type = "hidden";
        hidden.name = "removeSubImages[]";
        hidden.value = filename;
        hidden.className = "remove-sub-hidden";
        card.appendChild(hidden);
      } else {
        card.classList.remove("opacity-40", "ring-2", "ring-red-400");
        card.querySelector(".remove-sub-hidden")?.remove();
      }
    });
  });
}
