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
