export const FLASH_KEYS = {
  SUCCESS: "success",
  ERROR: "error",
};

export const FLASH_MESSAGES = {
  LISTING: {
    CREATE_SUCCESS: "Successfully created a new listing!",
    UPDATE_SUCCESS: "Listing successfully updated!",
    DELETE_SUCCESS: "Listing successfully deleted!",
    CREATE_ERROR: "Failed to create listing.",
    UPDATE_ERROR: "Failed to update listing.",
    DELETE_ERROR: "Failed to delete listing.",
    NOT_FOUND: "Listing not found.",
  },
  REVIEW: {
    CREATE_SUCCESS: "Successfully posted your review!",
    DELETE_SUCCESS: "Review deleted successfully!",
    CREATE_ERROR: "Failed to post review.",
    DELETE_ERROR: "Failed to delete review.",
    NOT_FOUND: "Review not found.",
  },
  GENERAL: {
    SOMETHING_WENT_WRONG: "Something went wrong. Please try again.",
    UNAUTHORIZED: "You are not authorized to perform this action.",
  }
};

export const REGEX = {
  EMAIL: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
};

export const DEFAULTS = {
  IMAGE_URL: "https://images.unsplash.com/photo-1625505826533-5c80aca7d157?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
};

export const LISTING_MAX_GALLERY_IMAGES = 5;

export const DEFAULT_CLEANING_FEE = 1500;
export const DEFAULT_SERVICE_FEE = 2100;

export const BOOKING_FLASH = {
  CREATED: "Your reservation is confirmed!",
  REQUEST_SENT: "Booking request sent! The host will respond soon.",
  CANCELLED: "Booking cancelled.",
  ACCEPTED: "Booking accepted.",
  REJECTED: "Booking declined.",
  NOT_FOUND: "Booking not found.",
  DATES_UNAVAILABLE: "Those dates are no longer available.",
  OWN_LISTING: "You cannot book your own listing.",
  UNAUTHORIZED: "You are not allowed to manage this booking.",
  PAYMENT_DECLINED:
    "Payment declined. Please try another card or payment method.",
  PAYMENT_FAILED: "Payment could not be completed. Please try again.",
  RAZORPAY_NOT_CONFIGURED:
    "Online payments are not configured. Contact support or try again later.",
};

/** Per-file upload limit (must match middleware/uploadMiddleware.js) */
export const MAX_IMAGE_FILE_BYTES = 5 * 1024 * 1024;

export const ERROR_MESSAGES = {
  VALIDATION: {
    EMAIL_REQUIRED: "Email is required",
    EMAIL_INVALID: "Please fill a valid email address",
    USERNAME_REQUIRED: "Username is required",
    TITLE_REQUIRED: "Title is required",
    TITLE_MAX_LENGTH: "Title cannot be more than 50 characters",
    DESC_REQUIRED: "Description is required",
    DESC_MAX_LENGTH: "Description cannot be more than 500 characters",
    PRICE_REQUIRED: "Price is required",
    PRICE_MIN: "Price must be at least ₹100",
    LOCATION_REQUIRED: "Location is required",
    LOCATION_MAX_LENGTH: "Location cannot be more than 100 characters",
    COUNTRY_REQUIRED: "Country is required",
    COUNTRY_MAX_LENGTH: "Country cannot be more than 50 characters",
  }
};
