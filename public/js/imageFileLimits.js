/** Must match middleware/uploadMiddleware.js fileSize limit */
const MAX_IMAGE_FILE_BYTES = 5 * 1024 * 1024;

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageFileTooLarge(file) {
  return file && file.size > MAX_IMAGE_FILE_BYTES;
}

function imageFileSizeError(file) {
  return `"${file.name}" is ${formatFileSize(file.size)}. Each image must be 5 MB or smaller.`;
}

window.MAX_IMAGE_FILE_BYTES = MAX_IMAGE_FILE_BYTES;
window.isImageFileTooLarge = isImageFileTooLarge;
window.imageFileSizeError = imageFileSizeError;
window.formatImageFileSize = formatFileSize;
